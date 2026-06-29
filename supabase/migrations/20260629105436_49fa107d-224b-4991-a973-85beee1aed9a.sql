CREATE POLICY "Admins can read notice-signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'notice-signatures'
  AND public.has_role(auth.uid(), 'admin')
);