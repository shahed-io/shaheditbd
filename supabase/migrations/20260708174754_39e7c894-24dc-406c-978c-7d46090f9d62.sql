
DROP VIEW IF EXISTS public.admin_blog_comments;

CREATE VIEW public.admin_blog_comments AS
SELECT
  c.*,
  jsonb_build_object('title', p.title) AS blog_posts
FROM public.blog_comments c
LEFT JOIN public.blog_posts p ON p.id = c.post_id
WHERE public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.admin_blog_comments TO authenticated;
