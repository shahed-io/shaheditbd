-- Fix: Ensure all sensitive tables block anonymous SELECT access

-- profiles: block anonymous
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- orders: block anonymous (drop old and re-add clean policies)
DROP POLICY IF EXISTS "Authenticated users can view own orders" ON public.orders;
CREATE POLICY "Authenticated users can view own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- payment_proofs: ensure anonymous blocked
DROP POLICY IF EXISTS "Users can view own payment proofs" ON public.payment_proofs;
CREATE POLICY "Users can view own payment proofs"
  ON public.payment_proofs FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- license_keys: ensure anonymous blocked
DROP POLICY IF EXISTS "Users can view own assigned keys" ON public.license_keys;
CREATE POLICY "Users can view own assigned keys"
  ON public.license_keys FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      order_item_id IN (
        SELECT oi.id FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = auth.uid() AND o.status = 'completed'::order_status
      )
    )
  );

-- support_tickets: ensure anonymous blocked
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- support_replies: ensure anonymous blocked
DROP POLICY IF EXISTS "Anyone can view replies of accessible tickets" ON public.support_replies;
CREATE POLICY "Users can view replies of accessible tickets"
  ON public.support_replies FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    ticket_id IN (
      SELECT support_tickets.id FROM support_tickets
      WHERE support_tickets.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- order_items: already fixed previously, ensure admin access also works
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));