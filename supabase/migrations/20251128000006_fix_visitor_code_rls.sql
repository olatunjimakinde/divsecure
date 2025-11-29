-- Allow guards and managers to update visitor codes (for usage tracking)
create policy "Guards and Managers can update visitor codes"
  on public.visitor_codes for update
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('community_manager', 'guard', 'head_of_security')
  ));
