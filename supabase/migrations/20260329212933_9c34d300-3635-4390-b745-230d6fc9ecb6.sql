
-- Create a function that sends Telegram notification via the edge function on new order insert
CREATE OR REPLACE FUNCTION public.notify_new_order_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Get Supabase URL and service role key from vault
  SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  -- Call the notify-new-order edge function via pg_net
  IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/notify-new-order',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object('orderId', NEW.id::text)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on orders table for new inserts
DROP TRIGGER IF EXISTS trigger_notify_new_order_telegram ON public.orders;
CREATE TRIGGER trigger_notify_new_order_telegram
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order_telegram();
