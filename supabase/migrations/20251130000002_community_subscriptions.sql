-- Add current_period_end to community_subscription_settings
alter table public.community_subscription_settings
add column if not exists current_period_end timestamp with time zone;

-- Create subscription_payments table
create table if not exists public.subscription_payments (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id),
  amount numeric not null,
  reference text not null unique,
  status text not null check (status in ('success', 'failed', 'pending')),
  payment_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for subscription_payments
alter table public.subscription_payments enable row level security;

drop policy if exists "Super Admins can view all subscription payments" on public.subscription_payments;
create policy "Super Admins can view all subscription payments"
  on public.subscription_payments for select
  using ( public.is_super_admin() );

drop policy if exists "Community Managers can view their community payments" on public.subscription_payments;
create policy "Community Managers can view their community payments"
  on public.subscription_payments for select
  using (
    exists (
      select 1 from public.members
      where community_id = public.subscription_payments.community_id
      and user_id = auth.uid()
      and role = 'community_manager'
    )
  );
