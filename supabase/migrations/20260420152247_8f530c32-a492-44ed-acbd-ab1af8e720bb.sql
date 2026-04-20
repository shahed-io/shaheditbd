DROP POLICY IF EXISTS "anyone_insert_click" ON public.affiliate_clicks;
CREATE POLICY "valid_affiliate_click_insert" ON public.affiliate_clicks
  FOR INSERT
  WITH CHECK (
    affiliate_id IN (SELECT id FROM public.affiliate_accounts WHERE status = 'approved')
    AND length(referral_code) > 0
    AND length(referral_code) <= 20
  );