DROP POLICY IF EXISTS "Public read approved comments" ON public.blog_comments;
CREATE POLICY "Public read approved comments" ON public.blog_comments
AS PERMISSIVE FOR SELECT TO anon, authenticated
USING (status = 'approved');