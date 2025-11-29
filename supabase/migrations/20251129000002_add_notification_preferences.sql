-- Create notifications table if it doesn't exist
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'visitor_arrival', 'announcement', 'security_alert'
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- Policies for notifications (Drop first to avoid errors)
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using ( auth.uid() = user_id );

drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert
  with check ( true ); 

drop policy if exists "Users can update their own notifications (mark as read)" on public.notifications;
create policy "Users can update their own notifications (mark as read)"
  on public.notifications for update
  using ( auth.uid() = user_id );


-- Create notification_preferences table
create table if not exists public.notification_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  community_id uuid references public.communities(id) on delete cascade not null,
  type text not null, -- 'visitor_arrival', 'announcement', 'security_alert'
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, community_id, type)
);

-- Enable RLS on notification_preferences
alter table public.notification_preferences enable row level security;

-- Policies for notification_preferences
drop policy if exists "Users can view their own preferences" on public.notification_preferences;
create policy "Users can view their own preferences"
  on public.notification_preferences for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert/update their own preferences" on public.notification_preferences;
create policy "Users can insert/update their own preferences"
  on public.notification_preferences for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );
