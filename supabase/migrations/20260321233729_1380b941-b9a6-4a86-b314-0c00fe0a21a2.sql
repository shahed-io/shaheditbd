
-- Drop old broken INSERT policy for category-images
DROP POLICY IF EXISTS "Admins can upload category images" ON storage.objects;

-- Recreate with proper WITH CHECK expression
CREATE POLICY "Admins can upload category images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'category-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Fix UPDATE policy too
DROP POLICY IF EXISTS "Admins can update category images" ON storage.objects;

CREATE POLICY "Admins can update category images"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'category-images'
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'category-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);
