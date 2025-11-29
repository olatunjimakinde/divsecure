-- Create households table
create table public.households (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  name text not null,
  contact_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(community_id, name)
);

-- Add household_id to members
alter table public.members 
add column household_id uuid references public.households(id) on delete set null;

-- Enable RLS
alter table public.households enable row level security;

-- RLS Policies
create policy "Community members can view households."
  on public.households for select
  using ( exists (
    select 1 from public.members
    where community_id = public.households.community_id
    and user_id = auth.uid()
  ));

create policy "Community admins can manage households."
  on public.households for all
  using ( exists (
    select 1 from public.members
    where community_id = public.households.community_id
    and user_id = auth.uid()
    and role in ('admin', 'community_manager')
  ));
