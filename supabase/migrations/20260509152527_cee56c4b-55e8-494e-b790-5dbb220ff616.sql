-- Auto-ping IndexNow (Bing/Yandex) whenever a product or blog post becomes visible.
-- Uses pg_net to fire-and-forget POST to seo-ping edge function.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_seo_ping_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  url_to_ping text;
BEGIN
  -- Only ping when product is active and slug is set
  IF NEW.status = 'active' AND NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    -- Skip if nothing meaningful changed (UPDATE only)
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND OLD.slug = NEW.slug
       AND OLD.name = NEW.name AND OLD.price = NEW.price THEN
      RETURN NEW;
    END IF;

    url_to_ping := 'https://shahedstore.com.bd/product/' || NEW.slug;

    PERFORM extensions.http_post(
      url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/seo-ping',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('urls', jsonb_build_array(url_to_ping))
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seo_ping_product ON public.products;
CREATE TRIGGER trg_seo_ping_product
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_seo_ping_product();

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

    PERFORM extensions.http_post(
      url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/seo-ping',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('urls', jsonb_build_array(url_to_ping))
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seo_ping_blog ON public.blog_posts;
CREATE TRIGGER trg_seo_ping_blog
AFTER INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_seo_ping_blog();