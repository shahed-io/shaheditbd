CREATE OR REPLACE FUNCTION public.notify_new_order_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/notify-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdmRhdmp3cXl2aXJlZHpvb3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDk2MTgsImV4cCI6MjA4NzkyNTYxOH0.H7j1ssfIrpFtqWgCXVOwFwJm7aC2qQoW5UmBiWHB9cE'
    ),
    body := jsonb_build_object('orderId', NEW.id::text)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'notify_new_order_telegram error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;