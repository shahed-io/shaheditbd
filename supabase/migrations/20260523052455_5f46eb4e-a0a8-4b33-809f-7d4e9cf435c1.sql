
ALTER TABLE public.payment_links
  ADD COLUMN IF NOT EXISTS is_open_form BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.payment_links
  ALTER COLUMN product_name DROP NOT NULL;

ALTER TABLE public.payment_links
  ALTER COLUMN amount DROP NOT NULL;
