
-- 1) Make invoices bucket private
UPDATE storage.buckets SET public = false WHERE id = 'invoices';

-- 2) Drop anonymous insert policies on payment-proofs
DROP POLICY IF EXISTS "Anyone can upload payment proof" ON storage.objects;
DROP POLICY IF EXISTS "pp_public_insert" ON storage.objects;

-- 3) bkash_transactions: allow user to view own records
CREATE POLICY "Users can view own bkash transactions"
ON public.bkash_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4) telegram_checkout_tokens: restrict SELECT to service role only
DROP POLICY IF EXISTS "Anyone can read valid checkout tokens" ON public.telegram_checkout_tokens;
DROP POLICY IF EXISTS "Anyone can read valid tokens" ON public.telegram_checkout_tokens;
DROP POLICY IF EXISTS "Anyone can mark token as used" ON public.telegram_checkout_tokens;
