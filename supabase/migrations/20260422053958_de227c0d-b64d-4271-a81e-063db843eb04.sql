-- Add delivery_batch_id to track licenses delivered together in a single WhatsApp batch
ALTER TABLE public.license_keys
ADD COLUMN IF NOT EXISTS delivery_batch_id uuid;

CREATE INDEX IF NOT EXISTS idx_license_keys_delivery_batch
ON public.license_keys(delivery_batch_id)
WHERE delivery_batch_id IS NOT NULL;