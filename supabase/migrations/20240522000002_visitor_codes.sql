-- Create Visitor Codes table
create table public.visitor_codes (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  visitor_name text not null,
  access_code text not null,
  valid_from timestamp with time zone not null,
  valid_until timestamp with time zone not null,
  is_one_time boolean default true,
  used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(community_id, access_code)
);

-- Enable RLS on Visitor Codes
alter table public.visitor_codes enable row level security;

create policy "Hosts can view their own visitor codes."
  on public.visitor_codes for select
  using ( auth.uid() = host_id );

create policy "Hosts can create visitor codes."
  on public.visitor_codes for insert
  with check ( auth.uid() = host_id );

create policy "Community owners/admins can view all codes in their community."
  on public.visitor_codes for select
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('admin', 'moderator')
  ));

create policy "Community owners/admins can update codes (e.g. mark as used)."
  on public.visitor_codes for update
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('admin', 'moderator')
  ));
