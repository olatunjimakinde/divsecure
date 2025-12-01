-- Add is_popular column to subscription_plans
alter table public.subscription_plans 
add column if not exists is_popular boolean default false;

-- Update existing plans (optional, set Pro as popular by default if it exists)
update public.subscription_plans 
set is_popular = true 
where name = 'Pro';
