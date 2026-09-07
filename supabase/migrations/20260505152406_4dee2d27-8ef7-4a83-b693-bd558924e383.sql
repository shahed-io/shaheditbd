
-- Trigger: notify Telegram when an abandoned checkout is saved or converted
CREATE OR REPLACE FUNCTION public.notify_abandoned_checkout_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_lines jsonb;
  v_is_new boolean;
  v_just_converted boolean;
  v_item_summary text := '';
  v_item jsonb;
BEGIN
  v_is_new := (TG_OP = 'INSERT');
  v_just_converted := (TG_OP = 'UPDATE')
                      AND COALESCE(NEW.converted, false) = true
                      AND COALESCE(OLD.converted, false) = false;

  -- Skip noise updates (only fire on first save or first conversion)
  IF NOT v_is_new AND NOT v_just_converted THEN
    RETURN NEW;
  END IF;

  -- Skip empty rows on insert (no contact info or no items)
  IF v_is_new AND COALESCE(NEW.item_count, 0) = 0
     AND NEW.customer_email IS NULL
     AND NEW.customer_phone IS NULL
     AND NEW.customer_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build item summary (first 3 products)
  IF NEW.cart_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.cart_items) LIMIT 3 LOOP
      v_item_summary := v_item_summary
        || '• ' || COALESCE(v_item->>'name', 'Item')
        || ' × ' || COALESCE(v_item->>'quantity', '1') || E'\n';
    END LOOP;
  END IF;

  IF v_just_converted THEN
    v_title := '✅ Abandoned checkout RECOVERED!';
  ELSE
    v_title := '🛒 New abandoned checkout';
  END IF;

  v_lines := jsonb_build_array(
    '👤 Name: ' || COALESCE(NEW.customer_name, '—'),
    '📧 Email: ' || COALESCE(NEW.customer_email, '—'),
    '📱 Phone: ' || COALESCE(NEW.customer_phone, '—'),
    '🛍️ Items: ' || COALESCE(NEW.item_count::text, '0'),
    '💰 Total: ৳' || COALESCE(NEW.total::text, '0'),
    CASE WHEN NEW.coupon_code IS NOT NULL THEN '🎟️ Coupon: ' || NEW.coupon_code ELSE NULL END,
    CASE WHEN NEW.payment_method IS NOT NULL THEN '💳 Method: ' || NEW.payment_method ELSE NULL END,
    CASE WHEN v_item_summary <> '' THEN E'\n' || v_item_summary ELSE NULL END
  );

  PERFORM net.http_post(
    url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/notify-telegram-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdmRhdmp3cXl2aXJlZHpvb3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDk2MTgsImV4cCI6MjA4NzkyNTYxOH0.H7j1ssfIrpFtqWgCXVOwFwJm7aC2qQoW5UmBiWHB9cE'
    ),
    body := jsonb_build_object(
      'title', v_title,
      'lines', v_lines,
      'footer', CASE WHEN v_just_converted
        THEN '🎉 Customer completed payment'
        ELSE '⏳ Pending recovery — follow up via WhatsApp/Email' END
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'notify_abandoned_checkout_telegram error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_abandoned_checkout_telegram ON public.abandoned_checkouts;
CREATE TRIGGER trg_notify_abandoned_checkout_telegram
AFTER INSERT OR UPDATE ON public.abandoned_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.notify_abandoned_checkout_telegram();
