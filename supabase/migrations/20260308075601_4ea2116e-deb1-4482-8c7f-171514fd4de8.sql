-- Fix products RLS: change RESTRICTIVE policies to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (status = 'active'::product_status);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix categories RLS too
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));