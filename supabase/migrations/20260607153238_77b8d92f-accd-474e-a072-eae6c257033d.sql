-- 1) Lock down products.cost_price so it is NOT visible to anon / authenticated users.
REVOKE SELECT (cost_price) ON public.products FROM anon;
REVOKE SELECT (cost_price) ON public.products FROM authenticated;
-- service_role retains full access by default; ensure it's explicit.
GRANT SELECT (cost_price) ON public.products TO service_role;

-- 2) Admin-only RPC for fetching full product rows (including cost_price).
CREATE OR REPLACE FUNCTION public.admin_list_products_with_cost()
RETURNS SETOF public.products
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.products ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_products_with_cost() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_products_with_cost() TO authenticated;

-- 3) Add the missing UPDATE policy for refund-screenshots bucket.
CREATE POLICY "Owners can update own refund screenshots"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'refund-screenshots'
    AND ((storage.foldername(name))[1] = (auth.uid())::text
         OR public.has_role(auth.uid(), 'admin'::app_role))
  )
  WITH CHECK (
    bucket_id = 'refund-screenshots'
    AND ((storage.foldername(name))[1] = (auth.uid())::text
         OR public.has_role(auth.uid(), 'admin'::app_role))
  );
