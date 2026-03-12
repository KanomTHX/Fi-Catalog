
-- Add new columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create site_settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'StockFlow',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.site_settings (site_name) VALUES ('StockFlow');

-- Create view for product order counts (popularity sorting)
CREATE OR REPLACE VIEW public.product_order_counts AS
SELECT oi.product_id, COUNT(oi.id) as order_count
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY oi.product_id;

-- Create site-assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Storage RLS for site-assets
CREATE POLICY "Anyone can view site assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'site-assets');
CREATE POLICY "Authenticated can upload site assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');
CREATE POLICY "Authenticated can update site assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets');
