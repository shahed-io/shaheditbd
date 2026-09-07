
-- Fix: category-images DELETE policy missing admin role check
DROP POLICY IF EXISTS "Admins can delete category images" ON storage.objects;
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'::app_role));
