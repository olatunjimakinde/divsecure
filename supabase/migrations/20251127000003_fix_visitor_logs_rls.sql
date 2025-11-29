-- Drop incorrect policies
drop policy if exists "Managers can view logs for their community" on public.visitor_logs;
drop policy if exists "Guards can insert logs" on public.visitor_logs;

-- Create new policies
create policy "Staff can view logs for their community"
    on public.visitor_logs
    for select
    using (
        exists (
            select 1 from public.members
            where members.community_id = visitor_logs.community_id
            and members.user_id = auth.uid()
            and members.role in ('community_manager', 'head_of_security', 'guard')
        )
    );

create policy "Staff can insert logs"
    on public.visitor_logs
    for insert
    with check (
        exists (
            select 1 from public.members
            where members.community_id = visitor_logs.community_id
            and members.user_id = auth.uid()
            and members.role in ('community_manager', 'head_of_security', 'guard')
        )
    );
