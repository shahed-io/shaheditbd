-- Fix 1: Drop the vulnerable "Users can view own orders" policy
-- The old policy (auth.uid() = user_id) is unsafe when user_id IS NULL
-- because unauthenticated users have auth.uid() = NULL, and NULL = NULL
-- could inadvertently grant access to guest orders.
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Fix 2: Re-create a secure SELECT policy that explicitly requires
-- the user to be authenticated AND be the owner of the order.
CREATE POLICY "Authenticated users can view own orders"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- Fix 3: Explicitly deny unauthenticated access to ALL orders
-- (This acts as a safety net for guest orders with NULL user_id)
-- Admins are already covered by their own ALL policy via has_role().
-- Non-admin authenticated users can only see their own orders (policy above).
-- Unauthenticated requests will match no policy and be denied.

-- Also secure INSERT: prevent users from inserting orders on behalf of others
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Authenticated users can insert own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- UPDATE policy: authenticated users can update only their own orders
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Authenticated users can update own orders"
  ON public.orders
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );