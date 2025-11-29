create table if not exists public.visitor_logs (
    id uuid not null default gen_random_uuid(),
    visitor_code_id uuid not null references public.visitor_codes(id) on delete cascade,
    community_id uuid not null references public.communities(id) on delete cascade,
    entered_at timestamp with time zone not null default now(),
    guard_id uuid references public.profiles(id),
    entry_point text,
    
    constraint visitor_logs_pkey primary key (id)
);

-- RLS Policies
alter table public.visitor_logs enable row level security;

-- Managers can view all logs for their community
create policy "Managers can view logs for their community"
    on public.visitor_logs
    for select
    using (
        exists (
            select 1 from public.members
            where members.community_id = visitor_logs.community_id
            and members.user_id = auth.uid()
            and members.role in ('community_manager', 'guard')
        )
    );

-- Residents can view logs for their own visitor codes
create policy "Residents can view logs for their codes"
    on public.visitor_logs
    for select
    using (
        exists (
            select 1 from public.visitor_codes
            where visitor_codes.id = visitor_logs.visitor_code_id
            and visitor_codes.host_id = auth.uid()
        )
    );

-- Guards can insert logs
create policy "Guards can insert logs"
    on public.visitor_logs
    for insert
    with check (
        exists (
            select 1 from public.members
            where members.community_id = visitor_logs.community_id
            and members.user_id = auth.uid()
            and members.role in ('community_manager', 'guard')
        )
    );
