-- Subscriptions (SaaS)
DO $$ begin
    create type subscription_status as enum ('active', 'cancelled', 'past_due');
exception
    when duplicate_object then null;
end $$;

DO $$ begin
    create type subscription_plan as enum ('starter', 'growth', 'enterprise');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.subscriptions (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    plan_id subscription_plan not null,
    status subscription_status not null default 'active',
    current_period_end timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS for subscriptions
alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscription" on public.subscriptions;
create policy "Users can view their own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);

drop policy if exists "Users can create their own subscription" on public.subscriptions;
create policy "Users can create their own subscription"
    on public.subscriptions for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subscription" on public.subscriptions;
create policy "Users can update their own subscription"
    on public.subscriptions for update
    using (auth.uid() = user_id);


-- Billing (Community)
DO $$ begin
    create type bill_status as enum ('pending', 'paid', 'overdue', 'cancelled');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.bills (
    id uuid not null default gen_random_uuid() primary key,
    community_id uuid not null references public.communities(id) on delete cascade,
    household_id uuid not null references public.households(id) on delete cascade,
    title text not null,
    description text,
    amount numeric(10, 2) not null,
    due_date date not null,
    status bill_status not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS for bills
alter table public.bills enable row level security;

-- Managers can view all bills in their community
drop policy if exists "Managers can view community bills" on public.bills;
create policy "Managers can view community bills"
    on public.bills for select
    using (
        exists (
            select 1 from public.members
            where members.community_id = bills.community_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );

-- Managers can insert/update bills
drop policy if exists "Managers can manage community bills" on public.bills;
create policy "Managers can manage community bills"
    on public.bills for all
    using (
        exists (
            select 1 from public.members
            where members.community_id = bills.community_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );

-- Household members can view their own bills
drop policy if exists "Household members can view their own bills" on public.bills;
create policy "Household members can view their own bills"
    on public.bills for select
    using (
        exists (
            select 1 from public.members
            where members.household_id = bills.household_id
            and members.user_id = auth.uid()
        )
    );


-- Payments
DO $$ begin
    create type payment_method as enum ('card', 'bank_transfer', 'cash', 'other');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.payments (
    id uuid not null default gen_random_uuid() primary key,
    bill_id uuid not null references public.bills(id) on delete cascade,
    amount numeric(10, 2) not null,
    payment_date timestamptz not null default now(),
    method payment_method not null,
    reference text,
    created_at timestamptz not null default now()
);

-- RLS for payments
alter table public.payments enable row level security;

-- Managers can view payments
drop policy if exists "Managers can view payments" on public.payments;
create policy "Managers can view payments"
    on public.payments for select
    using (
        exists (
            select 1 from public.bills
            join public.members on members.community_id = bills.community_id
            where bills.id = payments.bill_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );

-- Household members can view their own payments
drop policy if exists "Household members can view their own payments" on public.payments;
create policy "Household members can view their own payments"
    on public.payments for select
    using (
        exists (
            select 1 from public.bills
            join public.members on members.household_id = bills.household_id
            where bills.id = payments.bill_id
            and members.user_id = auth.uid()
        )
    );

-- Allow creation of payments (simulated)
drop policy if exists "Household members can pay bills" on public.payments;
create policy "Household members can pay bills"
    on public.payments for insert
    with check (
        exists (
            select 1 from public.bills
            join public.members on members.household_id = bills.household_id
            where bills.id = payments.bill_id
            and members.user_id = auth.uid()
        )
    );
