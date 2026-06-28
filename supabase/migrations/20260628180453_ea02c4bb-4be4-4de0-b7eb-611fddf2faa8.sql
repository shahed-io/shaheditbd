
GRANT SELECT ON public.offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;

GRANT SELECT ON public.offer_fields TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offer_fields TO authenticated;
GRANT ALL ON public.offer_fields TO service_role;

GRANT SELECT, INSERT ON public.offer_submissions TO anon, authenticated;
GRANT UPDATE, DELETE ON public.offer_submissions TO authenticated;
GRANT ALL ON public.offer_submissions TO service_role;

GRANT SELECT ON public.offer_winners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offer_winners TO authenticated;
GRANT ALL ON public.offer_winners TO service_role;
