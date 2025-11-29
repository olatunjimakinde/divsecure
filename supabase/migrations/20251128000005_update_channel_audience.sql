-- Update audience check constraint
alter table public.channels 
drop constraint if exists channels_audience_check;

alter table public.channels
add constraint channels_audience_check 
check (audience in ('all', 'household_heads', 'security_guards', 'head_of_security'));
