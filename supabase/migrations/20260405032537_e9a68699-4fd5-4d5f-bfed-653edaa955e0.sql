ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS featured_banner_fit text NOT NULL DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS all_products_banner_fit text NOT NULL DEFAULT 'cover';