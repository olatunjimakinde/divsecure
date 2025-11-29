-- Run this in the Supabase Dashboard SQL Editor
-- This fixes the "members_role_check" constraint to allow "head_of_security" and "guard" roles.

alter table public.members drop constraint if exists members_role_check;

alter table public.members add constraint members_role_check 
    check (role in ('community_manager', 'head_of_security', 'guard', 'resident'));
