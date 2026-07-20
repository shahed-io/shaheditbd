
-- ============================================================
-- 1. Ensure pgcrypto is available
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- 2. Generate & store master key in Vault (idempotent)
-- ============================================================
DO $$
DECLARE
  v_existing text;
  v_new_key text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_existing
      FROM vault.decrypted_secrets
     WHERE name = 'app_encryption_key'
     LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_existing := NULL;
  END;

  IF v_existing IS NULL OR v_existing = '' THEN
    v_new_key := encode(extensions.gen_random_bytes(48), 'base64');
    PERFORM vault.create_secret(v_new_key, 'app_encryption_key',
      'Master AES-256 key for customer PII / license / support data encryption');
  END IF;
END $$;

-- ============================================================
-- 3. Encryption helpers (SECURITY DEFINER, locked down)
-- ============================================================
CREATE OR REPLACE FUNCTION public._enc_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret
    FROM vault.decrypted_secrets
   WHERE name = 'app_encryption_key'
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public._enc(p_plain text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_key text;
BEGIN
  IF p_plain IS NULL OR p_plain = '' THEN RETURN NULL; END IF;
  v_key := public._enc_key();
  IF v_key IS NULL THEN RAISE EXCEPTION 'encryption key not configured'; END IF;
  RETURN extensions.pgp_sym_encrypt(p_plain, v_key, 'cipher-algo=aes256');
END $$;

CREATE OR REPLACE FUNCTION public._dec(p_cipher bytea)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_key text;
BEGIN
  IF p_cipher IS NULL THEN RETURN NULL; END IF;
  v_key := public._enc_key();
  IF v_key IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_decrypt(p_cipher, v_key);
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '_dec failed: %', SQLERRM;
  RETURN NULL;
END $$;

REVOKE ALL ON FUNCTION public._enc_key()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._enc(text)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._dec(bytea)     FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 4. Add ciphertext columns
-- ============================================================
ALTER TABLE public.license_keys       ADD COLUMN IF NOT EXISTS key_value_enc  bytea;
ALTER TABLE public.license_keys       ADD COLUMN IF NOT EXISTS extra_info_enc bytea;
ALTER TABLE public.order_items        ADD COLUMN IF NOT EXISTS license_key_enc bytea;
ALTER TABLE public.personal_licenses  ADD COLUMN IF NOT EXISTS key_value_enc  bytea;
ALTER TABLE public.personal_licenses  ADD COLUMN IF NOT EXISTS password_enc   bytea;
ALTER TABLE public.personal_licenses  ADD COLUMN IF NOT EXISTS note_enc       bytea;
ALTER TABLE public.orders             ADD COLUMN IF NOT EXISTS customer_phone_enc bytea;
ALTER TABLE public.orders             ADD COLUMN IF NOT EXISTS customer_email_enc bytea;
ALTER TABLE public.orders             ADD COLUMN IF NOT EXISTS notes_enc          bytea;
ALTER TABLE public.bkash_transactions ADD COLUMN IF NOT EXISTS trx_id_enc          bytea;
ALTER TABLE public.bkash_transactions ADD COLUMN IF NOT EXISTS payer_reference_enc bytea;
ALTER TABLE public.bkash_transactions ADD COLUMN IF NOT EXISTS payer_msisdn_enc    bytea;
ALTER TABLE public.payment_proofs     ADD COLUMN IF NOT EXISTS transaction_id_enc  bytea;
ALTER TABLE public.support_tickets    ADD COLUMN IF NOT EXISTS subject_enc bytea;
ALTER TABLE public.support_tickets    ADD COLUMN IF NOT EXISTS message_enc bytea;
ALTER TABLE public.support_replies    ADD COLUMN IF NOT EXISTS message_enc bytea;

-- ============================================================
-- 5. Backfill existing rows
-- ============================================================
UPDATE public.license_keys
   SET key_value_enc  = public._enc(key_value),
       extra_info_enc = public._enc(extra_info)
 WHERE key_value_enc IS NULL AND (key_value IS NOT NULL OR extra_info IS NOT NULL);

UPDATE public.order_items
   SET license_key_enc = public._enc(license_key)
 WHERE license_key_enc IS NULL AND license_key IS NOT NULL;

UPDATE public.personal_licenses
   SET key_value_enc = public._enc(key_value),
       password_enc  = public._enc(password),
       note_enc      = public._enc(note)
 WHERE key_value_enc IS NULL
    OR (password IS NOT NULL AND password_enc IS NULL)
    OR (note IS NOT NULL AND note_enc IS NULL);

UPDATE public.orders
   SET customer_phone_enc = public._enc(customer_phone),
       customer_email_enc = public._enc(customer_email),
       notes_enc          = public._enc(notes)
 WHERE customer_phone_enc IS NULL AND customer_email_enc IS NULL AND notes_enc IS NULL
   AND (customer_phone IS NOT NULL OR customer_email IS NOT NULL OR notes IS NOT NULL);

UPDATE public.bkash_transactions
   SET trx_id_enc          = public._enc(trx_id),
       payer_reference_enc = public._enc(payer_reference),
       payer_msisdn_enc    = public._enc(payer_msisdn)
 WHERE trx_id_enc IS NULL AND payer_reference_enc IS NULL AND payer_msisdn_enc IS NULL
   AND (trx_id IS NOT NULL OR payer_reference IS NOT NULL OR payer_msisdn IS NOT NULL);

UPDATE public.payment_proofs
   SET transaction_id_enc = public._enc(transaction_id)
 WHERE transaction_id_enc IS NULL AND transaction_id IS NOT NULL;

UPDATE public.support_tickets
   SET subject_enc = public._enc(subject),
       message_enc = public._enc(message)
 WHERE subject_enc IS NULL AND message_enc IS NULL
   AND (subject IS NOT NULL OR message IS NOT NULL);

UPDATE public.support_replies
   SET message_enc = public._enc(message)
 WHERE message_enc IS NULL AND message IS NOT NULL;

-- ============================================================
-- 6. Generic encrypt-on-write triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.encrypt_license_keys_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.key_value IS DISTINCT FROM COALESCE(OLD.key_value, NULL) OR NEW.key_value_enc IS NULL THEN
    NEW.key_value_enc := public._enc(NEW.key_value);
  END IF;
  IF NEW.extra_info IS DISTINCT FROM COALESCE(OLD.extra_info, NULL) OR NEW.extra_info_enc IS NULL THEN
    NEW.extra_info_enc := public._enc(NEW.extra_info);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_license_keys ON public.license_keys;
CREATE TRIGGER trg_encrypt_license_keys BEFORE INSERT OR UPDATE ON public.license_keys
FOR EACH ROW EXECUTE FUNCTION public.encrypt_license_keys_tg();

CREATE OR REPLACE FUNCTION public.encrypt_order_items_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.license_key IS DISTINCT FROM COALESCE(OLD.license_key, NULL) OR NEW.license_key_enc IS NULL THEN
    NEW.license_key_enc := public._enc(NEW.license_key);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_order_items ON public.order_items;
CREATE TRIGGER trg_encrypt_order_items BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.encrypt_order_items_tg();

CREATE OR REPLACE FUNCTION public.encrypt_personal_licenses_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.key_value IS DISTINCT FROM COALESCE(OLD.key_value, NULL) OR NEW.key_value_enc IS NULL THEN
    NEW.key_value_enc := public._enc(NEW.key_value);
  END IF;
  IF NEW.password IS DISTINCT FROM COALESCE(OLD.password, NULL) OR NEW.password_enc IS NULL THEN
    NEW.password_enc := public._enc(NEW.password);
  END IF;
  IF NEW.note IS DISTINCT FROM COALESCE(OLD.note, NULL) OR NEW.note_enc IS NULL THEN
    NEW.note_enc := public._enc(NEW.note);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_personal_licenses ON public.personal_licenses;
CREATE TRIGGER trg_encrypt_personal_licenses BEFORE INSERT OR UPDATE ON public.personal_licenses
FOR EACH ROW EXECUTE FUNCTION public.encrypt_personal_licenses_tg();

CREATE OR REPLACE FUNCTION public.encrypt_orders_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.customer_phone IS DISTINCT FROM COALESCE(OLD.customer_phone, NULL) OR NEW.customer_phone_enc IS NULL THEN
    NEW.customer_phone_enc := public._enc(NEW.customer_phone);
  END IF;
  IF NEW.customer_email IS DISTINCT FROM COALESCE(OLD.customer_email, NULL) OR NEW.customer_email_enc IS NULL THEN
    NEW.customer_email_enc := public._enc(NEW.customer_email);
  END IF;
  IF NEW.notes IS DISTINCT FROM COALESCE(OLD.notes, NULL) OR NEW.notes_enc IS NULL THEN
    NEW.notes_enc := public._enc(NEW.notes);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_orders ON public.orders;
CREATE TRIGGER trg_encrypt_orders BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.encrypt_orders_tg();

CREATE OR REPLACE FUNCTION public.encrypt_bkash_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.trx_id IS DISTINCT FROM COALESCE(OLD.trx_id, NULL) OR NEW.trx_id_enc IS NULL THEN
    NEW.trx_id_enc := public._enc(NEW.trx_id);
  END IF;
  IF NEW.payer_reference IS DISTINCT FROM COALESCE(OLD.payer_reference, NULL) OR NEW.payer_reference_enc IS NULL THEN
    NEW.payer_reference_enc := public._enc(NEW.payer_reference);
  END IF;
  IF NEW.payer_msisdn IS DISTINCT FROM COALESCE(OLD.payer_msisdn, NULL) OR NEW.payer_msisdn_enc IS NULL THEN
    NEW.payer_msisdn_enc := public._enc(NEW.payer_msisdn);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_bkash ON public.bkash_transactions;
CREATE TRIGGER trg_encrypt_bkash BEFORE INSERT OR UPDATE ON public.bkash_transactions
FOR EACH ROW EXECUTE FUNCTION public.encrypt_bkash_tg();

CREATE OR REPLACE FUNCTION public.encrypt_payment_proofs_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.transaction_id IS DISTINCT FROM COALESCE(OLD.transaction_id, NULL) OR NEW.transaction_id_enc IS NULL THEN
    NEW.transaction_id_enc := public._enc(NEW.transaction_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_payment_proofs ON public.payment_proofs;
CREATE TRIGGER trg_encrypt_payment_proofs BEFORE INSERT OR UPDATE ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.encrypt_payment_proofs_tg();

CREATE OR REPLACE FUNCTION public.encrypt_support_tickets_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.subject IS DISTINCT FROM COALESCE(OLD.subject, NULL) OR NEW.subject_enc IS NULL THEN
    NEW.subject_enc := public._enc(NEW.subject);
  END IF;
  IF NEW.message IS DISTINCT FROM COALESCE(OLD.message, NULL) OR NEW.message_enc IS NULL THEN
    NEW.message_enc := public._enc(NEW.message);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_support_tickets ON public.support_tickets;
CREATE TRIGGER trg_encrypt_support_tickets BEFORE INSERT OR UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.encrypt_support_tickets_tg();

CREATE OR REPLACE FUNCTION public.encrypt_support_replies_tg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.message IS DISTINCT FROM COALESCE(OLD.message, NULL) OR NEW.message_enc IS NULL THEN
    NEW.message_enc := public._enc(NEW.message);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_encrypt_support_replies ON public.support_replies;
CREATE TRIGGER trg_encrypt_support_replies BEFORE INSERT OR UPDATE ON public.support_replies
FOR EACH ROW EXECUTE FUNCTION public.encrypt_support_replies_tg();

-- ============================================================
-- 7. Owner + admin decrypt RPCs
-- ============================================================

-- Get decrypted license keys for an order (owner or admin)
CREATE OR REPLACE FUNCTION public.get_order_license_keys(p_order_id uuid)
RETURNS TABLE(order_item_id uuid, product_name text, license_key text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.orders WHERE id = p_order_id;
  IF v_owner IS NULL THEN RETURN; END IF;
  IF v_owner <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT oi.id, oi.product_name,
           COALESCE(public._dec(oi.license_key_enc), oi.license_key)
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id;
END $$;

-- Get decrypted personal licenses (owner-only view — matched by phone/email)
CREATE OR REPLACE FUNCTION public.get_my_personal_licenses(p_query text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, category text, key_value text, password text, password_type text,
              note text, status text, expires_at timestamptz, delivered_at timestamptz, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT email INTO v_email FROM public.profiles WHERE user_id = auth.uid();

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
      SELECT pl.id, pl.name, pl.category,
             COALESCE(public._dec(pl.key_value_enc), pl.key_value),
             COALESCE(public._dec(pl.password_enc),  pl.password),
             pl.password_type,
             COALESCE(public._dec(pl.note_enc), pl.note),
             pl.status, pl.expires_at, pl.delivered_at, pl.created_at
        FROM public.personal_licenses pl
       WHERE (p_query IS NULL OR pl.customer_email ILIKE '%'||p_query||'%' OR pl.customer_phone ILIKE '%'||p_query||'%');
  ELSE
    RETURN QUERY
      SELECT pl.id, pl.name, pl.category,
             COALESCE(public._dec(pl.key_value_enc), pl.key_value),
             COALESCE(public._dec(pl.password_enc),  pl.password),
             pl.password_type,
             COALESCE(public._dec(pl.note_enc), pl.note),
             pl.status, pl.expires_at, pl.delivered_at, pl.created_at
        FROM public.personal_licenses pl
       WHERE v_email IS NOT NULL AND lower(pl.customer_email) = lower(v_email);
  END IF;
END $$;

-- Owner-or-admin: decrypted contact for a single order
CREATE OR REPLACE FUNCTION public.get_order_contact_secure(p_order_id uuid)
RETURNS TABLE(customer_phone text, customer_email text, notes text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.orders WHERE id = p_order_id;
  IF v_owner IS NULL THEN RETURN; END IF;
  IF v_owner <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT COALESCE(public._dec(o.customer_phone_enc), o.customer_phone),
           COALESCE(public._dec(o.customer_email_enc), o.customer_email),
           COALESCE(public._dec(o.notes_enc), o.notes)
      FROM public.orders o WHERE o.id = p_order_id;
END $$;

-- Admin-only: decrypted license_keys row
CREATE OR REPLACE FUNCTION public.admin_get_license_key(p_id uuid)
RETURNS TABLE(id uuid, product_id uuid, key_value text, extra_info text, key_type text, status text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT lk.id, lk.product_id,
           COALESCE(public._dec(lk.key_value_enc),  lk.key_value),
           COALESCE(public._dec(lk.extra_info_enc), lk.extra_info),
           lk.key_type, lk.status, lk.created_at
      FROM public.license_keys lk WHERE lk.id = p_id;
END $$;

-- Owner-or-admin: decrypted support ticket + replies
CREATE OR REPLACE FUNCTION public.get_support_thread_secure(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner uuid; v_ticket jsonb; v_replies jsonb;
BEGIN
  SELECT user_id INTO v_owner FROM public.support_tickets WHERE id = p_ticket_id;
  IF v_owner IS NULL THEN RETURN NULL; END IF;
  IF v_owner <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT to_jsonb(t) || jsonb_build_object(
           'subject', COALESCE(public._dec(t.subject_enc), t.subject),
           'message', COALESCE(public._dec(t.message_enc), t.message))
    INTO v_ticket FROM public.support_tickets t WHERE t.id = p_ticket_id;
  SELECT jsonb_agg(to_jsonb(r) || jsonb_build_object(
           'message', COALESCE(public._dec(r.message_enc), r.message)) ORDER BY r.created_at)
    INTO v_replies FROM public.support_replies r WHERE r.ticket_id = p_ticket_id;
  RETURN jsonb_build_object('ticket', v_ticket, 'replies', COALESCE(v_replies, '[]'::jsonb));
END $$;

-- Admin-only: decrypted bKash transaction
CREATE OR REPLACE FUNCTION public.admin_get_bkash_transaction(p_id uuid)
RETURNS TABLE(id uuid, payment_id text, trx_id text, payer_reference text, payer_msisdn text, amount numeric, status text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT b.id, b.payment_id,
           COALESCE(public._dec(b.trx_id_enc),          b.trx_id),
           COALESCE(public._dec(b.payer_reference_enc), b.payer_reference),
           COALESCE(public._dec(b.payer_msisdn_enc),    b.payer_msisdn),
           b.amount, b.status, b.created_at
      FROM public.bkash_transactions b WHERE b.id = p_id;
END $$;

-- ============================================================
-- 8. Grant RPC execution
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_order_license_keys(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_personal_licenses(text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_contact_secure(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_license_key(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_thread_secure(uuid)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_bkash_transaction(uuid) TO authenticated;
