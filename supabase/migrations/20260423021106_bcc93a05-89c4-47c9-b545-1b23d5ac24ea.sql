
-- Drop old reseller stuff
DROP FUNCTION IF EXISTS public.handle_reseller_role_grant() CASCADE;
DROP FUNCTION IF EXISTS public.handle_reseller_role_revoke() CASCADE;
DELETE FROM public.user_roles WHERE role = 'reseller';
DROP TABLE IF EXISTS public.reseller_generations CASCADE;
DROP TABLE IF EXISTS public.reseller_profiles CASCADE;

-- cid_balances
CREATE TABLE public.cid_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  total_added integer NOT NULL DEFAULT 0,
  total_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cid_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own CID balance" ON public.cid_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage CID balances" ON public.cid_balances FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- cid_generations
CREATE TABLE public.cid_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operator text NOT NULL,
  operator_name text,
  number text,
  result jsonb,
  status text NOT NULL DEFAULT 'success',
  cost integer NOT NULL DEFAULT 1,
  provider text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cid_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own CID gens" ON public.cid_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage CID gens" ON public.cid_generations FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users insert own gens" ON public.cid_generations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- cid_product_credits
CREATE TABLE public.cid_product_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cid_credits integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);
ALTER TABLE public.cid_product_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage CID product credits" ON public.cid_product_credits FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view active CID product credits" ON public.cid_product_credits FOR SELECT USING (is_active = true);

-- Auto-credit trigger
CREATE OR REPLACE FUNCTION public.auto_credit_cid_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item RECORD; v_credits integer; v_total_credits integer := 0;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.user_id IS NOT NULL THEN
    FOR v_item IN SELECT oi.product_id, oi.quantity FROM public.order_items oi WHERE oi.order_id = NEW.id AND oi.product_id IS NOT NULL LOOP
      SELECT cpc.cid_credits INTO v_credits FROM public.cid_product_credits cpc WHERE cpc.product_id = v_item.product_id AND cpc.is_active = true;
      IF FOUND AND v_credits > 0 THEN
        v_total_credits := v_total_credits + (v_credits * v_item.quantity);
      END IF;
    END LOOP;
    IF v_total_credits > 0 THEN
      INSERT INTO public.cid_balances (user_id, balance, total_added)
      VALUES (NEW.user_id, v_total_credits, v_total_credits)
      ON CONFLICT (user_id) DO UPDATE
        SET balance = cid_balances.balance + v_total_credits,
            total_added = cid_balances.total_added + v_total_credits,
            updated_at = now();
      INSERT INTO public.notifications (user_id, title, message, type, is_read)
      VALUES (NEW.user_id, '🎁 CID Credit পেয়েছেন!', 'অর্ডার #' || NEW.order_number || ' সম্পন্ন হওয়ায় ' || v_total_credits || ' টি CID credit আপনার অ্যাকাউন্টে যোগ হয়েছে।', 'promo', false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_credit_cid AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.auto_credit_cid_on_completion();

CREATE TRIGGER update_cid_balances_updated_at BEFORE UPDATE ON public.cid_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cid_product_credits_updated_at BEFORE UPDATE ON public.cid_product_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin RPC: adjust balance
CREATE OR REPLACE FUNCTION public.admin_adjust_cid_balance(p_user_id uuid, p_delta integer, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new integer;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
  IF p_delta = 0 THEN RETURN jsonb_build_object('success', false, 'error', 'Delta cannot be zero'); END IF;
  INSERT INTO public.cid_balances (user_id, balance, total_added, total_used)
  VALUES (p_user_id, GREATEST(p_delta, 0), GREATEST(p_delta, 0), 0)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = GREATEST(0, cid_balances.balance + p_delta),
        total_added = cid_balances.total_added + GREATEST(p_delta, 0),
        total_used = cid_balances.total_used + GREATEST(-p_delta, 0),
        updated_at = now()
  RETURNING balance INTO v_new;
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (p_user_id,
    CASE WHEN p_delta > 0 THEN '✅ CID Credit যোগ হয়েছে' ELSE '⚠️ CID Credit কাটা হয়েছে' END,
    CASE WHEN p_delta > 0 THEN 'অ্যাডমিন আপনার অ্যাকাউন্টে ' || p_delta || ' টি CID যোগ করেছেন।' ELSE 'অ্যাডমিন আপনার অ্যাকাউন্ট থেকে ' || ABS(p_delta) || ' টি CID কেটেছেন।' END,
    'info', false);
  RETURN jsonb_build_object('success', true, 'new_balance', v_new);
END;
$$;

-- Debit RPC for edge function
CREATE OR REPLACE FUNCTION public.debit_cid_balance(p_user_id uuid, p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current integer; v_new integer;
BEGIN
  IF p_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive'); END IF;
  SELECT balance INTO v_current FROM public.cid_balances WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_current < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'balance', COALESCE(v_current, 0));
  END IF;
  v_new := v_current - p_amount;
  UPDATE public.cid_balances SET balance = v_new, total_used = total_used + p_amount, updated_at = now() WHERE user_id = p_user_id;
  RETURN jsonb_build_object('success', true, 'balance', v_new);
END;
$$;
