-- Add is_active to visitor_codes
alter table public.visitor_codes 
add column is_active boolean default true;
