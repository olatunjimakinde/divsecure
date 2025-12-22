-- Add code_type to visitor_codes
alter table public.visitor_codes 
add column if not exists code_type text not null default 'visitor' 
check (code_type in ('visitor', 'service_provider', 'staff'));

-- Add exited_at to visitor_logs if it doesn't exist
alter table public.visitor_logs
add column if not exists exited_at timestamp with time zone;

-- Add exit_point to visitor_logs if it doesn't exist (for completeness)
alter table public.visitor_logs
add column if not exists exit_point text;

-- Add comment
comment on column public.visitor_codes.code_type is 'Type of visitor: visitor (default), service_provider (contractors, etc), staff (domestic staff, nannies)';
