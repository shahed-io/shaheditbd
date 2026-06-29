ALTER TABLE public.offer_submissions
  ADD COLUMN IF NOT EXISTS converted_to_customer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_user_id uuid,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;