ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS variant text;
CREATE INDEX IF NOT EXISTS idx_license_keys_product_variant_status ON public.license_keys(product_id, variant, status);