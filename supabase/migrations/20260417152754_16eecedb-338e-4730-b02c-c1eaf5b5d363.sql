CREATE OR REPLACE FUNCTION public.validate_username()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reserved_names text[] := ARRAY[
    'admin','administrator','root','support','help','api','www',
    'mail','email','ceo','staff','moderator','mod','official',
    'shahedstore','system','null','undefined','user',
    'users','profile','profiles','login','signup','register',
    'logout','dashboard','settings','account','test','demo'
  ];
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := NULL;
    RETURN NEW;
  END IF;

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
$function$;