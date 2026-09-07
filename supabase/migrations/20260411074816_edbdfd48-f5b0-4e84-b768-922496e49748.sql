
-- Checkout conversation state tracking
CREATE TABLE public.telegram_checkout_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL UNIQUE,
  step text NOT NULL DEFAULT 'name',
  collected_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_checkout_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.telegram_checkout_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);
