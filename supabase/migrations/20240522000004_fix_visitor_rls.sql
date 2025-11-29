-- Fix RLS policies for visitor_codes to match actual roles

-- Drop existing policies
drop policy if exists "Community owners/admins can view all codes in their community." on public.visitor_codes;
drop policy if exists "Community owners/admins can update codes (e.g. mark as used)." on public.visitor_codes;

-- Create new policies with correct roles
create policy "Managers and guards can view all codes in their community."
  on public.visitor_codes for select
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('community_manager', 'guard')
  ));

create policy "Managers and guards can update codes (e.g. mark as used)."
  on public.visitor_codes for update
  using ( exists (
    select 1 from public.members
    where community_id = public.visitor_codes.community_id
    and user_id = auth.uid()
    and role in ('community_manager', 'guard')
  ));
