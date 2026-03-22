
-- Many-to-many: product ↔ categories
CREATE TABLE public.product_categories (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product categories"
  ON public.product_categories FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view product categories"
  ON public.product_categories FOR SELECT TO public
  USING (true);

-- Backfill from existing primary category_id
INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM public.products
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category_id);
