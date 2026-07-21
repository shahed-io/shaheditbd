
-- Core linker: given a user, email, phone → set user_id on matching guest orders
CREATE OR REPLACE FUNCTION public._link_guest_orders_for(
  p_user_id uuid, p_email text, p_phone text
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int := 0;
BEGIN
  IF p_user_id IS NULL THEN RETURN 0; END IF;
  IF (p_email IS NULL OR p_email = '') AND (p_phone IS NULL OR p_phone = '') THEN
    RETURN 0;
  END IF;

  UPDATE public.orders o
     SET user_id = p_user_id, updated_at = now()
   WHERE o.user_id IS NULL
     AND (
          (p_email IS NOT NULL AND p_email <> '' AND lower(o.customer_email) = lower(p_email))
       OR (p_phone IS NOT NULL AND p_phone <> '' AND regexp_replace(o.customer_phone, '\D', '', 'g')
                                                = regexp_replace(p_phone,          '\D', '', 'g'))
     );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

-- Callable RPC — current user claims their own guest orders
CREATE OR REPLACE FUNCTION public.link_my_guest_orders()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_phone text;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;
  SELECT p.email, p.phone INTO v_email, v_phone
    FROM public.profiles p WHERE p.user_id = v_uid;
  -- Fallback to auth.users email
  IF v_email IS NULL OR v_email = '' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;
  RETURN public._link_guest_orders_for(v_uid, v_email, v_phone);
END; $$;

GRANT EXECUTE ON FUNCTION public.link_my_guest_orders() TO authenticated;

-- Trigger on profiles: whenever a profile is created or its email/phone changes,
-- attach any prior guest orders to this user.
CREATE OR REPLACE FUNCTION public.trg_link_guest_orders_on_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    PERFORM public._link_guest_orders_for(NEW.user_id, NEW.email, NEW.phone);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'link_guest_orders_on_profile failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS link_guest_orders_on_profile ON public.profiles;
CREATE TRIGGER link_guest_orders_on_profile
AFTER INSERT OR UPDATE OF email, phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_link_guest_orders_on_profile();
