ALTER VIEW public.offer_analytics_daily SET (security_invoker = on);

DROP POLICY IF EXISTS "Anyone can submit a comment" ON public.blog_comments;
CREATE POLICY "Anyone can submit a comment"
ON public.blog_comments
FOR INSERT
WITH CHECK (
  length(author_name) > 0 AND length(author_name) <= 200
  AND length(content) > 0 AND length(content) <= 5000
  AND (
    author_email IS NULL
    OR (auth.uid() IS NOT NULL AND lower(author_email) = lower(auth.jwt() ->> 'email'))
  )
  AND status = 'pending'
);

DROP POLICY IF EXISTS "Anyone can submit to active offers" ON public.offer_submissions;
CREATE POLICY "Anyone can submit to active offers"
ON public.offer_submissions
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_submissions.offer_id AND o.status = 'active')
  AND COALESCE(is_winner, false) = false
  AND winner_rank IS NULL
  AND prize_won IS NULL
  AND COALESCE(converted_to_customer, false) = false
  AND (customer_user_id IS NULL OR customer_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.product_reviews;
CREATE POLICY "Anyone can submit a review"
ON public.product_reviews
FOR INSERT
WITH CHECK (
  length(author_name) > 0
  AND length(body) > 0
  AND rating >= 1 AND rating <= 5
  AND status = 'pending'
  AND COALESCE(is_verified, false) = false
  AND COALESCE(helpful_count, 0) = 0
);

DROP POLICY IF EXISTS "Users can only insert referrals as themselves" ON public.referrals;
CREATE POLICY "Users can only insert referrals as themselves"
ON public.referrals
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = referrer_id
  AND COALESCE(reward_paid, false) = false
  AND COALESCE(status, 'pending') = 'pending'
  AND COALESCE(reward_amount, 0) = 0
);