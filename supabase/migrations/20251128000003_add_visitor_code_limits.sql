-- Add usage limit columns to visitor_codes
alter table public.visitor_codes 
add column if not exists max_uses integer,
add column if not exists usage_count integer default 0 not null;

-- Add check constraint to ensure usage_count is non-negative
alter table public.visitor_codes
add constraint visitor_codes_usage_count_check check (usage_count >= 0);

-- Add check constraint to ensure max_uses is positive if set
alter table public.visitor_codes
add constraint visitor_codes_max_uses_check check (max_uses > 0);
