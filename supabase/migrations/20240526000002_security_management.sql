-- Update Member Roles
alter table public.members drop constraint if exists members_role_check;
alter table public.members add constraint members_role_check 
    check (role in ('community_manager', 'head_of_security', 'guard', 'resident'));

-- Shifts Table
DO $$ begin
    create type shift_status as enum ('scheduled', 'active', 'completed', 'cancelled');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.shifts (
    id uuid not null default gen_random_uuid() primary key,
    community_id uuid not null references public.communities(id) on delete cascade,
    guard_id uuid not null references public.members(id) on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    status shift_status not null default 'scheduled',
    clock_in_time timestamptz,
    clock_out_time timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS for Shifts
alter table public.shifts enable row level security;

-- Managers and Head of Security can manage all shifts
drop policy if exists "Managers and Heads can manage shifts" on public.shifts;
create policy "Managers and Heads can manage shifts"
    on public.shifts for all
    using (
        exists (
            select 1 from public.members
            where members.community_id = shifts.community_id
            and members.user_id = auth.uid()
            and members.role in ('community_manager', 'head_of_security')
        )
    );

-- Guards can view their own shifts
drop policy if exists "Guards can view their own shifts" on public.shifts;
create policy "Guards can view their own shifts"
    on public.shifts for select
    using (
        exists (
            select 1 from public.members
            where members.id = shifts.guard_id
            and members.user_id = auth.uid()
        )
    );

-- Guards can update their own shifts (Clock In/Out)
drop policy if exists "Guards can update their own shifts" on public.shifts;
create policy "Guards can update their own shifts"
    on public.shifts for update
    using (
        exists (
            select 1 from public.members
            where members.id = shifts.guard_id
            and members.user_id = auth.uid()
        )
    );
