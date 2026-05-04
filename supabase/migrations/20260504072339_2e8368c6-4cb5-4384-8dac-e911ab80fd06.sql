-- Allow guest checkouts to also submit payment proof rows.
-- Authenticated users keep their existing policy (must own order).
CREATE POLICY "Guests can insert payment proofs for their order"
ON public.payment_proofs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payment_proofs.order_id
      AND (
        -- guest order (no user attached) — anyone can attach proof
        o.user_id IS NULL
        OR
        -- logged-in user submitting for own order
        (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
      )
  )
);