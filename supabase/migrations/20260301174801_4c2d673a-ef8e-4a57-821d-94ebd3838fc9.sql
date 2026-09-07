-- Fix #3: Guest Checkout RLS - allow guest orders with NULL user_id
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert own orders" ON public.orders;

CREATE POLICY "Users can insert own or guest orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );