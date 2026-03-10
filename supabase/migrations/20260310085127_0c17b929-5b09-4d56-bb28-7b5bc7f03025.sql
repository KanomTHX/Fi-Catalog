
-- Fix security definer view by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.product_stock;
CREATE VIEW public.product_stock WITH (security_invoker = true) AS
SELECT 
  p.id AS product_id,
  p.name,
  p.sku,
  p.min_stock_level,
  COALESCE(SUM(CASE WHEN sm.type = 'in' THEN sm.quantity WHEN sm.type = 'out' THEN -sm.quantity ELSE sm.quantity END), 0)::INT AS current_stock
FROM public.products p
LEFT JOIN public.stock_movements sm ON sm.product_id = p.id
GROUP BY p.id, p.name, p.sku, p.min_stock_level;

-- Fix permissive RLS policies on products (require auth.uid() for insert/update)
DROP POLICY IF EXISTS "Authenticated users can create products" ON public.products;
CREATE POLICY "Authenticated users can create products" ON public.products 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" ON public.products 
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Fix permissive RLS on stock_movements
DROP POLICY IF EXISTS "Authenticated users can create movements" ON public.stock_movements;
CREATE POLICY "Authenticated users can create movements" ON public.stock_movements 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Fix permissive RLS on activity_logs
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
