
-- Create line_settings table
CREATE TABLE public.line_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liff_id text,
  channel_access_token text,
  rich_menu_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.line_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read line_settings
CREATE POLICY "Admins can view line settings"
  ON public.line_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert line_settings
CREATE POLICY "Admins can insert line settings"
  ON public.line_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update line_settings
CREATE POLICY "Admins can update line settings"
  ON public.line_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_line_settings_updated_at
  BEFORE UPDATE ON public.line_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow anonymous users to view products (for public showcase)
CREATE POLICY "Public can view products"
  ON public.products FOR SELECT TO anon
  USING (true);

-- Allow anonymous users to view categories (for public showcase)
CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT TO anon
  USING (true);
