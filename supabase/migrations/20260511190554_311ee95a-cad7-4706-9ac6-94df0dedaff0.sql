CREATE OR REPLACE FUNCTION public.notify_seo_ping_product()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  url_to_ping text;
BEGIN
  IF NEW.status = 'active' AND NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND OLD.slug = NEW.slug
       AND OLD.name = NEW.name AND OLD.price = NEW.price THEN
      RETURN NEW;
    END IF;

    url_to_ping := 'https://shahedstore.com.bd/product/' || NEW.slug;

    BEGIN
      PERFORM net.http_post(
        url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/seo-ping',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object('urls', jsonb_build_array(url_to_ping))
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'notify_seo_ping_product error: % %', SQLERRM, SQLSTATE;
    END;
  END IF;
  RETURN NEW;
END;
$function$;