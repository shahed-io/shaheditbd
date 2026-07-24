
CREATE OR REPLACE FUNCTION public.link_guest_orders_to_current_user()
RETURNS TABLE(linked_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT 0;
    RETURN;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    RETURN QUERY SELECT 0;
    RETURN;
  END IF;

  WITH upd AS (
    UPDATE public.orders
    SET user_id = v_uid
    WHERE user_id IS NULL
      AND lower(customer_email) = lower(v_email)
    RETURNING id
  )
  SELECT COUNT(*)::int INTO v_count FROM upd;

  -- Also link payment_proofs rows created as guests
  UPDATE public.payment_proofs pp
  SET user_id = v_uid
  WHERE pp.user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = pp.order_id AND o.user_id = v_uid
    );

  RETURN QUERY SELECT v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_guest_orders_to_current_user() TO authenticated;
