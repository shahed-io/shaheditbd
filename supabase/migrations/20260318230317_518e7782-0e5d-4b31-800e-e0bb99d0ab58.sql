-- Fix process_referral: automatically credit wallet for both referrer and referred user
-- reward_paid = true immediately after crediting wallet
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code text, p_referred_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_count integer;
  v_tier_info jsonb;
  v_referrer_reward numeric;
  v_referred_reward numeric := 10;
  v_new_balance_referrer numeric;
  v_new_balance_referred numeric;
BEGIN
  -- Find referrer by code
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;

  -- Prevent duplicate referral
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already referred');
  END IF;

  -- Get completed referral count for tier calculation
  SELECT COUNT(*) INTO v_referral_count
  FROM public.referrals
  WHERE referrer_id = v_referrer_id AND status = 'completed';

  v_tier_info := public.get_referral_tier(v_referral_count + 1);
  v_referrer_reward := (v_tier_info->>'reward_per_referral')::numeric;

  -- 1. Insert referral record with reward_paid = true (wallet credited immediately)
  INSERT INTO public.referrals (referral_code, referrer_id, referred_id, reward_amount, status, reward_paid)
  VALUES (p_referral_code, v_referrer_id, p_referred_user_id, v_referrer_reward, 'completed', true);

  -- 2. Credit REFERRER wallet balance directly
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + v_referrer_reward,
      referral_credit = referral_credit + v_referrer_reward,
      referral_earnings = referral_earnings + v_referrer_reward
  WHERE user_id = v_referrer_id
  RETURNING wallet_balance INTO v_new_balance_referrer;

  -- Log wallet transaction for referrer
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
  VALUES (
    v_referrer_id,
    'credit',
    v_referrer_reward,
    v_new_balance_referrer,
    'রেফারেল বোনাস — ' || p_referral_code,
    p_referred_user_id::text,
    'referral'
  );

  -- 3. Credit REFERRED USER wallet balance + discount
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + v_referred_reward,
      referral_credit = referral_credit + v_referred_reward,
      referral_discount = 10,
      referred_by = p_referral_code
  WHERE user_id = p_referred_user_id
  RETURNING wallet_balance INTO v_new_balance_referred;

  -- Log wallet transaction for referred user
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
  VALUES (
    p_referred_user_id,
    'credit',
    v_referred_reward,
    v_new_balance_referred,
    'রেফারেল স্বাগত বোনাস — কোড: ' || p_referral_code,
    v_referrer_id::text,
    'referral'
  );

  -- 4. Send notification to referrer
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    v_referrer_id,
    '🎉 রেফারেল বোনাস পেয়েছেন!',
    'আপনার রেফারেল কোড ব্যবহার করে কেউ যোগ দিয়েছে। ৳' || v_referrer_reward || ' আপনার ওয়ালেটে যোগ হয়েছে।',
    'promo',
    false
  );

  -- 5. Send notification to referred user
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    p_referred_user_id,
    '🎁 স্বাগত বোনাস!',
    'রেফারেল কোড ব্যবহারের জন্য আপনার ওয়ালেটে ৳' || v_referred_reward || ' যোগ হয়েছে এবং ১০% স্থায়ী ছাড় সক্রিয় হয়েছে।',
    'promo',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'referrer_reward', v_referrer_reward,
    'referred_reward', v_referred_reward,
    'tier', v_tier_info->>'tier'
  );
END;
$$;

-- Backfill: credit existing completed referrals that have reward_paid = false
DO $$
DECLARE
  r RECORD;
  v_new_balance numeric;
  v_already_has_balance numeric;
BEGIN
  FOR r IN 
    SELECT * FROM public.referrals 
    WHERE status = 'completed' AND reward_paid = false
  LOOP
    -- Credit referrer wallet
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + r.reward_amount,
        referral_credit = referral_credit + r.reward_amount,
        referral_earnings = referral_earnings + r.reward_amount
    WHERE user_id = r.referrer_id
    RETURNING wallet_balance INTO v_new_balance;

    IF FOUND THEN
      INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
      VALUES (r.referrer_id, 'credit', r.reward_amount, v_new_balance, 'রেফারেল বোনাস (পূর্ববর্তী) — ' || r.referral_code, r.referred_id::text, 'referral');
    END IF;

    -- Credit referred user wallet (10 taka bonus) only if they don't have it yet
    SELECT wallet_balance INTO v_already_has_balance FROM public.profiles WHERE user_id = r.referred_id;
    IF v_already_has_balance = 0 THEN
      UPDATE public.profiles
      SET wallet_balance = wallet_balance + 10,
          referral_credit = referral_credit + 10
      WHERE user_id = r.referred_id
      RETURNING wallet_balance INTO v_new_balance;

      IF FOUND THEN
        INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
        VALUES (r.referred_id, 'credit', 10, v_new_balance, 'রেফারেল স্বাগত বোনাস (পূর্ববর্তী) — কোড: ' || r.referral_code, r.referrer_id::text, 'referral');
      END IF;
    END IF;

    -- Mark as paid
    UPDATE public.referrals SET reward_paid = true WHERE id = r.id;
  END LOOP;
END;
$$;