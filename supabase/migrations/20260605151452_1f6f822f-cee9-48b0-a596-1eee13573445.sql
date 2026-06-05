
-- 1) abandoned_checkouts: explicit INSERT + UPDATE policies
CREATE POLICY "Anyone can create abandoned checkout"
  ON public.abandoned_checkouts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Owner can update own abandoned checkout"
  ON public.abandoned_checkouts
  FOR UPDATE
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins can update abandoned checkouts"
  ON public.abandoned_checkouts
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) suppressed_emails: allow admin SELECT for dashboard visibility
CREATE POLICY "Admins can view suppressed emails"
  ON public.suppressed_emails
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) refund-screenshots storage: DELETE policies for owner + admin
CREATE POLICY "Owners can delete own refund screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'refund-screenshots'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Admins can delete refund screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'refund-screenshots'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );
