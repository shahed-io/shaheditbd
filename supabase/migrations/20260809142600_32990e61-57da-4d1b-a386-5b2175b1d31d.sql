
DROP POLICY IF EXISTS "Anyone can submit a comment" ON public.blog_comments;
CREATE POLICY "Anyone can submit a comment"
ON public.blog_comments FOR INSERT
WITH CHECK (
  length(author_name) > 0 AND length(author_name) <= 200
  AND length(content) > 0 AND length(content) <= 5000
  AND (author_email IS NULL OR (auth.uid() IS NOT NULL AND lower(author_email) = lower(auth.jwt() ->> 'email')))
  AND status = 'pending'
  AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.product_reviews;
CREATE POLICY "Anyone can submit a review"
ON public.product_reviews FOR INSERT
WITH CHECK (
  length(author_name) > 0 AND length(body) > 0
  AND rating >= 1 AND rating <= 5
  AND status = 'pending'
  AND COALESCE(is_verified, false) = false
  AND COALESCE(helpful_count, 0) = 0
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.is_active_payment_link_slug(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payment_links pl
    WHERE pl.slug = p_slug
      AND COALESCE(pl.status, 'active') = 'active'
      AND (pl.expires_at IS NULL OR pl.expires_at > now())
      AND (pl.max_uses IS NULL OR COALESCE(pl.current_uses, 0) < pl.max_uses)
  )
$$;

DROP POLICY IF EXISTS "Public can upload payment link screenshots" ON storage.objects;
CREATE POLICY "Public can upload payment link screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = 'pl'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND public.is_active_payment_link_slug((storage.foldername(name))[2])
);
