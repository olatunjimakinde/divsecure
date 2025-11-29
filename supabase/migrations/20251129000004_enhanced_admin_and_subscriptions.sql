-- Helper function to check if user is super admin
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and is_super_admin = true
  );
end;
$$ language plpgsql security definer;

-- Update RLS Policies to allow Super Admin full access

-- Communities
create policy "Super Admins can do everything on communities"
  on public.communities for all
  using ( public.is_super_admin() );

-- Members
create policy "Super Admins can do everything on members"
  on public.members for all
  using ( public.is_super_admin() );

-- Channels
create policy "Super Admins can do everything on channels"
  on public.channels for all
  using ( public.is_super_admin() );

-- Posts
create policy "Super Admins can do everything on posts"
  on public.posts for all
  using ( public.is_super_admin() );

-- Events
create policy "Super Admins can do everything on events"
  on public.events for all
  using ( public.is_super_admin() );

-- Visitor Logs
create policy "Super Admins can do everything on visitor_logs"
  on public.visitor_logs for all
  using ( public.is_super_admin() );

-- Visitor Codes
create policy "Super Admins can do everything on visitor_codes"
  on public.visitor_codes for all
  using ( public.is_super_admin() );

-- Notifications
create policy "Super Admins can do everything on notifications"
  on public.notifications for all
  using ( public.is_super_admin() );

-- Notification Preferences
create policy "Super Admins can do everything on notification_preferences"
  on public.notification_preferences for all
  using ( public.is_super_admin() );


-- Admin Management
alter table public.profiles 
add column if not exists admin_role text check (admin_role in ('super_admin', 'support_admin', 'billing_admin'));

-- Subscription Schema

-- Subscription Plans
create table if not exists public.subscription_plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null,
  features jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscription_plans enable row level security;

create policy "Public read access to active plans"
  on public.subscription_plans for select
  using ( is_active = true or public.is_super_admin() );

create policy "Super Admins can manage plans"
  on public.subscription_plans for all
  using ( public.is_super_admin() );

-- Global Subscription Settings
create table if not exists public.global_subscription_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.global_subscription_settings enable row level security;

create policy "Super Admins can manage global settings"
  on public.global_subscription_settings for all
  using ( public.is_super_admin() );

create policy "Authenticated users can read global settings"
  on public.global_subscription_settings for select
  using ( auth.role() = 'authenticated' );

-- Community Subscription Settings
create table if not exists public.community_subscription_settings (
  community_id uuid references public.communities(id) on delete cascade primary key,
  plan_id uuid references public.subscription_plans(id),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing')),
  custom_settings jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.community_subscription_settings enable row level security;

create policy "Super Admins can manage community subscriptions"
  on public.community_subscription_settings for all
  using ( public.is_super_admin() );

create policy "Community Managers can view their subscription"
  on public.community_subscription_settings for select
  using (
    exists (
      select 1 from public.members
      where community_id = public.community_subscription_settings.community_id
      and user_id = auth.uid()
      and role = 'community_manager'
    )
  );

-- Seed Basic Plans
insert into public.subscription_plans (name, price, features) values
('Free', 0, '{"max_residents": 50, "max_guards": 2}'::jsonb),
('Pro', 99, '{"max_residents": 500, "max_guards": 10, "priority_support": true}'::jsonb),
('Enterprise', 499, '{"max_residents": -1, "max_guards": -1, "dedicated_support": true}'::jsonb)
on conflict do nothing;
