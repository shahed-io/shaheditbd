
-- Harden abandoned-checkout conversion + auto-recover legacy stuck rows.
-- 1) Update mark_abandoned_checkout_converted to also auto-mark any pending
--    abandoned rows that match the same user/customer contact as a safety net.
CREATE OR REPLACE FUNCTION public.mark_abandoned_checkout_converted(
  p_session_token text,
  p_order_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order record;
BEGIN
  -- Primary path: match by session token
  IF p_session_token IS NOT NULL AND length(p_session_token) >= 8 THEN
    UPDATE public.abandoned_checkouts
       SET converted = true,
           converted_order_id = p_order_id,
           converted_at = now(),
           updated_at = now()
     WHERE session_token = p_session_token
       AND converted = false;
  END IF;

  -- Safety net: also mark any *still-pending* rows that clearly belong to
  -- the same buyer as this order (same phone or email, within last 24h).
  IF p_order_id IS NOT NULL THEN
    SELECT customer_email, customer_phone, user_id
      INTO v_order
      FROM public.orders
     WHERE id = p_order_id
     LIMIT 1;

    IF FOUND THEN
      UPDATE public.abandoned_checkouts a
         SET converted = true,
             converted_order_id = p_order_id,
             converted_at = now(),
             updated_at = now()
       WHERE a.converted = false
         AND a.created_at > now() - interval '24 hours'
         AND (
              (v_order.user_id IS NOT NULL AND a.user_id = v_order.user_id)
           OR (v_order.customer_phone IS NOT NULL AND a.customer_phone = v_order.customer_phone)
           OR (v_order.customer_email IS NOT NULL AND lower(a.customer_email) = lower(v_order.customer_email))
         );
    END IF;
  END IF;

  RETURN true;
END;
$function$;

-- 2) One-time backfill: any pending abandoned row that already has a matching
--    real order (same phone/email within a 24h window) should be marked as
--    converted so the admin panel stops showing recovered orders as abandoned.
UPDATE public.abandoned_checkouts a
   SET converted = true,
       converted_order_id = o.id,
       converted_at = COALESCE(a.converted_at, o.created_at, now()),
       updated_at = now()
  FROM public.orders o
 WHERE a.converted = false
   AND o.created_at BETWEEN a.created_at - interval '30 minutes'
                        AND a.created_at + interval '24 hours'
   AND (
        (a.user_id IS NOT NULL AND o.user_id = a.user_id)
     OR (a.customer_phone IS NOT NULL AND o.customer_phone = a.customer_phone)
     OR (a.customer_email IS NOT NULL AND lower(o.customer_email) = lower(a.customer_email))
   );
