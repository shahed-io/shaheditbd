
DROP POLICY IF EXISTS "Public read approved comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Public read approved reviews" ON public.product_reviews;

DROP VIEW IF EXISTS public.product_reviews_public;
CREATE VIEW public.product_reviews_public AS
SELECT
  id, product_id, product_slug, user_id, author_name,
  rating, title, body, status, is_verified, helpful_count,
  created_at, updated_at
FROM public.product_reviews
WHERE status = 'approved';

GRANT SELECT ON public.product_reviews_public TO anon, authenticated;
GRANT SELECT ON public.blog_comments_public TO anon, authenticated;
