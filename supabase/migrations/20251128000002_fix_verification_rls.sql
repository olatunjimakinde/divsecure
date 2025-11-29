-- Fix RLS for visitor_codes to allow security staff to view
drop policy if exists "Community owners/admins can view all codes in their community." on public.visitor_codes;

create policy "Security staff can view all codes in their community."
  on public.visitor_codes for select
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('admin', 'moderator', 'community_manager', 'guard', 'head_of_security')
  ));

-- Fix RLS for visitor_logs to allow head_of_security
drop policy if exists "Managers can view logs for their community" on public.visitor_logs;
drop policy if exists "Guards can insert logs" on public.visitor_logs;

create policy "Security staff can view logs for their community"
    on public.visitor_logs
    for select
    using (
        exists (
            select 1 from public.members
            where members.community_id = visitor_logs.community_id
            and members.user_id = auth.uid()
            and members.role in ('community_manager', 'guard', 'head_of_security')
        )
    );

create policy "Security staff can insert logs"
    on public.visitor_logs
    for insert
    with check (
        exists (
            select 1 from public.members
            where members.community_id = visitor_logs.community_id
            and members.user_id = auth.uid()
            and members.role in ('community_manager', 'guard', 'head_of_security')
        )
    );
