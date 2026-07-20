DROP POLICY IF EXISTS "Public read announced winners" ON public.offer_winners;
REVOKE SELECT ON public.offer_winners FROM anon;
REVOKE SELECT ON public.offer_winners FROM authenticated;
-- Ensure the sanitized public view is readable by the frontend
GRANT SELECT ON public.offer_winners_public TO anon, authenticated;