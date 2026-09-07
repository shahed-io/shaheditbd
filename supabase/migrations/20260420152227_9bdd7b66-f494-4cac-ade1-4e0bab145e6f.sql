-- 1. Settings
CREATE TABLE public.affiliate_settings (
  id integer PRIMARY KEY DEFAULT 1,
  is_enabled boolean NOT NULL DEFAULT true,
  default_commission_percent numeric NOT NULL DEFAULT 10,
  customer_discount_percent numeric NOT NULL DEFAULT 0,
  enable_customer_discount boolean NOT NULL DEFAULT false,
  enable_affiliate_commission boolean NOT NULL DEFAULT true,
  minimum_withdrawal numeric NOT NULL DEFAULT 500,
  cookie_duration_days integer NOT NULL DEFAULT 30,
  auto_approve_applications boolean NOT NULL DEFAULT false,
  terms_and_conditions text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.affiliate_settings (id) VALUES (1);
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_affiliate_settings" ON public.affiliate_settings FOR SELECT USING (true);
CREATE POLICY "admin_manage_affiliate_settings" ON public.affiliate_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Affiliate Accounts
CREATE TABLE public.affiliate_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  custom_commission_percent numeric,
  custom_customer_discount_percent numeric,
  total_clicks integer NOT NULL DEFAULT 0,
  total_conversions integer NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  available_balance numeric NOT NULL DEFAULT 0,
  payout_method text,
  payout_account text,
  payout_account_name text,
  application_note text,
  admin_note text,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_aff_status CHECK (status IN ('pending','approved','rejected','suspended'))
);
CREATE INDEX idx_aff_acc_user ON public.affiliate_accounts(user_id);
CREATE INDEX idx_aff_acc_code ON public.affiliate_accounts(referral_code);
CREATE INDEX idx_aff_acc_status ON public.affiliate_accounts(status);
ALTER TABLE public.affiliate_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_view_own_aff" ON public.affiliate_accounts FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "user_apply_aff" ON public.affiliate_accounts FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "user_update_own_aff" ON public.affiliate_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_manage_aff" ON public.affiliate_accounts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Per-product commission
CREATE TABLE public.affiliate_product_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  commission_percent numeric NOT NULL,
  customer_discount_percent numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aff_pc_product ON public.affiliate_product_commissions(product_id);
ALTER TABLE public.affiliate_product_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_aff_pc" ON public.affiliate_product_commissions FOR SELECT USING (true);
CREATE POLICY "admin_manage_aff_pc" ON public.affiliate_product_commissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Clicks
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_accounts(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  visitor_id text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  landing_page text,
  ip_address text,
  user_agent text,
  referrer text,
  country text,
  converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aff_clicks_aff ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_aff_clicks_visitor ON public.affiliate_clicks(visitor_id);
CREATE INDEX idx_aff_clicks_created ON public.affiliate_clicks(created_at DESC);
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_insert_click" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "view_own_clicks" ON public.affiliate_clicks FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliate_accounts WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_manage_clicks" ON public.affiliate_clicks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Conversions
CREATE TABLE public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_accounts(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  order_total numeric NOT NULL,
  commission_percent numeric NOT NULL,
  commission_amount numeric NOT NULL,
  customer_discount_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, affiliate_id),
  CONSTRAINT valid_conv_status CHECK (status IN ('pending','approved','paid','rejected','reversed'))
);
CREATE INDEX idx_aff_conv_aff ON public.affiliate_conversions(affiliate_id);
CREATE INDEX idx_aff_conv_order ON public.affiliate_conversions(order_id);
CREATE INDEX idx_aff_conv_status ON public.affiliate_conversions(status);
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_own_conv" ON public.affiliate_conversions FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliate_accounts WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_manage_conv" ON public.affiliate_conversions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Withdrawals
CREATE TABLE public.affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  method text NOT NULL,
  account_number text NOT NULL,
  account_name text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  transaction_id text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  CONSTRAINT valid_wd_status CHECK (status IN ('pending','approved','paid','rejected','cancelled'))
);
CREATE INDEX idx_aff_wd_aff ON public.affiliate_withdrawals(affiliate_id);
CREATE INDEX idx_aff_wd_user ON public.affiliate_withdrawals(user_id);
CREATE INDEX idx_aff_wd_status ON public.affiliate_withdrawals(status);
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_own_wd" ON public.affiliate_withdrawals FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "user_request_wd" ON public.affiliate_withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending' AND affiliate_id IN (SELECT id FROM public.affiliate_accounts WHERE user_id = auth.uid() AND status = 'approved'));
CREATE POLICY "admin_manage_wd" ON public.affiliate_withdrawals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at triggers
CREATE TRIGGER trg_aff_acc_upd BEFORE UPDATE ON public.affiliate_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_aff_pc_upd BEFORE UPDATE ON public.affiliate_product_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_aff_conv_upd BEFORE UPDATE ON public.affiliate_conversions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_code text; v_attempts int := 0;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliate_accounts WHERE referral_code = v_code);
    v_attempts := v_attempts + 1;
    EXIT WHEN v_attempts > 10;
  END LOOP;
  RETURN v_code;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.set_affiliate_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_affiliate_code();
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_set_aff_code BEFORE INSERT ON public.affiliate_accounts FOR EACH ROW EXECUTE FUNCTION public.set_affiliate_referral_code();

-- Approve conversion
CREATE OR REPLACE FUNCTION public.approve_affiliate_conversion(p_conversion_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_conv RECORD; v_aff RECORD; v_new_balance numeric; v_wallet numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  SELECT * INTO v_conv FROM public.affiliate_conversions WHERE id = p_conversion_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Not found'); END IF;
  IF v_conv.status != 'pending' THEN RETURN jsonb_build_object('success', false, 'error', 'Already processed'); END IF;
  SELECT * INTO v_aff FROM public.affiliate_accounts WHERE id = v_conv.affiliate_id FOR UPDATE;
  UPDATE public.affiliate_conversions SET status = 'approved' WHERE id = p_conversion_id;
  UPDATE public.affiliate_accounts SET available_balance = available_balance + v_conv.commission_amount, total_earned = total_earned + v_conv.commission_amount, total_conversions = total_conversions + 1 WHERE id = v_conv.affiliate_id RETURNING available_balance INTO v_new_balance;
  UPDATE public.profiles SET wallet_balance = wallet_balance + v_conv.commission_amount WHERE user_id = v_aff.user_id RETURNING wallet_balance INTO v_wallet;
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
  VALUES (v_aff.user_id, 'credit', v_conv.commission_amount, v_wallet, 'Affiliate commission — Order ' || v_conv.order_number, v_conv.order_id::text, 'affiliate');
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (v_aff.user_id, '💰 Affiliate Commission পেয়েছেন!', 'অর্ডার #' || v_conv.order_number || ' থেকে ৳' || v_conv.commission_amount || ' ওয়ালেটে যোগ হয়েছে।', 'promo', false);
  RETURN jsonb_build_object('success', true, 'amount', v_conv.commission_amount, 'new_balance', v_new_balance);
END;
$fn$;

-- Reject conversion
CREATE OR REPLACE FUNCTION public.reject_affiliate_conversion(p_conversion_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
  UPDATE public.affiliate_conversions SET status = 'rejected', rejection_reason = p_reason WHERE id = p_conversion_id AND status = 'pending';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Not found or processed'); END IF;
  RETURN jsonb_build_object('success', true);
END;
$fn$;

-- Process withdrawal
CREATE OR REPLACE FUNCTION public.process_affiliate_withdrawal(p_withdrawal_id uuid, p_action text, p_transaction_id text DEFAULT NULL, p_admin_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_w RECORD; v_aff RECORD;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
  SELECT * INTO v_w FROM public.affiliate_withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Not found'); END IF;
  IF v_w.status NOT IN ('pending','approved') THEN RETURN jsonb_build_object('success', false, 'error', 'Already processed'); END IF;
  IF p_action = 'paid' THEN
    SELECT * INTO v_aff FROM public.affiliate_accounts WHERE id = v_w.affiliate_id FOR UPDATE;
    IF v_aff.available_balance < v_w.amount THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
    UPDATE public.affiliate_accounts SET available_balance = available_balance - v_w.amount, total_paid = total_paid + v_w.amount WHERE id = v_w.affiliate_id;
    UPDATE public.affiliate_withdrawals SET status = 'paid', transaction_id = p_transaction_id, admin_notes = p_admin_notes, processed_at = now(), processed_by = auth.uid() WHERE id = p_withdrawal_id;
    INSERT INTO public.notifications (user_id, title, message, type, is_read) VALUES (v_w.user_id, '✅ Withdrawal Approved', '৳' || v_w.amount || ' আপনার ' || v_w.method || ' অ্যাকাউন্টে পাঠানো হয়েছে।', 'success', false);
  ELSIF p_action = 'rejected' THEN
    UPDATE public.affiliate_withdrawals SET status = 'rejected', admin_notes = p_admin_notes, processed_at = now(), processed_by = auth.uid() WHERE id = p_withdrawal_id;
    INSERT INTO public.notifications (user_id, title, message, type, is_read) VALUES (v_w.user_id, '❌ Withdrawal Rejected', 'আপনার ৳' || v_w.amount || ' উইথড্রয়াল রিকোয়েস্ট বাতিল হয়েছে।', 'warning', false);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$fn$;

-- Record affiliate conversion when order is placed (called from edge function or frontend)
CREATE OR REPLACE FUNCTION public.record_affiliate_conversion(p_order_id uuid, p_referral_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_aff RECORD;
  v_order RECORD;
  v_settings RECORD;
  v_commission_pct numeric;
  v_commission_amt numeric;
  v_discount_amt numeric := 0;
  v_pc RECORD;
  v_total_commission numeric := 0;
  v_item RECORD;
BEGIN
  SELECT * INTO v_settings FROM public.affiliate_settings WHERE id = 1;
  IF NOT v_settings.is_enabled OR NOT v_settings.enable_affiliate_commission THEN
    RETURN jsonb_build_object('success', false, 'error', 'Affiliate disabled');
  END IF;
  SELECT * INTO v_aff FROM public.affiliate_accounts WHERE referral_code = upper(p_referral_code) AND status = 'approved';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid affiliate'); END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  -- Prevent self-referral
  IF v_order.user_id = v_aff.user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;
  -- Prevent duplicate
  IF EXISTS (SELECT 1 FROM public.affiliate_conversions WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already recorded');
  END IF;
  -- Calculate per-item commission (use product override if exists, else affiliate custom %, else default)
  FOR v_item IN SELECT oi.product_id, oi.total FROM public.order_items oi WHERE oi.order_id = p_order_id LOOP
    SELECT * INTO v_pc FROM public.affiliate_product_commissions WHERE product_id = v_item.product_id AND is_active = true;
    IF FOUND THEN
      v_commission_pct := v_pc.commission_percent;
    ELSE
      v_commission_pct := COALESCE(v_aff.custom_commission_percent, v_settings.default_commission_percent);
    END IF;
    v_total_commission := v_total_commission + (v_item.total * v_commission_pct / 100);
  END LOOP;
  v_commission_pct := CASE WHEN v_order.subtotal > 0 THEN (v_total_commission / v_order.subtotal * 100) ELSE 0 END;
  INSERT INTO public.affiliate_conversions (affiliate_id, order_id, order_number, order_total, commission_percent, commission_amount, customer_discount_amount, status)
  VALUES (v_aff.id, p_order_id, v_order.order_number, v_order.total, v_commission_pct, v_total_commission, v_discount_amt, 'pending');
  UPDATE public.affiliate_clicks SET converted = true WHERE affiliate_id = v_aff.id AND visitor_id IS NOT NULL AND created_at > now() - (v_settings.cookie_duration_days || ' days')::interval AND converted = false;
  RETURN jsonb_build_object('success', true, 'commission', v_total_commission);
END;
$fn$;

-- Auto-approve conversion when order completes
CREATE OR REPLACE FUNCTION public.auto_approve_conversion_on_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_conv RECORD; v_aff RECORD; v_wallet numeric;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT * INTO v_conv FROM public.affiliate_conversions WHERE order_id = NEW.id AND status = 'pending';
    IF FOUND THEN
      SELECT * INTO v_aff FROM public.affiliate_accounts WHERE id = v_conv.affiliate_id FOR UPDATE;
      UPDATE public.affiliate_conversions SET status = 'approved' WHERE id = v_conv.id;
      UPDATE public.affiliate_accounts SET available_balance = available_balance + v_conv.commission_amount, total_earned = total_earned + v_conv.commission_amount, total_conversions = total_conversions + 1 WHERE id = v_conv.affiliate_id;
      UPDATE public.profiles SET wallet_balance = wallet_balance + v_conv.commission_amount WHERE user_id = v_aff.user_id RETURNING wallet_balance INTO v_wallet;
      INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
      VALUES (v_aff.user_id, 'credit', v_conv.commission_amount, v_wallet, 'Affiliate commission — Order ' || v_conv.order_number, v_conv.order_id::text, 'affiliate');
      INSERT INTO public.notifications (user_id, title, message, type, is_read)
      VALUES (v_aff.user_id, '💰 Affiliate Commission!', 'অর্ডার #' || v_conv.order_number || ' থেকে ৳' || v_conv.commission_amount || ' ওয়ালেটে জমা হয়েছে।', 'promo', false);
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_auto_approve_conversion AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.auto_approve_conversion_on_complete();

-- Add affiliate_referral_code column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_referral_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_discount_amount numeric DEFAULT 0;