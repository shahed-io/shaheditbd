-- Add username column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Case-insensitive unique constraint on username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_lower
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Validation trigger: format + reserved names
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reserved_names text[] := ARRAY[
    'admin','administrator','root','support','help','api','www',
    'mail','email','ceo','staff','moderator','mod','official',
    'shahed','shahedstore','system','null','undefined','user',
    'users','profile','profiles','login','signup','register',
    'logout','dashboard','settings','account','test','demo'
  ];
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := NULL;
    RETURN NEW;
  END IF;

  -- Trim and lowercase normalization is left to client; we validate raw value
  IF length(NEW.username) < 3 OR length(NEW.username) > 20 THEN
    RAISE EXCEPTION 'Username must be between 3 and 20 characters';
  END IF;

  IF NEW.username !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Username can only contain letters, numbers, and underscores';
  END IF;

  IF lower(NEW.username) = ANY(reserved_names) THEN
    RAISE EXCEPTION 'This username is reserved and cannot be used';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_username_trigger ON public.profiles;
CREATE TRIGGER validate_username_trigger
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_username();

-- Helper RPC: check username availability (callable by anon/authenticated)
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(p_username)
      AND (p_user_id IS NULL OR user_id <> p_user_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text, uuid) TO anon, authenticated;