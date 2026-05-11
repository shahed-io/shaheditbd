
-- Lock down sensitive tables that were publicly readable

-- 1. abandoned_checkouts: contains customer PII (name, email, phone, cart). Drop public SELECT.
DROP POLICY IF EXISTS "Public can read own abandoned checkout by session" ON public.abandoned_checkouts;

-- Allow authenticated users to view only their own rows (by user_id) so logged-in checkout flow still works.
CREATE POLICY "Users can read their own abandoned checkout"
  ON public.abandoned_checkouts
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- 2. welcome_coupons: coupon codes were publicly readable (anyone could harvest). Drop public SELECT.
-- Validation happens via the validate-coupon edge function using service_role.
DROP POLICY IF EXISTS "Anyone can read welcome coupons by code" ON public.welcome_coupons;

CREATE POLICY "Admins can view welcome coupons"
  ON public.welcome_coupons
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. affiliate_product_commissions: per-product commission rates were public. Server-side only via SECURITY DEFINER functions.
DROP POLICY IF EXISTS "view_aff_pc" ON public.affiliate_product_commissions;
-- admin_manage_aff_pc (ALL for admin) already covers admin SELECT.
