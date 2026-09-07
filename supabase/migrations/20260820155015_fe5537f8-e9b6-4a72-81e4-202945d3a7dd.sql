INSERT INTO public.site_settings (key, value)
VALUES ('order_notify_secret', encode(gen_random_bytes(24), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_order_status_change_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status_label text;
  v_emoji text;
  v_secret text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status::text
    WHEN 'processing' THEN v_status_label := 'প্রসেসিং'; v_emoji := '⚙️';
    WHEN 'completed' THEN v_status_label := 'সম্পন্ন'; v_emoji := '✅';
    WHEN 'delivered' THEN v_status_label := 'ডেলিভারি সম্পন্ন'; v_emoji := '🚀';
    WHEN 'cancelled' THEN v_status_label := 'বাতিল'; v_emoji := '❌';
    WHEN 'refunded' THEN v_status_label := 'রিফান্ড'; v_emoji := '💸';
    WHEN 'failed' THEN v_status_label := 'ব্যর্থ'; v_emoji := '⚠️';
    ELSE v_status_label := NEW.status::text; v_emoji := '🔄';
  END CASE;

  SELECT value INTO v_secret FROM public.site_settings WHERE key = 'order_notify_secret';

  BEGIN
    PERFORM net.http_post(
      url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/order-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-notify-secret', COALESCE(v_secret, ''),
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdmRhdmp3cXl2aXJlZHpvb3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDk2MTgsImV4cCI6MjA4NzkyNTYxOH0.H7j1ssfIrpFtqWgCXVOwFwJm7aC2qQoW5UmBiWHB9cE'
      ),
      body := jsonb_build_object(
        'type', 'status_change',
        'orderId', NEW.id::text,
        'oldStatus', OLD.status::text
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'order status notify failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;