
-- 1) Protect privileged columns on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Service role / no auth context (e.g. triggers, edge functions) bypasses protection
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

  -- Non-admin: reset privileged/financial columns to their old values
  NEW.wallet_balance             := OLD.wallet_balance;
  NEW.referral_earnings          := OLD.referral_earnings;
  NEW.referral_credit            := OLD.referral_credit;
  NEW.referral_credit_balance    := OLD.referral_credit_balance;
  NEW.points_balance             := OLD.points_balance;
  NEW.total_points_earned        := OLD.total_points_earned;
  NEW.total_points_redeemed      := OLD.total_points_redeemed;
  NEW.personal_discount_percent  := OLD.personal_discount_percent;
  NEW.is_suspended               := OLD.is_suspended;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 2) Protect support_tickets: add WITH CHECK + column protection trigger
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
CREATE POLICY "Users can update own tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_support_ticket_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_staff boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    is_staff := public.has_role(auth.uid(), 'admin'::app_role)
             OR public.has_role(auth.uid(), 'manager'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_staff := false;
  END;

  IF is_staff THEN
    RETURN NEW;
  END IF;

  -- Non-staff cannot change ownership, status, priority, assignment
  NEW.user_id     := OLD.user_id;
  NEW.status      := OLD.status;
  NEW.priority    := OLD.priority;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_support_ticket_columns_trg ON public.support_tickets;
CREATE TRIGGER protect_support_ticket_columns_trg
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.protect_support_ticket_columns();
