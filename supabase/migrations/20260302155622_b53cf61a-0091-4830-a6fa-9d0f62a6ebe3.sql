-- Fix products RLS: drop restrictive SELECT, add permissive one
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (status = 'active'::product_status);

-- Fix categories RLS: drop restrictive SELECT, add permissive one
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories"
  ON public.categories
  FOR SELECT
  USING ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role));
