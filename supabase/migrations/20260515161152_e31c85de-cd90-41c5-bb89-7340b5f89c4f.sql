CREATE TABLE IF NOT EXISTS public.admin_2fa_config (
  id int PRIMARY KEY DEFAULT 1,
  session_ttl_hours int NOT NULL DEFAULT 12,
  remember_device_ttl_days int NOT NULL DEFAULT 30,
  allow_remember_device boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_2fa_config_singleton CHECK (id = 1),
  CONSTRAINT session_ttl_range CHECK (session_ttl_hours BETWEEN 1 AND 720),
  CONSTRAINT remember_ttl_range CHECK (remember_device_ttl_days BETWEEN 1 AND 365)
);

ALTER TABLE public.admin_2fa_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_view_2fa_config" ON public.admin_2fa_config;
CREATE POLICY "admins_view_2fa_config"
  ON public.admin_2fa_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.admin_2fa_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;