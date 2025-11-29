-- Create notifications table
create table if not exists public.notifications (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('info', 'warning', 'invite', 'alert')),
    message text not null,
    read boolean not null default false,
    created_at timestamp with time zone not null default now(),
    primary key (id)
);

-- Add RLS to notifications
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

-- Add status to households
alter table public.households 
add column if not exists status text not null default 'active' check (status in ('active', 'suspended'));

-- Add is_household_head to members
alter table public.members
add column if not exists is_household_head boolean not null default false;
