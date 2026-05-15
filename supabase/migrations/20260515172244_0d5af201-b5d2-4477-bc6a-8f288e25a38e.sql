
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_order_items_expires_at
  ON public.order_items (expires_at)
  WHERE expires_at IS NOT NULL;

ALTER TABLE public.personal_licenses
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
