-- 1. Fix handle_new_user to generate unique referral code on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code text;
  v_attempts int := 0;
BEGIN
  LOOP
    v_referral_code := upper(substring(md5(random()::text || NEW.id::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_referral_code);
    v_attempts := v_attempts + 1;
    EXIT WHEN v_attempts > 10;
  END LOOP;

  INSERT INTO public.profiles (user_id, display_name, email, referral_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.email,
    v_referral_code
  )
  ON CONFLICT (user_id) DO UPDATE
    SET referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
        email = COALESCE(profiles.email, EXCLUDED.email),
        display_name = COALESCE(profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Re-create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Generate referral codes for existing profiles that don't have one
UPDATE public.profiles
SET referral_code = upper(substring(md5(random()::text || user_id::text || now()::text), 1, 8))
WHERE referral_code IS NULL;

-- 4. Backfill user_roles for existing users missing a role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'user'
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;