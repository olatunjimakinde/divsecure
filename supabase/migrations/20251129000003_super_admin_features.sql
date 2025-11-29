-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Create features table
create table if not exists public.features (
  key text primary key,
  name text not null,
  description text,
  default_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create community_features table
create table if not exists public.community_features (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  feature_key text references public.features(key) on delete cascade not null,
  enabled boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(community_id, feature_key)
);

-- Create role_features table
create table if not exists public.role_features (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  role text not null, -- 'resident', 'guard', etc.
  feature_key text references public.features(key) on delete cascade not null,
  enabled boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(community_id, role, feature_key)
);

-- Enable RLS
alter table public.features enable row level security;
alter table public.community_features enable row level security;
alter table public.role_features enable row level security;

-- Policies

-- Features: Public read
drop policy if exists "Features are viewable by everyone" on public.features;
create policy "Features are viewable by everyone" on public.features for select using (true);

-- Community Features:
drop policy if exists "Managers can view their community features" on public.community_features;
create policy "Managers can view their community features"
  on public.community_features for select
  using (
    exists (
      select 1 from public.members
      where community_id = public.community_features.community_id
      and user_id = auth.uid()
      and role in ('community_manager', 'head_of_security')
    )
  );

-- Role Features:
drop policy if exists "Managers can view role features" on public.role_features;
create policy "Managers can view role features"
  on public.role_features for select
  using (
    exists (
      select 1 from public.members
      where community_id = public.role_features.community_id
      and user_id = auth.uid()
      and role in ('community_manager', 'head_of_security')
    )
  );

drop policy if exists "Managers can update role features" on public.role_features;
create policy "Managers can update role features"
  on public.role_features for all
  using (
    exists (
      select 1 from public.members
      where community_id = public.role_features.community_id
      and user_id = auth.uid()
      and role in ('community_manager', 'head_of_security')
    )
  );

-- Super Admin Policies
drop policy if exists "Super Admins have full access to features" on public.features;
create policy "Super Admins have full access to features"
  on public.features for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
  );

drop policy if exists "Super Admins have full access to community_features" on public.community_features;
create policy "Super Admins have full access to community_features"
  on public.community_features for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
  );

drop policy if exists "Super Admins have full access to role_features" on public.role_features;
create policy "Super Admins have full access to role_features"
  on public.role_features for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
  );

-- Seed Features
insert into public.features (key, name, description, default_enabled) values
('visitor_management', 'Visitor Management', 'Allow residents to invite visitors and guards to verify them.', true),
('message_board', 'Message Board', 'Community discussions and announcements.', true),
('events', 'Events', 'Community event calendar.', true),
('billing', 'Billing & Payments', 'Manage subscriptions and payments.', true)
on conflict (key) do nothing;

-- Seed Super Admin
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sadmin@divsecure.com') THEN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'sadmin@divsecure.com',
      crypt('MAKinde1q2w3e4r', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Super Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Update profile (trigger should have created it, but we need to set is_super_admin)
    -- We might need to wait or just update. 
    -- If trigger is synchronous, it's there.
    UPDATE public.profiles
    SET is_super_admin = true
    WHERE id = new_user_id;
    
  ELSE
    -- User exists, ensure is_super_admin is true
    UPDATE public.profiles
    SET is_super_admin = true
    WHERE id = (SELECT id FROM auth.users WHERE email = 'sadmin@divsecure.com');
  END IF;
END $$;
