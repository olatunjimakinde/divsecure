-- Create Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Create Communities table
create table public.communities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Communities
alter table public.communities enable row level security;

create policy "Communities are viewable by everyone."
  on public.communities for select
  using ( true );

create policy "Authenticated users can create communities."
  on public.communities for insert
  with check ( auth.role() = 'authenticated' );

create policy "Owners can update their communities."
  on public.communities for update
  using ( auth.uid() = owner_id );

-- Create Members table
create table public.members (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('admin', 'moderator', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(community_id, user_id)
);

-- Enable RLS on Members
alter table public.members enable row level security;

create policy "Members are viewable by everyone."
  on public.members for select
  using ( true );

create policy "Community owners can manage members."
  on public.members for all
  using ( exists (
    select 1 from public.communities
    where id = public.members.community_id and owner_id = auth.uid()
  ));
  
create policy "Users can join as members."
  on public.members for insert
  with check ( auth.uid() = user_id );

-- Create Channels table
create table public.channels (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  name text not null,
  slug text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(community_id, slug)
);

-- Enable RLS on Channels
alter table public.channels enable row level security;

create policy "Channels are viewable by everyone."
  on public.channels for select
  using ( true );

create policy "Community owners can manage channels."
  on public.channels for all
  using ( exists (
    select 1 from public.communities
    where id = public.channels.community_id and owner_id = auth.uid()
  ));

-- Create Posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Posts
alter table public.posts enable row level security;

create policy "Posts are viewable by everyone."
  on public.posts for select
  using ( true );

create policy "Authenticated users can create posts."
  on public.posts for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own posts."
  on public.posts for update
  using ( auth.uid() = user_id );
  
create policy "Users can delete their own posts."
  on public.posts for delete
  using ( auth.uid() = user_id );

-- Create Events table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Events
alter table public.events enable row level security;

create policy "Events are viewable by everyone."
  on public.events for select
  using ( true );

create policy "Community owners can manage events."
  on public.events for all
  using ( exists (
    select 1 from public.communities
    where id = public.events.community_id and owner_id = auth.uid()
  ));

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
