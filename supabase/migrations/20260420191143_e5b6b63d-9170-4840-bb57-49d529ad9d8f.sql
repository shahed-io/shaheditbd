ALTER TABLE public.welcome_coupons
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prize_label text;

ALTER TABLE public.welcome_coupons
  DROP CONSTRAINT IF EXISTS welcome_coupons_discount_type_check;

ALTER TABLE public.welcome_coupons
  ADD CONSTRAINT welcome_coupons_discount_type_check
  CHECK (discount_type IN ('percent','fixed','none'));