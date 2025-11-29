-- Add max_residents_per_household to communities table
alter table public.communities 
add column if not exists max_residents_per_household integer default 4;

comment on column public.communities.max_residents_per_household is 'Maximum number of residents allowed per household';
