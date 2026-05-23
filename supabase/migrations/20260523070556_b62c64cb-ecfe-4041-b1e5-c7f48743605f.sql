
CREATE POLICY "Public can upload payment link screenshots"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = 'pl'
);
