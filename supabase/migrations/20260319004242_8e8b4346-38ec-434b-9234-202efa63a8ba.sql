-- 1. product_images table
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can view product images" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage product images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. product_variants table
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  variant_value text NOT NULL,
  image_url text,
  price_adjustment numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can view variants" ON public.product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage variants" ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. installment_plans table
CREATE TABLE public.installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  months int NOT NULL,
  interest_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view plans" ON public.installment_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage plans" ON public.installment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default plans
INSERT INTO public.installment_plans (months, interest_rate) VALUES (3, 0), (6, 0), (10, 0), (12, 0);

-- 4. Add delivery_method to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'pickup';