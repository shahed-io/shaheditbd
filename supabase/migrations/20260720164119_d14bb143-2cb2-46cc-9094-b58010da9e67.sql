DROP POLICY IF EXISTS "Public read approved comments" ON public.blog_comments;
ALTER VIEW public.blog_comments_public SET (security_invoker = off);
GRANT SELECT ON public.blog_comments_public TO anon, authenticated;