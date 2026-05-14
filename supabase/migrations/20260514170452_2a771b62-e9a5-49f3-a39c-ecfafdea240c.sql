
-- Anyone (anon or authenticated) can upload a payment screenshot during checkout
CREATE POLICY "Anyone can upload payment proof"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

-- Authenticated user can view their own payment proof files (path begins with their uid/)
CREATE POLICY "Users can view own payment proof files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Admins full access
CREATE POLICY "Admins manage payment proof files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'::app_role));
