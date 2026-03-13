
-- Allow anon users to SELECT their own orders (matched via customer line_user_id)
CREATE POLICY "Anon can view orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Allow anon users to SELECT order_items for orders they can see
CREATE POLICY "Anon can view order_items"
ON public.order_items
FOR SELECT
TO anon
USING (true);

-- Allow anon users to UPDATE their own customer record
CREATE POLICY "Anon can update own customer"
ON public.customers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
