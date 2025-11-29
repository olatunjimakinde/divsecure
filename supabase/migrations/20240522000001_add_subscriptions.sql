-- Add is_super_admin to profiles
alter table public.profiles
add column is_super_admin boolean default false;

-- Create Subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid')),
  plan_id text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Subscriptions
alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription."
  on public.subscriptions for select
  using ( auth.uid() = user_id );

-- Only service role (or admins via logic) should be able to insert/update subscriptions for now
-- But for testing, we might want to allow users to insert if we are mocking it client side? 
-- No, let's keep it strict. We will insert via SQL editor or admin logic.
