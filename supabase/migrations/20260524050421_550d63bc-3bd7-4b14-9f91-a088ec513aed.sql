-- ============================================================
-- Security fix #1: Restrict affiliate_accounts self-update to safe columns
-- ============================================================
-- Prevent affiliates from escalating their own commission rate, balances, or status.
-- Trigger blocks changes to sensitive columns unless the actor is an admin.

CREATE OR REPLACE FUNCTION public.protect_affiliate_account_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins may modify anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Owner update path: lock down sensitive columns to their old values
  NEW.custom_commission_percent := OLD.custom_commission_percent;
  NEW.available_balance         := OLD.available_balance;
  NEW.total_earned              := OLD.total_earned;
  NEW.total_paid                := OLD.total_paid;
  NEW.total_conversions         := OLD.total_conversions;
  NEW.total_clicks              := OLD.total_clicks;
  NEW.status                    := OLD.status;
  NEW.referral_code             := OLD.referral_code;
  NEW.user_id                   := OLD.user_id;
  NEW.approved_at               := OLD.approved_at;
  NEW.approved_by               := OLD.approved_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_affiliate_account_columns_trg ON public.affiliate_accounts;
CREATE TRIGGER protect_affiliate_account_columns_trg
BEFORE UPDATE ON public.affiliate_accounts
FOR EACH ROW
EXECUTE FUNCTION public.protect_affiliate_account_columns();

-- ============================================================
-- Security fix #2: Hide products.cost_price from public visitors
-- ============================================================
-- Re-revoke column-level SELECT on cost_price (and download_link) so anon/authenticated
-- roles cannot read internal margin / private fulfilment data.
REVOKE SELECT (cost_price)    ON public.products FROM anon, authenticated, PUBLIC;
REVOKE SELECT (download_link) ON public.products FROM anon, authenticated, PUBLIC;

-- Service role / admins keep full access via SECURITY DEFINER paths and direct grants.
