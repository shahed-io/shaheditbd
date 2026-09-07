-- 1. FIX: Orders UPDATE policy - restrict what users can change
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
ON public.orders FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    auth.uid() = user_id
    AND status = 'pending'::order_status
  )
);

-- 2. FIX: Coupons - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND is_active = true);

-- 3. FIX: blog_comments_public view - recreate with security_invoker
DROP VIEW IF EXISTS public.blog_comments_public;
CREATE VIEW public.blog_comments_public
WITH (security_invoker = on) AS
SELECT id, post_id, parent_id, author_name, content, created_at, status, user_id
FROM public.blog_comments
WHERE status = 'approved';

-- 4. FIX: site_settings - restrict public SELECT to safe categories only
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;
CREATE POLICY "Anyone can read general settings"
ON public.site_settings FOR SELECT
USING (category IN ('general', 'appearance', 'seo', 'social', 'store'));

-- 5. FIX: support_replies INSERT - prevent is_admin flag spoofing by users
DROP POLICY IF EXISTS "Authenticated users can add replies" ON public.support_replies;
CREATE POLICY "Authenticated users can add replies"
ON public.support_replies FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND ticket_id IN (
    SELECT id FROM support_tickets
    WHERE user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  )
  AND (is_admin = false OR has_role(auth.uid(), 'admin'::app_role))
);

-- 6. FIX: Function search_path mutable
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;