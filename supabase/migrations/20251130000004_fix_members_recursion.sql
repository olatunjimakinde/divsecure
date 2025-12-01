-- Fix infinite recursion in members policy

-- 1. Create a security definer function to check household head status
-- This function bypasses RLS on the members table to avoid recursion
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

-- 2. Drop recursive policies
drop policy if exists "Household heads can update members in their household" on public.members;
drop policy if exists "Household heads can insert members to their household" on public.members;

-- 3. Recreate policies using the function
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
