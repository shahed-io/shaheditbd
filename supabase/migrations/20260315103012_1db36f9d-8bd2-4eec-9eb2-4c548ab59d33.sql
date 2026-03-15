
-- 1. Fix: Commenter email addresses are publicly readable
-- Create a secure view that excludes author_email
CREATE OR REPLACE VIEW public.blog_comments_public
WITH (security_invoker=on) AS
  SELECT id, author_name, content, created_at, parent_id, post_id, status, user_id
  FROM public.blog_comments
  WHERE status = 'approved';

-- Drop the overly permissive SELECT policy and replace with one blocking direct table access
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.blog_comments;

CREATE POLICY "No direct public SELECT on blog_comments"
  ON public.blog_comments FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- 2. Fix: Authenticated users can create referral records on behalf of any user
DROP POLICY IF EXISTS "Authenticated users can insert referrals" ON public.referrals;

CREATE POLICY "Users can only insert referrals as themselves"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = referrer_id);

-- 3. Fix: Active Coupons Publicly Readable
-- Already partially fixed (policy exists for authenticated only), ensure anon can't read
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view active coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND is_active = true);
