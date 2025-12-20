-- Billing Settings
create table if not exists public.billing_settings (
    community_id uuid not null references public.communities(id) on delete cascade primary key,
    block_access_codes_if_unpaid boolean not null default false,
    grace_period_days integer not null default 0,
    security_guard_exempt boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS for billing_settings
alter table public.billing_settings enable row level security;

drop policy if exists "Managers can view billing settings" on public.billing_settings;
create policy "Managers can view billing settings"
    on public.billing_settings for select
    using (
        exists (
            select 1 from public.members
            where members.community_id = billing_settings.community_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );

drop policy if exists "Managers can update billing settings" on public.billing_settings;
create policy "Managers can update billing settings"
    on public.billing_settings for update
    using (
        exists (
            select 1 from public.members
            where members.community_id = billing_settings.community_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );

drop policy if exists "Managers can insert billing settings" on public.billing_settings;
create policy "Managers can insert billing settings"
    on public.billing_settings for insert
    with check (
        exists (
            select 1 from public.members
            where members.community_id = billing_settings.community_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );
     
-- Recurring Charges
DO $$ begin
    create type charge_frequency as enum ('monthly', 'quarterly', 'yearly');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.recurring_charges (
    id uuid not null default gen_random_uuid() primary key,
    community_id uuid not null references public.communities(id) on delete cascade,
    title text not null,
    amount numeric(10, 2) not null,
    frequency charge_frequency not null,
    active boolean not null default true,
    last_generated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS for recurring_charges
alter table public.recurring_charges enable row level security;

drop policy if exists "Managers can view recurring charges" on public.recurring_charges;
create policy "Managers can view recurring charges"
    on public.recurring_charges for select
    using (
        exists (
            select 1 from public.members
            where members.community_id = recurring_charges.community_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );

drop policy if exists "Managers can manage recurring charges" on public.recurring_charges;
create policy "Managers can manage recurring charges"
    on public.recurring_charges for all
    using (
        exists (
            select 1 from public.members
            where members.community_id = recurring_charges.community_id
            and members.user_id = auth.uid()
            and members.role = 'community_manager'
        )
    );
