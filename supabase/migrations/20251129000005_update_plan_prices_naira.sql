-- Update existing plans to Naira
UPDATE public.subscription_plans
SET price = 0, features = '{"max_residents": 50, "max_guards": 2, "support": "community"}'::jsonb
WHERE name = 'Free';

UPDATE public.subscription_plans
SET price = 50000, features = '{"max_residents": 500, "max_guards": 10, "support": "email"}'::jsonb
WHERE name = 'Pro';

UPDATE public.subscription_plans
SET price = 200000, features = '{"max_residents": 10000, "max_guards": 50, "support": "priority"}'::jsonb
WHERE name = 'Enterprise';
