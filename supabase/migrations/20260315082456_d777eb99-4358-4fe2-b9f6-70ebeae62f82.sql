
-- ============================================================
-- PRODUCT CUSTOM OPTIONS SYSTEM
-- ============================================================

CREATE TABLE public.product_option_groups (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  display_type  TEXT NOT NULL DEFAULT 'button',
  is_required   BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.product_option_values (
  id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id         UUID NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label            TEXT NOT NULL,
  price_adjustment NUMERIC NOT NULL DEFAULT 0,
  is_default       BOOLEAN NOT NULL DEFAULT false,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_option_groups_product ON public.product_option_groups(product_id);
CREATE INDEX idx_product_option_values_group   ON public.product_option_values(group_id);
CREATE INDEX idx_product_option_values_product ON public.product_option_values(product_id);

ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product option groups"
  ON public.product_option_groups FOR SELECT USING (true);

CREATE POLICY "Admins can manage product option groups"
  ON public.product_option_groups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view product option values"
  ON public.product_option_values FOR SELECT USING (true);

CREATE POLICY "Admins can manage product option values"
  ON public.product_option_values FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_option_groups_updated_at
  BEFORE UPDATE ON public.product_option_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_option_values_updated_at
  BEFORE UPDATE ON public.product_option_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
