
-- Admin-only views. These are SECURITY DEFINER views (default) owned by postgres,
-- so they bypass the column REVOKEs on the base tables. Access is gated by an
-- internal has_role() check that reads auth.uid() from the caller's JWT.

CREATE OR REPLACE VIEW public.admin_blog_comments AS
SELECT *
FROM public.blog_comments
WHERE public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.admin_blog_comments TO authenticated;

CREATE OR REPLACE VIEW public.admin_product_reviews AS
SELECT *
FROM public.product_reviews
WHERE public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.admin_product_reviews TO authenticated;

CREATE OR REPLACE VIEW public.admin_offer_winners AS
SELECT *
FROM public.offer_winners
WHERE public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.admin_offer_winners TO authenticated;
