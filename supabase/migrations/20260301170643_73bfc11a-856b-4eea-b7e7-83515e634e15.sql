
-- Fix guest orders: add explicit denial for guest orders to prevent unauthorized access
-- Guest orders (user_id IS NULL) should only be accessible by admins
-- The existing SELECT policy already fails for guests since auth.uid() != NULL user_id
-- But we add explicit policy to be clear

-- Drop old permissive insert policy that allowed null user_id without restriction
DROP POLICY IF EXISTS "Authenticated users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view own orders" ON public.orders;

-- Recreate with explicit guest order handling
CREATE POLICY "Authenticated users can view own orders"
ON public.orders FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (user_id IS NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Users can update own orders"
ON public.orders FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
