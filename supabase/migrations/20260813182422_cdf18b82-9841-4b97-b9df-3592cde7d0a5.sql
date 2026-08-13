CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text,
  email text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.signup_attempts TO service_role;
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signup_attempts admin read" ON public.signup_attempts;
CREATE POLICY "signup_attempts admin read" ON public.signup_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.signup_attempts TO authenticated;
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_time ON public.signup_attempts (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_email_time ON public.signup_attempts (email, created_at DESC);

INSERT INTO public.site_settings (key, value)
VALUES ('turnstile_site_key', '')
ON CONFLICT (key) DO NOTHING;