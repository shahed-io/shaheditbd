CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    is_admin_user := public.has_role(auth.uid(), 'admin'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_admin_user := false;
  END;

  IF is_admin_user THEN
    RETURN NEW;
  END IF;

  NEW.wallet_balance             := OLD.wallet_balance;
  NEW.referral_earnings          := OLD.referral_earnings;
  NEW.referral_credit            := OLD.referral_credit;
  NEW.referral_credit_balance    := OLD.referral_credit_balance;
  NEW.points_balance             := OLD.points_balance;
  NEW.total_points_earned        := OLD.total_points_earned;
  NEW.total_points_redeemed      := OLD.total_points_redeemed;
  NEW.personal_discount_percent  := OLD.personal_discount_percent;
  NEW.is_suspended               := OLD.is_suspended;
  NEW.suspended_reason           := OLD.suspended_reason;
  NEW.referral_discount          := OLD.referral_discount;
  NEW.referral_code              := OLD.referral_code;
  NEW.referred_by                := OLD.referred_by;
  NEW.signup_ip                  := OLD.signup_ip;
  NEW.user_id                    := OLD.user_id;

  RETURN NEW;
END;
$function$;