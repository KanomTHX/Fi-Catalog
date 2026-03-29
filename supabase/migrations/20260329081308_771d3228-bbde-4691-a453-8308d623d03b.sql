ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_user_id uuid DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);