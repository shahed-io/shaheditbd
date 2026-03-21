
-- Function: auto-assign license keys to order items when order is completed
CREATE OR REPLACE FUNCTION public.auto_assign_licenses(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_key RECORD;
  v_assigned_count integer := 0;
  v_total_needed integer := 0;
  i integer;
BEGIN
  FOR v_item IN
    SELECT oi.id, oi.product_id, oi.quantity, oi.license_key
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
  LOOP
    v_total_needed := v_total_needed + v_item.quantity;
    FOR i IN 1..v_item.quantity LOOP
      IF i = 1 AND v_item.license_key IS NOT NULL THEN
        CONTINUE;
      END IF;
      SELECT id, key_value, key_type, extra_info
      INTO v_key
      FROM public.license_keys
      WHERE product_id = v_item.product_id
        AND status = 'available'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      IF FOUND THEN
        UPDATE public.license_keys
        SET status = 'assigned',
            order_item_id = v_item.id,
            assigned_at = now()
        WHERE id = v_key.id;

        UPDATE public.order_items
        SET license_key = CASE
          WHEN v_key.extra_info IS NOT NULL AND v_key.extra_info != ''
            THEN v_key.key_value || '|' || v_key.extra_info
          ELSE v_key.key_value
        END
        WHERE id = v_item.id;

        v_assigned_count := v_assigned_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'assigned', v_assigned_count,
    'needed', v_total_needed
  );
END;
$$;

-- Trigger function: called when order status changes to 'completed'
CREATE OR REPLACE FUNCTION public.trigger_assign_licenses_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM public.auto_assign_licenses(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS assign_licenses_on_order_complete ON public.orders;
CREATE TRIGGER assign_licenses_on_order_complete
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_licenses_on_completion();
