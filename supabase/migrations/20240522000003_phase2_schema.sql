-- Add address to communities
alter table public.communities add column address text;

-- Add unit_number to members
alter table public.members add column unit_number text;

-- Create member_status enum
create type public.member_status as enum ('pending', 'approved', 'rejected');

-- Add status to members
alter table public.members add column status public.member_status default 'pending' not null;

-- Update existing members to approved
update public.members set status = 'approved';

-- Drop existing check constraint on role
alter table public.members drop constraint members_role_check;

-- Update existing roles to new values
update public.members set role = 'community_manager' where role = 'admin';
update public.members set role = 'guard' where role = 'moderator';
update public.members set role = 'resident' where role = 'member';

-- Add new check constraint on role
alter table public.members add constraint members_role_check check (role in ('community_manager', 'guard', 'resident'));
