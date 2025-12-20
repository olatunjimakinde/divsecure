-- Fix RLS Policies to use correct role names ('community_manager' instead of 'manager')

-- Drop old policies to be safe
drop policy if exists "Residents can insert their own requests" on maintenance_requests;
drop policy if exists "Residents can view their own requests" on maintenance_requests;
drop policy if exists "Managers can view all requests in their community" on maintenance_requests;
drop policy if exists "Managers can update requests" on maintenance_requests;

-- Recreate Policies

-- Residents (and managers acting as residents for testing) can insert
create policy "Residents can insert their own requests"
on maintenance_requests for insert
to authenticated
with check (
  exists (
    select 1 from members
    where members.community_id = maintenance_requests.community_id
    and members.user_id = auth.uid()
    and members.role in ('resident', 'household_head', 'community_manager', 'admin')
  )
  and reporter_id = auth.uid()
);

-- Residents can view their own requests
create policy "Residents can view their own requests"
on maintenance_requests for select
to authenticated
using (
  reporter_id = auth.uid()
);

-- Managers/Admins can view all requests in their community
create policy "Managers can view all requests in their community"
on maintenance_requests for select
to authenticated
using (
  exists (
    select 1 from members
    where members.community_id = maintenance_requests.community_id
    and members.user_id = auth.uid()
    and members.role in ('community_manager', 'admin', 'super_admin')
  )
);

-- Managers/Admins can update requests (e.g., status)
create policy "Managers can update requests"
on maintenance_requests for update
to authenticated
using (
  exists (
    select 1 from members
    where members.community_id = maintenance_requests.community_id
    and members.user_id = auth.uid()
    and members.role in ('community_manager', 'admin', 'super_admin')
  )
);
