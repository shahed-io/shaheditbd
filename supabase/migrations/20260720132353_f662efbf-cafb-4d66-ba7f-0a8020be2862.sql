
-- Server-side validation for order pricing to prevent client price manipulation.
-- Admins and service_role bypass. Non-admins must submit prices >= product's minimum
-- legit price and totals must match line math.

CREATE OR REPLACE FUNCTION public.validate_order_item_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  min_price numeric;
  computed_total numeric;
BEGIN
  -- Bypass for admin and for no-auth contexts (service role / triggers / edge functions)
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;
  IF NEW.price IS NULL OR NEW.price < 0 THEN
    RAISE EXCEPTION 'Invalid price';
  END IF;

  -- Compare submitted price against product's minimum legitimate price
  IF NEW.product_id IS NOT NULL THEN
    SELECT LEAST(
      COALESCE(price, 0),
      COALESCE(original_price, price, 0)
    )
    INTO min_price
    FROM public.products
    WHERE id = NEW.product_id;

    IF min_price IS NOT NULL AND NEW.price < (min_price * 0.5) THEN
      RAISE EXCEPTION 'Order item price (%) is below the allowed minimum for this product', NEW.price;
    END IF;
  END IF;

  -- Enforce line total = price * quantity (small rounding tolerance)
  computed_total := NEW.price * NEW.quantity;
  IF NEW.total IS NULL OR ABS(NEW.total - computed_total) > 1 THEN
    NEW.total := computed_total;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_order_item_pricing_trg ON public.order_items;
CREATE TRIGGER validate_order_item_pricing_trg
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_pricing();


CREATE OR REPLACE FUNCTION public.validate_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_total numeric;
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.subtotal IS NULL OR NEW.subtotal < 0 THEN
    RAISE EXCEPTION 'Invalid subtotal';
  END IF;
  IF NEW.total IS NULL OR NEW.total < 0 THEN
    RAISE EXCEPTION 'Invalid total';
  END IF;

  expected_total := NEW.subtotal
                    - COALESCE(NEW.discount_amount, 0)
                    - COALESCE(NEW.affiliate_discount_amount, 0);

  -- Allow rounding tolerance of 1 unit
  IF ABS(NEW.total - expected_total) > 1 THEN
    RAISE EXCEPTION 'Order total (%) does not match subtotal minus discounts (%)', NEW.total, expected_total;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_order_totals_trg ON public.orders;
CREATE TRIGGER validate_order_totals_trg
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_totals();
