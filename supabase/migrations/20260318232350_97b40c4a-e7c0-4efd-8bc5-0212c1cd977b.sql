
-- 1. Add points_balance and total_points_earned to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_earned integer NOT NULL DEFAULT 0;

-- 2. Create point_transactions table
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'earn', -- 'earn' | 'redeem'
  points integer NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  note text,
  reference_id text, -- order id or wallet tx id
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Enable RLS on point_transactions
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own point transactions"
  ON public.point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage point transactions"
  ON public.point_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create earn_points function: called after order completed
CREATE OR REPLACE FUNCTION public.earn_order_points(
  p_user_id uuid,
  p_order_id text,
  p_order_total numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points_earned integer;
  v_new_balance integer;
BEGIN
  -- 10 points per 100 BDT (= 0.1 points per BDT)
  v_points_earned := FLOOR(p_order_total / 100) * 10;
  IF v_points_earned <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No points earned');
  END IF;

  -- Prevent duplicate earn for same order
  IF EXISTS (
    SELECT 1 FROM public.point_transactions
    WHERE reference_id = p_order_id AND type = 'earn' AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points already awarded for this order');
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET points_balance = points_balance + v_points_earned,
      total_points_earned = total_points_earned + v_points_earned
  WHERE user_id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Log transaction
  INSERT INTO public.point_transactions (user_id, type, points, balance_after, note, reference_id)
  VALUES (
    p_user_id,
    'earn',
    v_points_earned,
    v_new_balance,
    'অর্ডার সম্পন্ন হওয়ায় পয়েন্ট অর্জিত',
    p_order_id
  );

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    p_user_id,
    '⭐ পয়েন্ট অর্জিত হয়েছে!',
    'আপনার অর্ডার সম্পন্ন হওয়ায় ' || v_points_earned || ' পয়েন্ট আপনার অ্যাকাউন্টে যোগ হয়েছে।',
    'promo',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'points_earned', v_points_earned,
    'balance', v_new_balance
  );
END;
$$;

-- 5. Create redeem_points function: converts points → wallet BDT (2 points = 1 BDT)
CREATE OR REPLACE FUNCTION public.redeem_points(
  p_user_id uuid,
  p_points integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points integer;
  v_new_points integer;
  v_taka_amount numeric;
  v_new_wallet numeric;
BEGIN
  IF p_points <= 0 OR p_points % 2 != 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'পয়েন্ট অবশ্যই সংখ্যা এবং ২ এর গুণিতক হতে হবে');
  END IF;

  SELECT points_balance INTO v_current_points
  FROM public.profiles WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_points < p_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'পর্যাপ্ত পয়েন্ট নেই');
  END IF;

  -- 2 points = 1 BDT
  v_taka_amount := p_points / 2;
  v_new_points := v_current_points - p_points;

  -- Deduct points
  UPDATE public.profiles
  SET points_balance = v_new_points,
      wallet_balance = wallet_balance + v_taka_amount
  WHERE user_id = p_user_id
  RETURNING wallet_balance INTO v_new_wallet;

  -- Log point transaction
  INSERT INTO public.point_transactions (user_id, type, points, balance_after, note, reference_id)
  VALUES (
    p_user_id,
    'redeem',
    p_points,
    v_new_points,
    '৳' || v_taka_amount || ' ওয়ালেটে রিডিম করা হয়েছে',
    'wallet'
  );

  -- Log wallet credit transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
  VALUES (
    p_user_id,
    'credit',
    v_taka_amount,
    v_new_wallet,
    v_current_points || ' পয়েন্ট রিডিম — ' || p_points || ' পয়েন্ট = ৳' || v_taka_amount,
    'points_redeem',
    'points'
  );

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    p_user_id,
    '💰 পয়েন্ট রিডিম সফল!',
    p_points || ' পয়েন্ট রিডিম করে ৳' || v_taka_amount || ' আপনার ওয়ালেটে যোগ হয়েছে।',
    'promo',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'points_redeemed', p_points,
    'taka_credited', v_taka_amount,
    'new_points_balance', v_new_points,
    'new_wallet_balance', v_new_wallet
  );
END;
$$;

-- 6. Trigger to auto-award points when order status changes to 'completed'
CREATE OR REPLACE FUNCTION public.auto_award_points_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes TO completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.user_id IS NOT NULL THEN
    PERFORM public.earn_order_points(NEW.user_id, NEW.id::text, NEW.total);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_award_points_on_order_complete
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_points_on_completion();
