
-- ============================================================
-- WOOCOMMERCE-LIKE PRODUCT ATTRIBUTES SYSTEM
-- ============================================================

-- Global attribute definitions (e.g. Color, Size, Brand, Platform)
CREATE TABLE public.global_attributes (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL DEFAULT 'select',   -- 'select' | 'text' | 'color'
  order_by    TEXT NOT NULL DEFAULT 'name',     -- 'name' | 'name_num' | 'id' | 'custom'
  has_archives BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Values for global attributes (e.g. Red, Blue, S, M, L for a 'Color', 'Size' attribute)
CREATE TABLE public.global_attribute_values (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attribute_id  UUID NOT NULL REFERENCES public.global_attributes(id) ON DELETE CASCADE,
  value         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  color_code    TEXT,             -- hex for 'color' type attributes
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, slug)
);

-- Product <-> attribute assignments
-- Supports both global attributes and custom (inline) attributes
CREATE TABLE public.product_attribute_assignments (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id    UUID REFERENCES public.global_attributes(id) ON DELETE SET NULL,  -- NULL for custom
  custom_name     TEXT,              -- filled when attribute_type='custom'
  attribute_type  TEXT NOT NULL DEFAULT 'global',  -- 'global' | 'custom'
  selected_values JSONB NOT NULL DEFAULT '[]',  -- array of value strings (for display)
  is_visible      BOOLEAN NOT NULL DEFAULT true,
  use_in_variation BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_global_attribute_values_attr ON public.global_attribute_values(attribute_id);
CREATE INDEX idx_product_attr_assignments_product ON public.product_attribute_assignments(product_id);
CREATE INDEX idx_product_attr_assignments_attr ON public.product_attribute_assignments(attribute_id);

-- RLS
ALTER TABLE public.global_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_assignments ENABLE ROW LEVEL SECURITY;

-- global_attributes policies
CREATE POLICY "Anyone can view global attributes"
  ON public.global_attributes FOR SELECT USING (true);
CREATE POLICY "Admins can manage global attributes"
  ON public.global_attributes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- global_attribute_values policies
CREATE POLICY "Anyone can view global attribute values"
  ON public.global_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage global attribute values"
  ON public.global_attribute_values FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- product_attribute_assignments policies
CREATE POLICY "Anyone can view product attribute assignments"
  ON public.product_attribute_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage product attribute assignments"
  ON public.product_attribute_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamps
CREATE TRIGGER update_global_attributes_updated_at
  BEFORE UPDATE ON public.global_attributes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_attribute_values_updated_at
  BEFORE UPDATE ON public.global_attribute_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_attribute_assignments_updated_at
  BEFORE UPDATE ON public.product_attribute_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
