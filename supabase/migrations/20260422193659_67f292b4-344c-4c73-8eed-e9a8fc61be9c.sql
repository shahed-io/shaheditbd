-- 1) Add 'reseller' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reseller';

-- 2) Drop legacy reseller tables (clean slate)
DROP TABLE IF EXISTS public.reseller_sessions CASCADE;
DROP TABLE IF EXISTS public.reseller_generations CASCADE;
DROP TABLE IF EXISTS public.reseller_users CASCADE;

-- 3) New reseller_profiles table — links to auth.users via user_id
CREATE TABLE public.reseller_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers view own profile"
  ON public.reseller_profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage reseller profiles"
  ON public.reseller_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reseller_profiles_updated
  BEFORE UPDATE ON public.reseller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) New reseller_generations table — links to auth.users
CREATE TABLE public.reseller_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cid TEXT NOT NULL,
  installation_id TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reseller_gen_user ON public.reseller_generations(user_id, created_at DESC);

ALTER TABLE public.reseller_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers view own generations"
  ON public.reseller_generations FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage generations"
  ON public.reseller_generations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Auto-create reseller_profile when 'reseller' role is granted
CREATE OR REPLACE FUNCTION public.handle_reseller_role_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'reseller' THEN
    INSERT INTO public.reseller_profiles (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO UPDATE SET is_active = true, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reseller_role_grant ON public.user_roles;
CREATE TRIGGER trg_reseller_role_grant
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_reseller_role_grant();

-- 6) On role removal, deactivate (don't delete — preserves history)
CREATE OR REPLACE FUNCTION public.handle_reseller_role_revoke()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'reseller' THEN
    UPDATE public.reseller_profiles
      SET is_active = false, updated_at = now()
      WHERE user_id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_reseller_role_revoke ON public.user_roles;
CREATE TRIGGER trg_reseller_role_revoke
  AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_reseller_role_revoke();