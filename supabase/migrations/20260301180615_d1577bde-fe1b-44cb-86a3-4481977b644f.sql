
-- 1. Fix Guest Checkout: Allow orders with null user_id for guests
DROP POLICY IF EXISTS "Authenticated users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own or guest orders" ON public.orders;

CREATE POLICY "Users can insert own or guest orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- 2. Fix Coupons: Restrict to authenticated users only (prevent anonymous enumeration)
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view active coupons"
  ON public.coupons FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- 3. Tighten categories policy - remove always-true pattern
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Ensure order_items can be inserted for guest orders
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;

CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ))
    OR
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id IS NULL
    ))
  );
