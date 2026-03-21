
-- Fix overly permissive DELETE policy — restrict to file owner path
DROP POLICY IF EXISTS "Anyone can delete refund screenshots" ON storage.objects;

-- Only allow delete if the file path starts with a unique prefix they uploaded
-- Since no auth required, we remove the delete policy (uploads are permanent until admin cleans up)
