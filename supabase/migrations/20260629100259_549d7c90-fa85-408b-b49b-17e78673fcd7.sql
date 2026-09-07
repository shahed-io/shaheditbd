-- Allow public to view approved blog comments
CREATE POLICY "Approved comments are publicly viewable"
ON public.blog_comments
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Make newsletter SELECT restriction explicit (admin-only)
CREATE POLICY "Only admins can view subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));