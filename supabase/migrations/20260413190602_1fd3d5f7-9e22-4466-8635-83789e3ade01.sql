-- Fix 1: Remove site_settings from Realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.site_settings;
  END IF;
END $$;

-- Fix 2: Tighten payment_proofs INSERT policy to verify order ownership
DROP POLICY IF EXISTS "Users can insert own payment proofs" ON public.payment_proofs;

CREATE POLICY "Users can insert own payment proofs"
ON public.payment_proofs
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND (user_id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payment_proofs.order_id
        AND (orders.user_id = auth.uid())
    )
  )
);