
-- =========================================================
-- 1) COUPONS: stop leaking other customers' email addresses
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view eligible coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    customer_email IS NULL
    OR lower(customer_email) = lower(COALESCE(
      (SELECT email FROM public.profiles WHERE user_id = auth.uid()),
      ''
    ))
  )
);

-- =========================================================
-- 2) ABANDONED CHECKOUTS: lock down public writes
-- =========================================================
DROP POLICY IF EXISTS "Public can update abandoned checkout" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Public can insert abandoned checkout"  ON public.abandoned_checkouts;

-- Secure upsert: only the caller's own session token can be written.
CREATE OR REPLACE FUNCTION public.upsert_abandoned_checkout(
  p_session_token text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF p_session_token IS NULL OR length(p_session_token) < 8 THEN
    RAISE EXCEPTION 'invalid session token';
  END IF;

  INSERT INTO public.abandoned_checkouts (
    session_token, user_id, customer_name, customer_email, customer_phone,
    cart_items, item_count, subtotal, discount_amount, total,
    coupon_code, payment_method, notes, page_url, user_agent, updated_at
  ) VALUES (
    p_session_token,
    v_user_id,
    NULLIF(p_payload->>'customer_name', ''),
    NULLIF(p_payload->>'customer_email', ''),
    NULLIF(p_payload->>'customer_phone', ''),
    COALESCE(p_payload->'cart_items', '[]'::jsonb),
    COALESCE((p_payload->>'item_count')::int, 0),
    COALESCE((p_payload->>'subtotal')::numeric, 0),
    COALESCE((p_payload->>'discount_amount')::numeric, 0),
    COALESCE((p_payload->>'total')::numeric, 0),
    NULLIF(p_payload->>'coupon_code', ''),
    NULLIF(p_payload->>'payment_method', ''),
    NULLIF(p_payload->>'notes', ''),
    NULLIF(p_payload->>'page_url', ''),
    LEFT(COALESCE(p_payload->>'user_agent',''), 500),
    now()
  )
  ON CONFLICT (session_token) DO UPDATE SET
    user_id          = COALESCE(EXCLUDED.user_id, public.abandoned_checkouts.user_id),
    customer_name    = COALESCE(EXCLUDED.customer_name, public.abandoned_checkouts.customer_name),
    customer_email   = COALESCE(EXCLUDED.customer_email, public.abandoned_checkouts.customer_email),
    customer_phone   = COALESCE(EXCLUDED.customer_phone, public.abandoned_checkouts.customer_phone),
    cart_items       = EXCLUDED.cart_items,
    item_count       = EXCLUDED.item_count,
    subtotal         = EXCLUDED.subtotal,
    discount_amount  = EXCLUDED.discount_amount,
    total            = EXCLUDED.total,
    coupon_code      = EXCLUDED.coupon_code,
    payment_method   = EXCLUDED.payment_method,
    notes            = EXCLUDED.notes,
    page_url         = EXCLUDED.page_url,
    user_agent       = EXCLUDED.user_agent,
    updated_at       = now()
  WHERE public.abandoned_checkouts.converted = false
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_abandoned_checkout_converted(
  p_session_token text,
  p_order_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_session_token IS NULL OR length(p_session_token) < 8 THEN
    RETURN false;
  END IF;
  UPDATE public.abandoned_checkouts
     SET converted = true,
         converted_order_id = p_order_id,
         converted_at = now(),
         updated_at = now()
   WHERE session_token = p_session_token;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_abandoned_checkout(text, jsonb)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_abandoned_checkout_converted(text, uuid)  TO anon, authenticated;

-- =========================================================
-- 3) AFFILIATE ACCOUNTS: prevent privilege escalation
-- =========================================================
CREATE OR REPLACE FUNCTION public.prevent_affiliate_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Non-admin owners cannot modify privileged fields
  IF NEW.status                    IS DISTINCT FROM OLD.status
  OR NEW.available_balance         IS DISTINCT FROM OLD.available_balance
  OR NEW.total_earned              IS DISTINCT FROM OLD.total_earned
  OR NEW.total_paid                IS DISTINCT FROM OLD.total_paid
  OR NEW.total_conversions         IS DISTINCT FROM OLD.total_conversions
  OR NEW.custom_commission_percent IS DISTINCT FROM OLD.custom_commission_percent
  OR NEW.referral_code             IS DISTINCT FROM OLD.referral_code
  OR NEW.approved_at               IS DISTINCT FROM OLD.approved_at
  OR NEW.approved_by               IS DISTINCT FROM OLD.approved_by
  OR NEW.admin_note                IS DISTINCT FROM OLD.admin_note
  THEN
    RAISE EXCEPTION 'Not authorized to modify protected affiliate fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_affiliate_self_escalation ON public.affiliate_accounts;
CREATE TRIGGER trg_prevent_affiliate_self_escalation
BEFORE UPDATE ON public.affiliate_accounts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_affiliate_self_escalation();

-- =========================================================
-- 4) PAYMENT LINK SUBMISSIONS: remove public read
-- =========================================================
DROP POLICY IF EXISTS "pls_public_select" ON public.payment_link_submissions;

CREATE OR REPLACE FUNCTION public.get_payment_submission_public(p_id uuid)
RETURNS TABLE (
  id uuid,
  status text,
  product_name text,
  quantity integer,
  amount numeric,
  total numeric,
  payment_method text,
  transaction_id text,
  order_number text,
  admin_note text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.status, s.product_name, s.quantity, s.amount, s.total,
         s.payment_method, s.transaction_id, s.order_number, s.admin_note,
         s.created_at
  FROM public.payment_link_submissions s
  WHERE s.id = p_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_submission_public(uuid) TO anon, authenticated;

-- =========================================================
-- 5) STORAGE: tighten payment-proofs and invoices buckets
-- =========================================================
DROP POLICY IF EXISTS "pp_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Public read invoices" ON storage.objects;
DROP POLICY IF EXISTS "Auth update invoices" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete invoices" ON storage.objects;

CREATE POLICY "Owner read invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Owner update invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'invoices'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Owner delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- =========================================================
-- 6) FUNCTION SEARCH PATH: lock down mutable function
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_outreach_prospects_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
