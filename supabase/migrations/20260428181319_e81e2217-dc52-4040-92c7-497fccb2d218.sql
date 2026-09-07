-- Audit log for CID balance adjustments
CREATE TABLE IF NOT EXISTS public.cid_balance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  note text,
  adjusted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cid_balance_adj_user ON public.cid_balance_adjustments(user_id, created_at DESC);

ALTER TABLE public.cid_balance_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all adjustments"
ON public.cid_balance_adjustments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own adjustments"
ON public.cid_balance_adjustments FOR SELECT
USING (auth.uid() = user_id);

-- Updated RPC: supports lookup by user_id OR email/phone, logs to audit table
CREATE OR REPLACE FUNCTION public.admin_adjust_cid_balance(
  p_user_id uuid,
  p_delta integer,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_new integer; v_admin uuid;
BEGIN
  v_admin := auth.uid();
  IF NOT has_role(v_admin, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  IF p_delta = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Delta cannot be zero');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  INSERT INTO public.cid_balances (user_id, balance, total_added, total_used)
  VALUES (p_user_id, GREATEST(p_delta, 0), GREATEST(p_delta, 0), 0)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = GREATEST(0, cid_balances.balance + p_delta),
        total_added = cid_balances.total_added + GREATEST(p_delta, 0),
        total_used = cid_balances.total_used + GREATEST(-p_delta, 0),
        updated_at = now()
  RETURNING balance INTO v_new;

  INSERT INTO public.cid_balance_adjustments (user_id, delta, balance_after, note, adjusted_by)
  VALUES (p_user_id, p_delta, v_new, p_note, v_admin);

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (p_user_id,
    CASE WHEN p_delta > 0 THEN '✅ CID Credit যোগ হয়েছে' ELSE '⚠️ CID Credit কাটা হয়েছে' END,
    CASE WHEN p_delta > 0 THEN 'অ্যাডমিন আপনার অ্যাকাউন্টে ' || p_delta || ' টি CID যোগ করেছেন।' ELSE 'অ্যাডমিন আপনার অ্যাকাউন্ট থেকে ' || ABS(p_delta) || ' টি CID কেটেছেন।' END,
    'info', false);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new);
END;
$$;

-- Lookup user by email or phone (admin only) — for quick credit grants
CREATE OR REPLACE FUNCTION public.admin_find_user_for_cid(p_query text)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  phone text,
  balance integer,
  total_added integer,
  total_used integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_q text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_q := lower(trim(p_query));
  IF v_q = '' OR v_q IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.email,
    p.phone,
    COALESCE(b.balance, 0) AS balance,
    COALESCE(b.total_added, 0) AS total_added,
    COALESCE(b.total_used, 0) AS total_used
  FROM public.profiles p
  LEFT JOIN public.cid_balances b ON b.user_id = p.user_id
  WHERE lower(p.email) LIKE '%' || v_q || '%'
     OR lower(p.phone) LIKE '%' || v_q || '%'
     OR lower(p.display_name) LIKE '%' || v_q || '%'
     OR lower(p.username) LIKE '%' || v_q || '%'
     OR p.user_id::text = v_q
  ORDER BY (lower(p.email) = v_q) DESC, p.created_at DESC
  LIMIT 50;
END;
$$;