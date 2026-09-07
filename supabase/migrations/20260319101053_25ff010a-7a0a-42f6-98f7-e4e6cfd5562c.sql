
-- Update process_referral: email signup only gives referred user 5% discount, referrer gets nothing
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code text, p_referred_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id uuid;
BEGIN
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already referred');
  END IF;

  -- Email signup: referred gets 5% discount ONLY, referrer gets nothing yet
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
    'promo',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'referred_reward', 0,
    'discount', 5,
    'type', 'email_signup'
  );
END;
$function$;

-- New function: process_google_referral — Google OAuth signup gives referrer ৳20 + referred 5% discount
CREATE OR REPLACE FUNCTION public.process_google_referral(p_referral_code text, p_referred_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id uuid;
  v_referrer_reward numeric := 20;
  v_new_balance_referrer numeric;
BEGIN
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id AND status = 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already referred');
  END IF;

  -- Upsert referral as completed with ৳20 reward
  INSERT INTO public.referrals (referral_code, referrer_id, referred_id, reward_amount, status, reward_paid)
  VALUES (p_referral_code, v_referrer_id, p_referred_user_id, v_referrer_reward, 'completed', true)
  ON CONFLICT DO NOTHING;

  UPDATE public.referrals
  SET status = 'completed', reward_amount = v_referrer_reward, reward_paid = true
  WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id AND status = 'pending';

  -- Referred user gets 5% discount
  UPDATE public.profiles
  SET referral_discount = 5,
      referred_by = COALESCE(referred_by, p_referral_code)
  WHERE user_id = p_referred_user_id;

  -- Referrer gets ৳20
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + v_referrer_reward,
      referral_credit = referral_credit + v_referrer_reward,
      referral_earnings = referral_earnings + v_referrer_reward
  WHERE user_id = v_referrer_id
  RETURNING wallet_balance INTO v_new_balance_referrer;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
  VALUES (
    v_referrer_id, 'credit', v_referrer_reward, v_new_balance_referrer,
    'রেফারেল বোনাস (Google সাইনআপ) — ' || p_referral_code,
    p_referred_user_id::text, 'referral'
  );

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    v_referrer_id,
    '🎉 রেফারেল বোনাস পেয়েছেন!',
    'আপনার রেফারেল কোড ব্যবহার করে Google দিয়ে কেউ যোগ দিয়েছে। ৳' || v_referrer_reward || ' আপনার ওয়ালেটে যোগ হয়েছে।',
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
