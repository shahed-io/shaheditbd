
-- 1) Fix mutable search_path on paypal_tx_touch_updated_at
CREATE OR REPLACE FUNCTION public.paypal_tx_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 2) Harden order_items: guest inserts now only allowed via service role (edge function `guest-order-finalize`)
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert their own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  )
);

-- 3) Harden affiliate_clicks: rate-limit / dedupe inserts per visitor to prevent inflation
CREATE OR REPLACE FUNCTION public.affiliate_clicks_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.visitor_id IS NULL OR length(NEW.visitor_id) < 8 OR length(NEW.visitor_id) > 128 THEN
    RAISE EXCEPTION 'invalid visitor_id';
  END IF;

  SELECT count(*) INTO recent_count
  FROM public.affiliate_clicks
  WHERE affiliate_id = NEW.affiliate_id
    AND visitor_id = NEW.visitor_id
    AND created_at > now() - interval '1 hour';

  IF recent_count > 0 THEN
    -- Silently ignore duplicate/inflated attempts within 1h window
    RETURN NULL;
  END IF;

  SELECT count(*) INTO recent_count
  FROM public.affiliate_clicks
  WHERE visitor_id = NEW.visitor_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'rate limit exceeded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS affiliate_clicks_rate_limit_trg ON public.affiliate_clicks;
CREATE TRIGGER affiliate_clicks_rate_limit_trg
BEFORE INSERT ON public.affiliate_clicks
FOR EACH ROW EXECUTE FUNCTION public.affiliate_clicks_rate_limit();
