
ALTER TABLE public.orders ADD COLUMN monthly_amount numeric DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN status_reason text DEFAULT NULL;

CREATE TABLE public.product_installment_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  monthly_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, plan_id)
);
ALTER TABLE public.product_installment_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view" ON public.product_installment_prices FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can manage" ON public.product_installment_prices FOR ALL TO authenticated USING (true) WITH CHECK (true);
