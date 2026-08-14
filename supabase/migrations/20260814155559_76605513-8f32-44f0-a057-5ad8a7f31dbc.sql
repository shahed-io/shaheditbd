CREATE OR REPLACE FUNCTION public.validate_payment_link_submission_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pl RECORD;
  expected_qty integer;
  expected_total numeric;
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO pl FROM public.payment_links
  WHERE (NEW.payment_link_id IS NOT NULL AND id = NEW.payment_link_id)
     OR (NEW.payment_link_id IS NULL AND slug = NEW.link_slug)
  LIMIT 1;

  IF pl IS NULL THEN
    RAISE EXCEPTION 'Invalid payment link';
  END IF;

  IF COALESCE(pl.is_open_form, false) THEN
    RETURN NEW;
  END IF;

  -- Amount must match the configured link amount
  IF NEW.amount IS DISTINCT FROM pl.amount THEN
    RAISE EXCEPTION 'Submitted amount does not match the payment link amount';
  END IF;

  expected_qty := COALESCE(NEW.quantity, 1);
  IF NOT COALESCE(pl.allow_qty_change, false) THEN
    expected_qty := COALESCE(pl.quantity, 1);
  END IF;
  IF expected_qty < 1 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;
  NEW.quantity := expected_qty;

  expected_total := ROUND(pl.amount * expected_qty, 2);
  IF NEW.total IS NULL OR ROUND(NEW.total, 2) IS DISTINCT FROM expected_total THEN
    NEW.total := expected_total;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_payment_link_submission_amount ON public.payment_link_submissions;
CREATE TRIGGER trg_validate_payment_link_submission_amount
BEFORE INSERT OR UPDATE OF amount, total, quantity, payment_link_id, link_slug
ON public.payment_link_submissions
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_link_submission_amount();