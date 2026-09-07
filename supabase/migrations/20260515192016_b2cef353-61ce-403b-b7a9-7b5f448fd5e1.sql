ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_coupons_customer_email ON public.coupons (customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_product_id ON public.coupons (product_id) WHERE product_id IS NOT NULL;

-- Lowercase trigger for customer_email so matching is case-insensitive
CREATE OR REPLACE FUNCTION public.coupons_normalize_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL THEN
    NEW.customer_email = lower(trim(NEW.customer_email));
    IF NEW.customer_email = '' THEN NEW.customer_email = NULL; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coupons_normalize_email ON public.coupons;
CREATE TRIGGER trg_coupons_normalize_email
BEFORE INSERT OR UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.coupons_normalize_email();