ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personal_discount_percent smallint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.enforce_personal_discount_range()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.personal_discount_percent IS NULL THEN NEW.personal_discount_percent := 0; END IF;
  IF NEW.personal_discount_percent < 0 THEN NEW.personal_discount_percent := 0; END IF;
  IF NEW.personal_discount_percent > 20 THEN NEW.personal_discount_percent := 20; END IF;
  -- Only admins can change this value
  IF TG_OP = 'UPDATE' AND NEW.personal_discount_percent IS DISTINCT FROM OLD.personal_discount_percent THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.personal_discount_percent := OLD.personal_discount_percent;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_personal_discount_range_trg ON public.profiles;
CREATE TRIGGER enforce_personal_discount_range_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_personal_discount_range();