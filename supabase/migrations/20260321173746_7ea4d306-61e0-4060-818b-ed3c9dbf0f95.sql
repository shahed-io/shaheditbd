-- Fix "RLS Policy Always True" warnings
-- Drop old overly permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

-- Orders: allow authenticated users to insert their own orders,
-- OR allow guest checkout where user_id is null
CREATE POLICY "Users can insert own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Order items: only allow insert if the parent order belongs to the current user or is a guest order
CREATE POLICY "Users can insert own order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );