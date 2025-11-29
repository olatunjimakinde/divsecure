-- Create Security Messages table
create table public.security_messages (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.security_messages enable row level security;

-- Policies

-- Guards can insert messages
create policy "Guards can create messages."
  on public.security_messages for insert
  with check (
    exists (
      select 1 from public.members
      where community_id = public.security_messages.community_id
      and user_id = auth.uid()
      and role in ('guard', 'head_of_security')
    )
    and auth.uid() = sender_id
  );

-- Guards can view their own messages
create policy "Guards can view their own messages."
  on public.security_messages for select
  using ( auth.uid() = sender_id );

-- Managers can view all messages in their community
create policy "Managers can view community messages."
  on public.security_messages for select
  using (
    exists (
      select 1 from public.members
      where community_id = public.security_messages.community_id
      and user_id = auth.uid()
      and role in ('community_manager', 'head_of_security')
    )
  );

-- Managers can update (mark as read)
create policy "Managers can update messages."
  on public.security_messages for update
  using (
    exists (
      select 1 from public.members
      where community_id = public.security_messages.community_id
      and user_id = auth.uid()
      and role in ('community_manager', 'head_of_security')
    )
  );
