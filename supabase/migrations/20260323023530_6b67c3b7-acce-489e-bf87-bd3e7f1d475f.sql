
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS featured_banner_url text,
  ADD COLUMN IF NOT EXISTS all_products_banner_url text;
