CREATE OR REPLACE FUNCTION public._link_guest_orders_for(
  p_user_id uuid,
  p_email text,
  p_phone text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  p_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  p_phone := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');

  IF p_email IS NULL AND p_phone IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.orders o
     SET user_id = p_user_id,
         updated_at = now()
   WHERE o.user_id IS NULL
     AND (
          (p_email IS NOT NULL AND lower(trim(coalesce(o.customer_email, ''))) = p_email)
       OR (p_phone IS NOT NULL AND regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g') = p_phone)
     );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.payment_proofs pp
     SET user_id = p_user_id
   WHERE pp.user_id IS NULL
     AND EXISTS (
       SELECT 1
         FROM public.orders o
        WHERE o.id = pp.order_id
          AND o.user_id = p_user_id
          AND (
               (p_email IS NOT NULL AND lower(trim(coalesce(o.customer_email, ''))) = p_email)
            OR (p_phone IS NOT NULL AND regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g') = p_phone)
          )
     );

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public._link_guest_orders_for(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._link_guest_orders_for(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public._link_guest_orders_for(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._link_guest_orders_for(uuid, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.link_my_guest_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_phone text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  SELECT p.email, p.phone
    INTO v_email, v_phone
    FROM public.profiles p
   WHERE p.user_id = v_uid;

  IF v_email IS NULL OR v_email = '' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;

  RETURN public._link_guest_orders_for(v_uid, v_email, v_phone);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.link_my_guest_orders() TO authenticated;