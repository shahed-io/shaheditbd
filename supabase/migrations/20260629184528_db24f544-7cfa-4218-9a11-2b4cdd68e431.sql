CREATE OR REPLACE FUNCTION public.notify_seo_ping_blog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  url_to_ping text;
BEGIN
  IF NEW.status = 'published' AND NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND OLD.slug = NEW.slug
       AND OLD.title = NEW.title THEN
      RETURN NEW;
    END IF;

    url_to_ping := 'https://shahedstore.com.bd/blog/' || NEW.slug;

    BEGIN
      PERFORM extensions.http_post(
        url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/seo-ping',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object('urls', jsonb_build_array(url_to_ping))
      );
    EXCEPTION WHEN undefined_function THEN
      RAISE LOG 'notify_seo_ping_blog skipped: http_post helper unavailable';
    WHEN OTHERS THEN
      RAISE LOG 'notify_seo_ping_blog error: % %', SQLERRM, SQLSTATE;
    END;
  END IF;
  RETURN NEW;
END;
$$;