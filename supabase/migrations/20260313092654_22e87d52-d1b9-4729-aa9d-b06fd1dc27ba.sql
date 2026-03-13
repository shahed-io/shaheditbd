
-- Fix overly permissive referral INSERT policy
DROP POLICY IF EXISTS "Anyone can insert referral on signup" ON public.referrals;

CREATE POLICY "Authenticated users can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
