-- Reset all policies on members to fix recursion

-- 1. Ensure helper function exists
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

-- 2. Drop ALL known and potential policies on members
drop policy if exists "Members are viewable by everyone." on public.members;
drop policy if exists "Community owners can manage members." on public.members;
drop policy if exists "Users can join as members." on public.members;
drop policy if exists "Household heads can update members in their household" on public.members;
drop policy if exists "Household heads can insert members to their household" on public.members;
drop policy if exists "Super Admins can do everything on members" on public.members;
-- Drop potential policies from other migrations
drop policy if exists "Household heads can manage members" on public.members;
drop policy if exists "Guards can view members" on public.members;
drop policy if exists "Security staff can view members" on public.members;

-- 3. Recreate essential policies

-- Viewable by everyone (Safe)
create policy "Members are viewable by everyone."
  on public.members for select
  using ( true );

-- Community owners can manage (Safe - queries communities)
create policy "Community owners can manage members."
  on public.members for all
  using ( exists (
    select 1 from public.communities
    where id = public.members.community_id and owner_id = auth.uid()
  ));

-- Users can join (Safe)
create policy "Users can join as members."
  on public.members for insert
  with check ( auth.uid() = user_id );

-- Super Admins (Safe - queries profiles)
create policy "Super Admins can do everything on members"
  on public.members for all
  using ( public.is_super_admin() );

-- Household heads (Safe - uses security definer function)
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
