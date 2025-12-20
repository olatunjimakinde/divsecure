-- Create Enums for status and priority
create type maintenance_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type maintenance_priority as enum ('low', 'medium', 'high', 'urgent');

-- Create Maintenance Requests Table
create table maintenance_requests (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references communities(id) on delete cascade not null,
  reporter_id uuid references profiles(id) on delete set null not null,
  unit_number text,
  title text not null,
  description text,
  images text[] default array[]::text[],
  status maintenance_status default 'pending' not null,
  priority maintenance_priority default 'low' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS Policies
alter table maintenance_requests enable row level security;

-- Residents can insert their own requests
create policy "Residents can insert their own requests"
on maintenance_requests for insert
to authenticated
with check (
  exists (
    select 1 from members
    where members.community_id = maintenance_requests.community_id
    and members.user_id = auth.uid()
    and members.role in ('resident', 'household_head', 'manager', 'admin') -- added manager/admin just in case
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
    and members.role in ('manager', 'admin', 'super_admin')
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
    and members.role in ('manager', 'admin', 'super_admin')
  )
);

-- Add real-time
alter publication supabase_realtime add table maintenance_requests;
