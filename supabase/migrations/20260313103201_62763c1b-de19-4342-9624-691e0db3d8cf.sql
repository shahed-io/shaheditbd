
-- Add referral_credit and referral_discount columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_credit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_discount numeric NOT NULL DEFAULT 0;

-- Function to get referral tier based on count
CREATE OR REPLACE FUNCTION public.get_referral_tier(referral_count integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tier_name text;
  reward_per_referral numeric;
  next_tier_at integer;
BEGIN
  IF referral_count >= 50 THEN
    tier_name := 'diamond';
    reward_per_referral := 200;
    next_tier_at := NULL;
  ELSIF referral_count >= 30 THEN
    tier_name := 'platinum';
    reward_per_referral := 150;
    next_tier_at := 50;
  ELSIF referral_count >= 15 THEN
    tier_name := 'gold';
    reward_per_referral := 100;
    next_tier_at := 30;
  ELSIF referral_count >= 5 THEN
    tier_name := 'silver';
    reward_per_referral := 75;
    next_tier_at := 15;
  ELSE
    tier_name := 'bronze';
    reward_per_referral := 50;
    next_tier_at := 5;
  END IF;

  RETURN jsonb_build_object(
    'tier', tier_name,
    'reward_per_referral', reward_per_referral,
    'next_tier_at', next_tier_at
  );
END;
$$;

-- Function to process a referral when a new user signs up with a referral code
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
  v_reward numeric;
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

  SELECT COUNT(*) INTO v_referral_count
  FROM public.referrals
  WHERE referrer_id = v_referrer_id AND status = 'completed';

  v_tier_info := public.get_referral_tier(v_referral_count + 1);
  v_reward := (v_tier_info->>'reward_per_referral')::numeric;

  INSERT INTO public.referrals (referral_code, referrer_id, referred_id, reward_amount, status, reward_paid)
  VALUES (p_referral_code, v_referrer_id, p_referred_user_id, v_reward, 'completed', false);

  UPDATE public.profiles
  SET referral_credit = referral_credit + v_reward,
      referral_earnings = referral_earnings + v_reward
  WHERE user_id = v_referrer_id;

  UPDATE public.profiles
  SET referral_credit = referral_credit + 10,
      referral_discount = 10,
      referred_by = p_referral_code
  WHERE user_id = p_referred_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_reward', v_reward,
    'tier', v_tier_info->>'tier'
  );
END;
$$;
