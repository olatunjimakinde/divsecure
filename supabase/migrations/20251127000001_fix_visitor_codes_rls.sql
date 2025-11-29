-- Drop incorrect policies
drop policy if exists "Community owners/admins can view all codes in their community." on public.visitor_codes;
drop policy if exists "Community owners/admins can update codes (e.g. mark as used)." on public.visitor_codes;

-- Create new policies
create policy "Staff can view all codes in their community."
  on public.visitor_codes for select
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('community_manager', 'head_of_security', 'guard')
  ));

create policy "Staff can update codes (e.g. mark as used)."
  on public.visitor_codes for update
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('community_manager', 'head_of_security', 'guard')
  ));
