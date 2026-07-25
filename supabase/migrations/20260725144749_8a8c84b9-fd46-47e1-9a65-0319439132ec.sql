
-- Orders columns (safe adds)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS paypal_capture_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON public.orders(paypal_order_id);

-- PayPal transactions
CREATE TABLE IF NOT EXISTS public.paypal_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paypal_order_id text UNIQUE,
  paypal_capture_id text,
  transaction_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number text,
  user_id uuid,
  payer_email text,
  payer_id text,
  payer_name text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'created', -- created | approved | captured | failed | refunded | partially_refunded
  mode text NOT NULL DEFAULT 'sandbox',   -- sandbox | live
  refunded_amount numeric(12,2) NOT NULL DEFAULT 0,
  raw_create jsonb,
  raw_capture jsonb,
  raw_refund jsonb,
  raw_webhook jsonb,
  error_message text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paypal_tx_order_id ON public.paypal_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_paypal_tx_status ON public.paypal_transactions(status);
CREATE INDEX IF NOT EXISTS idx_paypal_tx_created_at ON public.paypal_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paypal_tx_capture_id ON public.paypal_transactions(paypal_capture_id);

GRANT SELECT ON public.paypal_transactions TO authenticated;
GRANT ALL ON public.paypal_transactions TO service_role;

ALTER TABLE public.paypal_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own paypal transactions"
  ON public.paypal_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage paypal transactions"
  ON public.paypal_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.paypal_tx_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_paypal_tx_updated_at ON public.paypal_transactions;
CREATE TRIGGER trg_paypal_tx_updated_at
  BEFORE UPDATE ON public.paypal_transactions
  FOR EACH ROW EXECUTE FUNCTION public.paypal_tx_touch_updated_at();
