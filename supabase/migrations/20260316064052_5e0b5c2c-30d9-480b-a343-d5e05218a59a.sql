ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS company_description text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS google_map_embed text,
  ADD COLUMN IF NOT EXISTS line_id text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text;

CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage banners" ON public.banners FOR ALL TO authenticated USING (true) WITH CHECK (true);