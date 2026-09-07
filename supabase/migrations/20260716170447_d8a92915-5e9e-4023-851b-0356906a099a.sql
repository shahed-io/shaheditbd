-- Fix: welcome coupon trigger was referencing a non-existent used_at column,
-- causing checkout to fail whenever a welcome coupon was applied.

ALTER TABLE public.welcome_coupons
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

-- Make the trigger fail-safe: even if coupon lookup errors, the order must
-- always be created (admin or customer). Coupon marking is best-effort only.
CREATE OR REPLACE FUNCTION public.mark_welcome_coupon_used_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    IF NEW.coupon_code IS NOT NULL AND upper(NEW.coupon_code) LIKE 'WELCOME-%' THEN
      UPDATE public.welcome_coupons
      SET is_used = true,
          used_by_order_id = NEW.id,
          used_at = now()
      WHERE upper(code) = upper(NEW.coupon_code)
        AND is_used = false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- never block the order because of a coupon marking failure
    RAISE WARNING 'mark_welcome_coupon_used_on_order failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;