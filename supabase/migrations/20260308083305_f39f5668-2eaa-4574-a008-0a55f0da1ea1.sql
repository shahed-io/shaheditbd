
-- Drop restrictive policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (status = 'active'::product_status);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Force PERMISSIVE by altering existing policies
ALTER POLICY "Anyone can view active products" ON public.products USING (status = 'active'::product_status);
ALTER POLICY "Anyone can view active categories" ON public.categories USING (is_active = true);
