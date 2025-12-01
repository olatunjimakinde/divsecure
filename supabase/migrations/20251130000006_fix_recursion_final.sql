-- Final fix for recursion: Dynamically drop ALL policies on members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.members';
    END LOOP;
END $$;

-- Recreate ONLY the safe policies

-- 1. Viewable by everyone (Safe)
create policy "Members are viewable by everyone."
  on public.members for select
  using ( true );

-- 2. Community owners can manage (Safe - queries communities)
create policy "Community owners can manage members."
  on public.members for all
  using ( exists (
    select 1 from public.communities
    where id = public.members.community_id and owner_id = auth.uid()
  ));

-- 3. Users can join (Safe)
create policy "Users can join as members."
  on public.members for insert
  with check ( auth.uid() = user_id );

-- 4. Super Admins (Safe - queries profiles)
create policy "Super Admins can do everything on members"
  on public.members for all
  using ( public.is_super_admin() );

-- 5. Household heads (Safe - uses security definer function)
-- Ensure function exists first
create or replace function public.is_household_head_of(target_household_id uuid, target_community_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.members
    where user_id = auth.uid()
    and is_household_head = true
    and household_id = target_household_id
    and community_id = target_community_id
  );
end;
$$ language plpgsql security definer;

create policy "Household heads can update members in their household"
on public.members for update
using (
  public.is_household_head_of(household_id, community_id)
);

create policy "Household heads can insert members to their household"
on public.members for insert
with check (
  public.is_household_head_of(household_id, community_id)
);
