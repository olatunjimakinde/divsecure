-- Enhance security_messages for Direct and Group Messaging

-- 1. Add new columns
alter table public.security_messages
add column if not exists recipient_id uuid references public.profiles(id) on delete set null,
add column if not exists recipient_group text check (recipient_group in ('all_guards', 'community_manager', 'head_of_security', 'all_residents'));

-- 2. Update RLS Policies

-- Drop existing policies to recreate them with new logic
drop policy if exists "Guards can create messages." on public.security_messages;
drop policy if exists "Guards can view their own messages." on public.security_messages;
drop policy if exists "Managers can view community messages." on public.security_messages;
drop policy if exists "Managers can update messages." on public.security_messages;

-- Policy: Senders can view their own sent messages
create policy "Senders can view their own messages"
  on public.security_messages for select
  using ( auth.uid() = sender_id );

-- Policy: Recipients can view messages sent to them directly
create policy "Recipients can view direct messages"
  on public.security_messages for select
  using ( auth.uid() = recipient_id );

-- Policy: Group: Managers can view messages to 'community_manager'
create policy "Managers can view group messages"
  on public.security_messages for select
  using (
    recipient_group = 'community_manager'
    and exists (
      select 1 from public.members
      where community_id = public.security_messages.community_id
      and user_id = auth.uid()
      and role in ('community_manager', 'head_of_security') -- Head of Security often acts as manager-lite
    )
  );

-- Policy: Group: Guards can view messages to 'all_guards'
create policy "Guards can view group messages"
  on public.security_messages for select
  using (
    recipient_group = 'all_guards'
    and exists (
      select 1 from public.members
      where community_id = public.security_messages.community_id
      and user_id = auth.uid()
      and role in ('guard', 'head_of_security')
    )
  );

-- Policy: Group: Head of Security can view messages to 'head_of_security'
create policy "Head of Security can view group messages"
  on public.security_messages for select
  using (
    recipient_group = 'head_of_security'
    and exists (
      select 1 from public.members
      where community_id = public.security_messages.community_id
      and user_id = auth.uid()
      and role = 'head_of_security'
    )
  );

-- Policy: Creation (Insert)
-- Allow authenticated members of the community to send messages
create policy "Members can send messages"
  on public.security_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.members
      where community_id = public.security_messages.community_id
      and user_id = auth.uid()
      and status = 'approved'
    )
  );

-- Policy: Update (Mark as Read)
-- Recipients (Direct or Group Member) can update (e.g. mark as read)
-- Note: For group messages, 'is_read' is shared, which isn't ideal for groups but acceptable for MVP.
-- A better approach for groups is a separate 'message_reads' table, but we'll stick to simple for now.
create policy "Recipients can update messages"
  on public.security_messages for update
  using (
    (auth.uid() = recipient_id)
    or
    (recipient_group = 'community_manager' and exists (
      select 1 from public.members where community_id = public.security_messages.community_id and user_id = auth.uid() and role = 'community_manager'
    ))
    or
    (recipient_group = 'head_of_security' and exists (
      select 1 from public.members where community_id = public.security_messages.community_id and user_id = auth.uid() and role = 'head_of_security'
    ))
    or
    (recipient_group = 'all_guards' and exists (
      select 1 from public.members where community_id = public.security_messages.community_id and user_id = auth.uid() and role in ('guard', 'head_of_security')
    ))
  );
