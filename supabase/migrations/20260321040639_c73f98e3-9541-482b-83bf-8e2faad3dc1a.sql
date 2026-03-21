
CREATE OR REPLACE FUNCTION public.search_order_by_code(code text)
RETURNS SETOF orders
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE id::text ILIKE '%' || lower(code) || '%'
  LIMIT 1;
$$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS installment_months int;
