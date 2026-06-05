
-- 1. Protect financial fields on profiles from user self-modification
CREATE OR REPLACE FUNCTION public.protect_profile_financial_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.wallet_balance           := OLD.wallet_balance;
  NEW.points_balance           := OLD.points_balance;
  NEW.total_points_earned      := OLD.total_points_earned;
  NEW.total_points_redeemed    := OLD.total_points_redeemed;
  NEW.referral_credit          := OLD.referral_credit;
  NEW.referral_credit_balance  := OLD.referral_credit_balance;
  NEW.referral_earnings        := OLD.referral_earnings;
  NEW.referral_discount        := OLD.referral_discount;
  NEW.referral_code            := OLD.referral_code;
  NEW.referred_by              := OLD.referred_by;
  NEW.signup_ip                := OLD.signup_ip;
  NEW.user_id                  := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_financial_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_financial_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_financial_columns();

-- 2. Defense-in-depth WITH CHECK on affiliate_accounts user UPDATE policy
DROP POLICY IF EXISTS user_update_own_aff ON public.affiliate_accounts;
CREATE POLICY user_update_own_aff ON public.affiliate_accounts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Restrict blog_comments author_email on insert
DROP POLICY IF EXISTS "Anyone can submit a comment" ON public.blog_comments;
CREATE POLICY "Anyone can submit a comment" ON public.blog_comments
FOR INSERT
WITH CHECK (
  length(author_name) > 0
  AND length(author_name) <= 200
  AND length(content) > 0
  AND length(content) <= 5000
  AND (
    author_email IS NULL
    OR (auth.uid() IS NOT NULL AND lower(author_email) = lower((auth.jwt() ->> 'email')))
  )
);

-- 4. Mark welcome coupon used when an order using it is placed (not at validation)
CREATE OR REPLACE FUNCTION public.mark_welcome_coupon_used_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL AND upper(NEW.coupon_code) LIKE 'WELCOME-%' THEN
    UPDATE public.welcome_coupons
    SET is_used = true,
        used_by_order_id = NEW.id,
        used_at = now()
    WHERE upper(code) = upper(NEW.coupon_code)
      AND is_used = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_welcome_coupon_used ON public.orders;
CREATE TRIGGER trg_mark_welcome_coupon_used
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.mark_welcome_coupon_used_on_order();

-- 5. Lock down search_path on internal helpers
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
