
-- Create serial_numbers table
CREATE TABLE public.serial_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'in_stock',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view serial numbers"
  ON public.serial_numbers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert serial numbers"
  ON public.serial_numbers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users and admins can update serial numbers"
  ON public.serial_numbers FOR UPDATE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete serial numbers"
  ON public.serial_numbers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
