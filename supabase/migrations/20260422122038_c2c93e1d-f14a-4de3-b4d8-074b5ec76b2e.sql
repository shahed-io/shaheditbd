CREATE TABLE IF NOT EXISTS public.telegram_user_prefs (
  chat_id text PRIMARY KEY,
  language text NOT NULL DEFAULT 'bn',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_user_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages telegram prefs"
  ON public.telegram_user_prefs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');