-- Fix 1: Coupons - require authentication to view (prevent public scraping)
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
  ON public.coupons FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Fix 2: Order items - explicitly deny anonymous access
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Fix 3: Support tickets INSERT policy was "WITH CHECK (true)" - tighten it
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    length(customer_name) > 0 AND length(customer_name) <= 200
    AND customer_email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
    AND length(subject) > 0 AND length(subject) <= 500
    AND length(message) > 0 AND length(message) <= 5000
  );