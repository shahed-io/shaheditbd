CREATE OR REPLACE FUNCTION public.protect_paid_bkash_online_order_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_completed_tx boolean := false;
  v_completed_tx record;
BEGIN
  IF OLD.payment_method = 'bkash_online' THEN
    SELECT bt.payment_id, bt.trx_id
      INTO v_completed_tx
      FROM public.bkash_transactions bt
     WHERE bt.status = 'completed'
       AND (
            bt.order_id = OLD.id
         OR (OLD.transaction_id IS NOT NULL AND (bt.payment_id = OLD.transaction_id OR bt.trx_id = OLD.transaction_id))
         OR (NEW.transaction_id IS NOT NULL AND (bt.payment_id = NEW.transaction_id OR bt.trx_id = NEW.transaction_id))
       )
     ORDER BY bt.paid_at DESC NULLS LAST, bt.updated_at DESC
     LIMIT 1;

    v_has_completed_tx := FOUND;

    IF v_has_completed_tx THEN
      -- A completed bKash PGW transaction is the source of truth: never let
      -- late callbacks, proof syncs, or background updates downgrade it.
      IF NEW.payment_status IS NULL OR NEW.payment_status IN ('pending', 'failed') THEN
        NEW.payment_status := CASE
          WHEN OLD.payment_status IN ('paid', 'verified') THEN OLD.payment_status
          ELSE 'paid'
        END;
      END IF;

      IF NEW.status IN ('pending', 'failed', 'cancelled') THEN
        NEW.status := CASE
          WHEN OLD.status IN ('completed', 'delivered') THEN OLD.status
          ELSE 'completed'
        END;
      END IF;

      IF (NEW.transaction_id IS NULL OR NEW.transaction_id = '' OR NEW.transaction_id = OLD.transaction_id)
         AND COALESCE(v_completed_tx.trx_id, '') <> '' THEN
        NEW.transaction_id := v_completed_tx.trx_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_paid_bkash_online_order_state ON public.orders;
CREATE TRIGGER trg_protect_paid_bkash_online_order_state
BEFORE UPDATE OF status, payment_status, transaction_id ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_paid_bkash_online_order_state();

CREATE OR REPLACE FUNCTION public.auto_convert_abandoned_checkout_for_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('cancelled', 'failed') THEN
    UPDATE public.abandoned_checkouts a
       SET converted = true,
           converted_order_id = NEW.id,
           converted_at = COALESCE(a.converted_at, now()),
           updated_at = now()
     WHERE a.converted = false
       AND a.created_at BETWEEN (NEW.created_at - interval '24 hours') AND (now() + interval '5 minutes')
       AND (
            (NEW.user_id IS NOT NULL AND a.user_id = NEW.user_id)
         OR (NULLIF(NEW.customer_phone, '') IS NOT NULL AND a.customer_phone = NEW.customer_phone)
         OR (NULLIF(NEW.customer_email, '') IS NOT NULL AND lower(a.customer_email) = lower(NEW.customer_email))
       )
       AND (
            COALESCE(a.total, 0) = 0
         OR COALESCE(NEW.total, 0) = 0
         OR abs(COALESCE(a.total, 0) - COALESCE(NEW.total, 0)) <= greatest(1, COALESCE(NEW.total, 0) * 0.05)
       );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_convert_abandoned_checkout_for_order ON public.orders;
CREATE TRIGGER trg_auto_convert_abandoned_checkout_for_order
AFTER INSERT OR UPDATE OF status, payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_convert_abandoned_checkout_for_order();