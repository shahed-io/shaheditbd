CREATE OR REPLACE FUNCTION public.admin_list_coupons_with_email()
RETURNS SETOF public.coupons
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.coupons ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_coupons_with_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_coupons_with_email() TO authenticated;