
-- 1. Add columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_ip text,
  ADD COLUMN IF NOT EXISTS referral_credit_balance numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_signup_ip ON public.profiles(signup_ip);

-- 2. Update process_referral (email signup) — accept IP, reject same-IP
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referral_code text,
  p_referred_user_id uuid,
  p_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id uuid;
  v_referrer_ip text;
BEGIN
  SELECT user_id, signup_ip INTO v_referrer_id, v_referrer_ip
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;

  -- Save IP on referred user's profile
  IF p_ip IS NOT NULL AND p_ip <> '' THEN
    UPDATE public.profiles SET signup_ip = COALESCE(signup_ip, p_ip)
    WHERE user_id = p_referred_user_id;
  END IF;

  -- Same-IP abuse check
  IF p_ip IS NOT NULL AND v_referrer_ip IS NOT NULL AND p_ip = v_referrer_ip THEN
    RETURN jsonb_build_object('success', false, 'error', 'Same IP detected, referral blocked');
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already referred');
  END IF;

  UPDATE public.profiles
  SET referral_discount = 5,
      referred_by = p_referral_code
  WHERE user_id = p_referred_user_id;

  INSERT INTO public.referrals (referral_code, referrer_id, referred_id, reward_amount, status, reward_paid)
  VALUES (p_referral_code, v_referrer_id, p_referred_user_id, 0, 'pending', false);

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    p_referred_user_id,
    '🎁 রেফারেল ডিসকাউন্ট সক্রিয়!',
    'রেফারেল কোড ব্যবহারের জন্য আপনার অ্যাকাউন্টে ৫% স্থায়ী ছাড় সক্রিয় হয়েছে।',
    'promo', false
  );

  RETURN jsonb_build_object('success', true, 'referred_reward', 0, 'discount', 5, 'type', 'email_signup');
END;
$function$;

-- 3. Update process_google_referral — accept IP, reject same-IP, credit to referral_credit_balance (not wallet)
CREATE OR REPLACE FUNCTION public.process_google_referral(
  p_referral_code text,
  p_referred_user_id uuid,
  p_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id uuid;
  v_referrer_ip text;
  v_referrer_reward numeric := 20;
  v_new_credit_balance numeric;
BEGIN
  SELECT user_id, signup_ip INTO v_referrer_id, v_referrer_ip
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;

  -- Save IP for referred
  IF p_ip IS NOT NULL AND p_ip <> '' THEN
    UPDATE public.profiles SET signup_ip = COALESCE(signup_ip, p_ip)
    WHERE user_id = p_referred_user_id;
  END IF;

  -- Same-IP abuse check
  IF p_ip IS NOT NULL AND v_referrer_ip IS NOT NULL AND p_ip = v_referrer_ip THEN
    -- Still apply 5% discount to referred but no money to referrer
    UPDATE public.profiles
    SET referral_discount = 5,
        referred_by = COALESCE(referred_by, p_referral_code)
    WHERE user_id = p_referred_user_id;
    RETURN jsonb_build_object('success', false, 'error', 'Same IP detected, referrer reward blocked');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already referred');
  END IF;

  INSERT INTO public.referrals (referral_code, referrer_id, referred_id, reward_amount, status, reward_paid)
  VALUES (p_referral_code, v_referrer_id, p_referred_user_id, v_referrer_reward, 'completed', true)
  ON CONFLICT DO NOTHING;

  UPDATE public.referrals
  SET status = 'completed', reward_amount = v_referrer_reward, reward_paid = true
  WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id AND status = 'pending';

  -- Referred user 5% discount
  UPDATE public.profiles
  SET referral_discount = 5,
      referred_by = COALESCE(referred_by, p_referral_code)
  WHERE user_id = p_referred_user_id;

  -- Referrer reward goes to referral_credit_balance (NOT general wallet) — must be redeemed against equal purchase
  UPDATE public.profiles
  SET referral_credit_balance = referral_credit_balance + v_referrer_reward,
      referral_credit = referral_credit + v_referrer_reward,
      referral_earnings = referral_earnings + v_referrer_reward
  WHERE user_id = v_referrer_id
  RETURNING referral_credit_balance INTO v_new_credit_balance;

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    v_referrer_id,
    '🎉 রেফারেল বোনাস পেয়েছেন!',
    'আপনার রেফারেল ক্রেডিটে ৳' || v_referrer_reward || ' যোগ হয়েছে। সমপরিমাণ বা তার বেশি টাকার প্রোডাক্ট কিনে এটি ব্যবহার করতে পারবেন।',
    'promo', false
  );

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    p_referred_user_id,
    '🎁 রেফারেল ডিসকাউন্ট সক্রিয়!',
    'Google দিয়ে রেফারেল কোড ব্যবহার করে যোগ দেওয়ায় আপনার অ্যাকাউন্টে ৫% স্থায়ী ছাড় সক্রিয় হয়েছে।',
    'promo', false
  );

  RETURN jsonb_build_object(
    'success', true,
    'referrer_reward', v_referrer_reward,
    'discount', 5,
    'type', 'google_signup'
  );
END;
$function$;

-- 4. New: redeem_referral_credit — applies referral credit to an order
-- Rule: apply_amount must be ≤ subtotal / 2 (i.e., product purchase ≥ apply_amount)
CREATE OR REPLACE FUNCTION public.redeem_referral_credit(
  p_user_id uuid,
  p_amount numeric,
  p_order_subtotal numeric,
  p_order_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_max_allowed numeric;
  v_new_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT referral_credit_balance INTO v_balance
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient referral credit', 'balance', v_balance);
  END IF;

  -- Matching-purchase rule: product subtotal must be ≥ 2 × apply amount
  v_max_allowed := FLOOR(p_order_subtotal / 2);
  IF p_amount > v_max_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order subtotal must be at least 2× the redeem amount',
      'max_allowed', v_max_allowed,
      'required_subtotal', p_amount * 2
    );
  END IF;

  v_new_balance := v_balance - p_amount;

  UPDATE public.profiles
  SET referral_credit_balance = v_new_balance
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
  VALUES (
    p_user_id, 'debit', p_amount, v_new_balance,
    'Referral credit redeemed on order',
    COALESCE(p_order_id, 'manual'), 'referral_redeem'
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'applied', p_amount);
END;
$function$;
