
CREATE OR REPLACE FUNCTION public.validate_order_item_pricing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Enforce submitted price >= product's true minimum sale price.
  -- Uses LEAST(price, original_price) so sale prices are honored, but
  -- clients cannot submit anything lower than what the store actually sells for.
  IF NEW.product_id IS NOT NULL THEN
    SELECT LEAST(
      COALESCE(price, original_price, 0),
      COALESCE(original_price, price, 0)
    )
    INTO min_price
    FROM public.products
    WHERE id = NEW.product_id;

    -- Allow 1 unit tolerance for rounding, but block any real discount at line level.
    IF min_price IS NOT NULL AND NEW.price < (min_price - 1) THEN
      RAISE EXCEPTION 'Order item price (%) is below the store price (%) for this product', NEW.price, min_price;
    END IF;
  END IF;

  -- Enforce line total = price * quantity (small rounding tolerance)
  computed_total := NEW.price * NEW.quantity;
  IF NEW.total IS NULL OR ABS(NEW.total - computed_total) > 1 THEN
    NEW.total := computed_total;
  END IF;

  RETURN NEW;
END;
$function$;
