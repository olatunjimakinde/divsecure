-- Migration to fix RLS vulnerabilities by enforcing strict community isolation

-- 1. Create a secure helper function to get community IDs for the current user
-- This function returns a set of community IDs where the user is a member (including pending)
-- We use SECURITY DEFINER to ensure it can access the members table regardless of other policies (though recursive policies are a pain, so we be careful)
-- Actually, since we are using this IN a policy, we need to be careful about infinite recursion.
-- IF we use this function inside "Members" policy, it queries "Members". Recursion!
-- SO: For the "Members" table policy, we CANNOT use this function if it queries "Members".
-- We can use this function for *other* tables (Posts, Channels, Events).

CREATE OR REPLACE FUNCTION public.get_my_community_ids()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT community_id
  FROM public.members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update POSTS Policies
DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;

CREATE POLICY "Posts are viewable by community members."
  ON public.posts FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM public.channels
      WHERE community_id IN (
        SELECT community_id FROM public.members WHERE user_id = auth.uid()
      )
    )
  );

-- 3. Update CHANNELS Policies
DROP POLICY IF EXISTS "Channels are viewable by everyone." ON public.channels;

CREATE POLICY "Channels are viewable by community members."
  ON public.channels FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- 4. Update EVENTS Policies
DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.events;

CREATE POLICY "Events are viewable by community members."
  ON public.events FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- 5. Update MEMBERS Policies
-- This is the tricky one. We need to avoid recursion.
-- Old Policy: "Members are viewable by everyone." (using true)
-- New Goal: You can only see members of communities you are in.

DROP POLICY IF EXISTS "Members are viewable by everyone." ON public.members;

CREATE POLICY "Members are viewable by fellow community members."
  ON public.members FOR SELECT
  USING (
    community_id IN (
        -- We have to inline this to avoid function-call recursion issues potentially, 
        -- though modern PG handles some. But safe bet:
        SELECT m.community_id 
        FROM public.members m 
        WHERE m.user_id = auth.uid()
    )
  );
  
-- Note: The above policy for members might still cause recursion if PG implementation tries to check the subquery using the policy itself.
-- To break recursion in RLS involving the same table:
-- The inner query `FROM public.members m` will try to use the SELECT policy.
-- To avoid this, we can either:
-- a) Use a SECURITY DEFINER function that bypasses RLS (we created `get_my_community_ids` above).
--    If that function is SECURITY DEFINER, it runs with owner privileges (bypassing RLS), so it won't trigger the policy recursively.
-- Let's try using the function for Members too, since we made it SECURITY DEFINER.

DROP POLICY IF EXISTS "Members are viewable by fellow community members." ON public.members;

CREATE POLICY "Members are viewable by fellow community members"
  ON public.members FOR SELECT
  USING (
    community_id IN ( SELECT public.get_my_community_ids() )
  );
