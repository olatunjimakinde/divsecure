-- Ensure Super Admin Access to ALL tables

-- 1. Helper function (ensure it exists)
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

-- 2. Ensure sadmin user is super admin
DO $$
DECLARE
  sadmin_id uuid;
BEGIN
  SELECT id INTO sadmin_id FROM auth.users WHERE email = 'sadmin@divsecure.com';
  
  IF sadmin_id IS NOT NULL THEN
    UPDATE public.profiles
    SET is_super_admin = true
    WHERE id = sadmin_id;
  END IF;
END $$;

-- 3. Add Super Admin Policies to ALL tables

-- Profiles
drop policy if exists "Super Admins can do everything on profiles" on public.profiles;
create policy "Super Admins can do everything on profiles"
  on public.profiles for all
  using ( public.is_super_admin() );

-- Communities
drop policy if exists "Super Admins can do everything on communities" on public.communities;
create policy "Super Admins can do everything on communities"
  on public.communities for all
  using ( public.is_super_admin() );

-- Members
drop policy if exists "Super Admins can do everything on members" on public.members;
create policy "Super Admins can do everything on members"
  on public.members for all
  using ( public.is_super_admin() );

-- Households
drop policy if exists "Super Admins can do everything on households" on public.households;
create policy "Super Admins can do everything on households"
  on public.households for all
  using ( public.is_super_admin() );

-- Visitor Logs
drop policy if exists "Super Admins can do everything on visitor_logs" on public.visitor_logs;
create policy "Super Admins can do everything on visitor_logs"
  on public.visitor_logs for all
  using ( public.is_super_admin() );

-- Visitor Codes
drop policy if exists "Super Admins can do everything on visitor_codes" on public.visitor_codes;
create policy "Super Admins can do everything on visitor_codes"
  on public.visitor_codes for all
  using ( public.is_super_admin() );

-- Subscription Payments
drop policy if exists "Super Admins can do everything on subscription_payments" on public.subscription_payments;
create policy "Super Admins can do everything on subscription_payments"
  on public.subscription_payments for all
  using ( public.is_super_admin() );

-- Community Subscription Settings
drop policy if exists "Super Admins can manage community subscriptions" on public.community_subscription_settings;
create policy "Super Admins can manage community subscriptions"
  on public.community_subscription_settings for all
  using ( public.is_super_admin() );

-- Subscription Plans
drop policy if exists "Super Admins can manage plans" on public.subscription_plans;
create policy "Super Admins can manage plans"
  on public.subscription_plans for all
  using ( public.is_super_admin() );

-- Channels
drop policy if exists "Super Admins can do everything on channels" on public.channels;
create policy "Super Admins can do everything on channels"
  on public.channels for all
  using ( public.is_super_admin() );

-- Posts
drop policy if exists "Super Admins can do everything on posts" on public.posts;
create policy "Super Admins can do everything on posts"
  on public.posts for all
  using ( public.is_super_admin() );

-- Events
drop policy if exists "Super Admins can do everything on events" on public.events;
create policy "Super Admins can do everything on events"
  on public.events for all
  using ( public.is_super_admin() );

-- Notifications
drop policy if exists "Super Admins can do everything on notifications" on public.notifications;
create policy "Super Admins can do everything on notifications"
  on public.notifications for all
  using ( public.is_super_admin() );

-- Notification Preferences
drop policy if exists "Super Admins can do everything on notification_preferences" on public.notification_preferences;
create policy "Super Admins can do everything on notification_preferences"
  on public.notification_preferences for all
  using ( public.is_super_admin() );

-- Features
drop policy if exists "Super Admins have full access to features" on public.features;
create policy "Super Admins have full access to features"
  on public.features for all
  using ( public.is_super_admin() );

-- Community Features
drop policy if exists "Super Admins have full access to community_features" on public.community_features;
create policy "Super Admins have full access to community_features"
  on public.community_features for all
  using ( public.is_super_admin() );

-- Role Features
drop policy if exists "Super Admins have full access to role_features" on public.role_features;
create policy "Super Admins have full access to role_features"
  on public.role_features for all
  using ( public.is_super_admin() );
