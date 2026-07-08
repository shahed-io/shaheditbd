
-- product_reviews public view (excludes author_email)
CREATE OR REPLACE VIEW public.product_reviews_public
WITH (security_invoker = true) AS
SELECT
  id, product_id, product_slug, author_name, rating, title, body,
  is_verified, helpful_count, status, created_at
FROM public.product_reviews
WHERE status = 'approved';

GRANT SELECT ON public.product_reviews_public TO anon, authenticated;

-- offer_winners public view (excludes participant_contact)
CREATE OR REPLACE VIEW public.offer_winners_public
WITH (security_invoker = true) AS
SELECT
  w.id, w.offer_id, w.submission_id, w.rank, w.prize,
  w.participant_name, w.announced, w.selected_by, w.source, w.created_at
FROM public.offer_winners w
WHERE w.announced = true
  AND EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = w.offer_id AND o.show_winners = true
  );

GRANT SELECT ON public.offer_winners_public TO anon, authenticated;

-- BLOG COMMENTS
DROP POLICY IF EXISTS "Approved comments are publicly viewable" ON public.blog_comments;
CREATE POLICY "Public read approved comments"
  ON public.blog_comments
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');
REVOKE SELECT (author_email) ON public.blog_comments FROM anon, authenticated;

-- PRODUCT REVIEWS
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
CREATE POLICY "Public read approved reviews"
  ON public.product_reviews
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');
REVOKE SELECT (author_email) ON public.product_reviews FROM anon, authenticated;

-- OFFER WINNERS
DROP POLICY IF EXISTS "Public can view winners of offers with show_winners" ON public.offer_winners;
CREATE POLICY "Public read announced winners"
  ON public.offer_winners
  FOR SELECT
  TO anon, authenticated
  USING (
    announced = true
    AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_winners.offer_id AND o.show_winners = true
    )
  );
REVOKE SELECT (participant_contact) ON public.offer_winners FROM anon, authenticated;
