-- Create user_status enum
create type public.user_status as enum ('active', 'removed');

-- Add status and deleted_at to profiles
alter table public.profiles 
add column status public.user_status not null default 'active',
add column deleted_at timestamp with time zone;

-- Index for performance checks
create index idx_profiles_status on public.profiles(status);

-- Update RLS policies to handle removed users
-- Note: Middleware/Auth actions will primarily enforce this, but RLS adds a layer of safety.

-- Update profiles RLS
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( status = 'active' );

-- We will NOT restrict update/insert based on status here because a removed user can't log in anyway.
-- But we should ensure that 'removed' users, if they somehow have a token, can't access data.

-- Example: Restrict Members visibility
-- (We might not need to change EVERY RLS if the user can't authenticate, but it's good practice)
-- Ideally, if auth.uid() is a removed user, they see nothing.
-- Supabase Auth doesn't automatically invalidate tokens immediately on status change in custom table,
-- but our middleware will catch it.
