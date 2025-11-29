-- Add audience and allow_replies to channels
alter table public.channels 
add column if not exists audience text check (audience in ('all', 'household_heads')) default 'all' not null,
add column if not exists allow_replies boolean default true not null;
