-- Function to notify Telegram on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status_label text;
  v_emoji text;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map status to Bengali label and emoji
  CASE NEW.status::text
    WHEN 'processing' THEN v_status_label := 'প্রসেসিং'; v_emoji := '⚙️';
    WHEN 'completed' THEN v_status_label := 'সম্পন্ন'; v_emoji := '✅';
    WHEN 'delivered' THEN v_status_label := 'ডেলিভারি সম্পন্ন'; v_emoji := '🚀';
    WHEN 'cancelled' THEN v_status_label := 'বাতিল'; v_emoji := '❌';
    WHEN 'refunded' THEN v_status_label := 'রিফান্ড'; v_emoji := '💸';
    WHEN 'failed' THEN v_status_label := 'ব্যর্থ'; v_emoji := '⚠️';
    ELSE v_status_label := NEW.status::text; v_emoji := '🔄';
  END CASE;

  PERFORM net.http_post(
    url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/order-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdmRhdmp3cXl2aXJlZHpvb3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDk2MTgsImV4cCI6MjA4NzkyNTYxOH0.H7j1ssfIrpFtqWgCXVOwFwJm7aC2qQoW5UmBiWHB9cE'
    ),
    body := jsonb_build_object(
      'type', 'status_change',
      'orderId', NEW.id::text,
      'orderNumber', NEW.order_number,
      'customerName', NEW.customer_name,
      'customerPhone', COALESCE(NEW.customer_phone, ''),
      'total', NEW.total,
      'oldStatus', OLD.status::text,
      'newStatus', NEW.status::text,
      'statusLabel', v_status_label,
      'emoji', v_emoji
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'notify_order_status_change_telegram error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS on_order_status_change_notify_telegram ON public.orders;
CREATE TRIGGER on_order_status_change_notify_telegram
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change_telegram();