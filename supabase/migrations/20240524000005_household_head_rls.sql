-- Allow Household Heads to update members in their own household
create policy "Household heads can update members in their household"
on public.members for update
using (
  exists (
    select 1 from public.members as head
    where head.user_id = auth.uid()
    and head.is_household_head = true
    and head.household_id = public.members.household_id
    and head.community_id = public.members.community_id
  )
);

-- Allow Household Heads to insert members (for invites/adding)
-- This is tricky because usually they invite by email (creating a profile/member).
-- For now, let's allow them to update existing members to add them to household?
-- Or if we are creating new members (invites), we need INSERT permission.

-- Let's assume invite creates a member record.
create policy "Household heads can insert members to their household"
on public.members for insert
with check (
  -- The new member must belong to the same household as the head
  exists (
    select 1 from public.members as head
    where head.user_id = auth.uid()
    and head.is_household_head = true
    and head.household_id = public.members.household_id
    and head.community_id = public.members.community_id
  )
);
