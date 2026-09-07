ALTER TABLE public.bkash_transactions
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'order',
  ADD COLUMN IF NOT EXISTS topup_request_id uuid REFERENCES public.wallet_topup_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bkash_tx_topup_request ON public.bkash_transactions(topup_request_id);
CREATE INDEX IF NOT EXISTS idx_bkash_tx_purpose ON public.bkash_transactions(purpose);

-- Make order_number explicitly nullable for wallet topup transactions (already was, ensure)
ALTER TABLE public.bkash_transactions ALTER COLUMN order_number DROP NOT NULL;