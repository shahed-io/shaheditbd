ALTER TABLE public.welcome_coupons ADD COLUMN IF NOT EXISTS ip_hash text;
CREATE INDEX IF NOT EXISTS idx_welcome_coupons_ip_hash ON public.welcome_coupons (ip_hash);