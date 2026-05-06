
-- Update handle_new_user to pull Google OAuth metadata (name + avatar)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_code text;
  v_attempts int := 0;
  v_display_name text;
  v_avatar_url text;
BEGIN
  LOOP
    v_referral_code := upper(substring(md5(random()::text || NEW.id::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_referral_code);
    v_attempts := v_attempts + 1;
    EXIT WHEN v_attempts > 10;
  END LOOP;

  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );

  INSERT INTO public.profiles (user_id, display_name, email, avatar_url, referral_code)
  VALUES (NEW.id, v_display_name, NEW.email, v_avatar_url, v_referral_code)
  ON CONFLICT (user_id) DO UPDATE
    SET referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
        email = COALESCE(profiles.email, EXCLUDED.email),
        display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Sync trigger: backfill name/avatar from OAuth metadata on every auth.users update
CREATE OR REPLACE FUNCTION public.sync_oauth_profile_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_avatar text;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'display_name'
  );
  v_avatar := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );

  IF v_name IS NOT NULL OR v_avatar IS NOT NULL THEN
    UPDATE public.profiles
    SET display_name = COALESCE(display_name, v_name),
        avatar_url   = COALESCE(avatar_url, v_avatar),
        email        = COALESCE(email, NEW.email)
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_oauth_profile_data_trg ON auth.users;
CREATE TRIGGER sync_oauth_profile_data_trg
AFTER UPDATE OF raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_oauth_profile_data();

-- Backfill existing Google users
UPDATE public.profiles p
SET display_name = COALESCE(p.display_name,
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name'),
    avatar_url = COALESCE(p.avatar_url,
      u.raw_user_meta_data ->> 'avatar_url',
      u.raw_user_meta_data ->> 'picture')
FROM auth.users u
WHERE u.id = p.user_id
  AND (p.display_name IS NULL OR p.avatar_url IS NULL);
