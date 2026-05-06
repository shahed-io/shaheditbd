-- Auto-ping Google when sitemap-relevant content changes
CREATE OR REPLACE FUNCTION public.ping_sitemap_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Async ping — never blocks the actual write
  PERFORM net.http_get(
    url := 'https://www.google.com/ping?sitemap=https://shahedstore.com.bd/sitemap.xml'
  );
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'ping_sitemap_on_change error: % %', SQLERRM, SQLSTATE;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Products
DROP TRIGGER IF EXISTS trg_ping_sitemap_products ON public.products;
CREATE TRIGGER trg_ping_sitemap_products
AFTER INSERT OR UPDATE OF slug, status, name OR DELETE ON public.products
FOR EACH STATEMENT
EXECUTE FUNCTION public.ping_sitemap_on_change();

-- Categories
DROP TRIGGER IF EXISTS trg_ping_sitemap_categories ON public.categories;
CREATE TRIGGER trg_ping_sitemap_categories
AFTER INSERT OR UPDATE OF slug, is_active, name OR DELETE ON public.categories
FOR EACH STATEMENT
EXECUTE FUNCTION public.ping_sitemap_on_change();

-- Blog posts
DROP TRIGGER IF EXISTS trg_ping_sitemap_blog ON public.blog_posts;
CREATE TRIGGER trg_ping_sitemap_blog
AFTER INSERT OR UPDATE OF slug, status, title OR DELETE ON public.blog_posts
FOR EACH STATEMENT
EXECUTE FUNCTION public.ping_sitemap_on_change();