-- bKash transactions log
CREATE TABLE IF NOT EXISTS public.bkash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text UNIQUE,
  trx_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number text,
  user_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  payer_msisdn text,
  payer_reference text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  status text NOT NULL DEFAULT 'initiated',
  mode text NOT NULL DEFAULT 'sandbox',
  status_code text,
  status_message text,
  raw_create jsonb,
  raw_execute jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bkash_tx_payment_id ON public.bkash_transactions (payment_id);
CREATE INDEX IF NOT EXISTS idx_bkash_tx_trx_id     ON public.bkash_transactions (trx_id);
CREATE INDEX IF NOT EXISTS idx_bkash_tx_order_id   ON public.bkash_transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_bkash_tx_status     ON public.bkash_transactions (status);
CREATE INDEX IF NOT EXISTS idx_bkash_tx_created_at ON public.bkash_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bkash_tx_msisdn     ON public.bkash_transactions (payer_msisdn);

ALTER TABLE public.bkash_transactions ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can view bkash transactions"
  ON public.bkash_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bkash transactions"
  ON public.bkash_transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bkash transactions"
  ON public.bkash_transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bkash transactions"
  ON public.bkash_transactions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_bkash_tx_updated_at ON public.bkash_transactions;
CREATE TRIGGER trg_bkash_tx_updated_at
BEFORE UPDATE ON public.bkash_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();