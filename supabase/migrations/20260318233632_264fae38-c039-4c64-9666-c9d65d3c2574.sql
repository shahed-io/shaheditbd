
-- 1. Add total_points_redeemed column to profiles (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_points_redeemed integer NOT NULL DEFAULT 0;

-- 2. Update redeem_points function to track total_points_redeemed + enforce minimum 20 pts
CREATE OR REPLACE FUNCTION public.redeem_points(p_user_id uuid, p_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_points integer;
  v_new_points integer;
  v_taka_amount numeric;
  v_new_wallet numeric;
BEGIN
  -- Minimum 20 points to redeem
  IF p_points < 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'ন্যূনতম ২০ পয়েন্ট রিডিম করতে হবে');
  END IF;

  IF p_points % 2 != 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'পয়েন্ট অবশ্যই ২ এর গুণিতক হতে হবে');
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

  -- Deduct points and update total_points_redeemed
  UPDATE public.profiles
  SET points_balance = v_new_points,
      wallet_balance = wallet_balance + v_taka_amount,
      total_points_redeemed = total_points_redeemed + p_points
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
    p_points || ' পয়েন্ট রিডিম — ' || p_points || ' পয়েন্ট = ৳' || v_taka_amount,
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
$function$;

-- 3. Function to DEDUCT points when order is cancelled/refunded
CREATE OR REPLACE FUNCTION public.deduct_order_points(p_user_id uuid, p_order_id text, p_order_total numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_points_to_deduct integer;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Check if points were awarded for this order
  IF NOT EXISTS (
    SELECT 1 FROM public.point_transactions
    WHERE reference_id = p_order_id AND type = 'earn' AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'No points found for this order');
  END IF;

  -- Prevent double deduction
  IF EXISTS (
    SELECT 1 FROM public.point_transactions
    WHERE reference_id = p_order_id || '_cancel' AND type = 'deduct' AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points already deducted for this order');
  END IF;

  -- Calculate original points earned
  v_points_to_deduct := FLOOR(p_order_total / 100) * 10;

  SELECT points_balance INTO v_current_balance
  FROM public.profiles WHERE user_id = p_user_id;

  -- Deduct only what is available (can't go negative)
  v_points_to_deduct := LEAST(v_points_to_deduct, v_current_balance);
  
  IF v_points_to_deduct <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No points to deduct');
  END IF;

  v_new_balance := v_current_balance - v_points_to_deduct;

  UPDATE public.profiles
  SET points_balance = v_new_balance,
      total_points_earned = GREATEST(0, total_points_earned - v_points_to_deduct)
  WHERE user_id = p_user_id;

  -- Log deduction transaction
  INSERT INTO public.point_transactions (user_id, type, points, balance_after, note, reference_id)
  VALUES (
    p_user_id,
    'deduct',
    v_points_to_deduct,
    v_new_balance,
    'অর্ডার বাতিল/রিফান্ডের কারণে পয়েন্ট কাটা হয়েছে',
    p_order_id || '_cancel'
  );

  RETURN jsonb_build_object(
    'success', true,
    'points_deducted', v_points_to_deduct,
    'new_balance', v_new_balance
  );
END;
$function$;

-- 4. Trigger function: award on completion, deduct on cancel/refund
CREATE OR REPLACE FUNCTION public.auto_award_points_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Award points when status changes TO completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.user_id IS NOT NULL THEN
    PERFORM public.earn_order_points(NEW.user_id, NEW.id::text, NEW.total);
  END IF;
  
  -- Deduct points when status changes TO cancelled OR refunded FROM completed
  IF (NEW.status IN ('cancelled', 'refunded'))
     AND OLD.status = 'completed'
     AND NEW.user_id IS NOT NULL THEN
    PERFORM public.deduct_order_points(NEW.user_id, NEW.id::text, NEW.total);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 5. Recreate the trigger on orders table
DROP TRIGGER IF EXISTS trigger_award_points_on_order_complete ON public.orders;
CREATE TRIGGER trigger_award_points_on_order_complete
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_points_on_completion();

-- 6. Trigger for INSERT (manual admin orders already set to completed)
DROP TRIGGER IF EXISTS trigger_award_points_on_order_insert ON public.orders;
CREATE TRIGGER trigger_award_points_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_points_on_completion();
