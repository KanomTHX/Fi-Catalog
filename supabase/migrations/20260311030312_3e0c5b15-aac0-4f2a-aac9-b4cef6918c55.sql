
-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text UNIQUE,
  display_name text NOT NULL,
  phone text,
  address text,
  picture_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated can view customers
CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT TO anon, authenticated USING (true);
-- Anon + authenticated can insert customers
CREATE POLICY "Anyone can insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Authenticated can update customers
CREATE POLICY "Authenticated can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anon can insert orders
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Authenticated can view orders
CREATE POLICY "Authenticated can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
-- Authenticated can update orders
CREATE POLICY "Authenticated can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric DEFAULT 0
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Anon can insert order_items
CREATE POLICY "Anyone can insert order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Authenticated can view order_items
CREATE POLICY "Authenticated can view order_items" ON public.order_items FOR SELECT TO authenticated USING (true);

-- Trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
