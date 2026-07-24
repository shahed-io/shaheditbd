
ALTER TABLE public.currencies ADD COLUMN IF NOT EXISTS rate_per_usd numeric;

-- Seed sane USD-based rates so existing currencies auto-recalc from a USD pivot
UPDATE public.currencies SET rate_per_usd = 1 WHERE code = 'USD' AND rate_per_usd IS NULL;
UPDATE public.currencies SET rate_per_usd = 0.92 WHERE code = 'EUR' AND rate_per_usd IS NULL;
UPDATE public.currencies SET rate_per_usd = 0.79 WHERE code = 'GBP' AND rate_per_usd IS NULL;
UPDATE public.currencies SET rate_per_usd = 83 WHERE code = 'INR' AND rate_per_usd IS NULL;
UPDATE public.currencies SET rate_per_usd = 3.75 WHERE code = 'SAR' AND rate_per_usd IS NULL;
UPDATE public.currencies SET rate_per_usd = 3.67 WHERE code = 'AED' AND rate_per_usd IS NULL;
UPDATE public.currencies SET rate_per_usd = 4.7 WHERE code = 'MYR' AND rate_per_usd IS NULL;

-- Store admin-configured USD -> BDT pivot rate in site_settings
INSERT INTO public.site_settings (key, value)
VALUES ('usd_to_bdt_rate', to_jsonb(120::numeric))
ON CONFLICT (key) DO NOTHING;
