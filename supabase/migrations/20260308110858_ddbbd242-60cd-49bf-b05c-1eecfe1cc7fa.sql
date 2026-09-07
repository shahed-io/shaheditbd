
-- Fix: explicitly grant anon + authenticated roles to read products and categories
-- Previous policies were missing TO clause so only worked for authenticated role

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (status = 'active'::product_status);

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
