
-- Remove user-facing INSERT policy from wallet_transactions
-- Wallet transactions must ONLY be created by SECURITY DEFINER server-side functions
-- to prevent authenticated users from directly inflating their own balance

DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can insert wallet transactions" ON public.wallet_transactions;
