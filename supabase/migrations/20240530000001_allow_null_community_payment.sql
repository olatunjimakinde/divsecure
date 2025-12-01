-- Make community_id nullable in subscription_payments to support "Pay then Create" flow
alter table public.subscription_payments
alter column community_id drop not null;
