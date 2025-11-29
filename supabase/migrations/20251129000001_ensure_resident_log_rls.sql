-- Ensure Resident policy for visitor logs is correct
drop policy if exists "Residents can view logs for their codes" on public.visitor_logs;

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
