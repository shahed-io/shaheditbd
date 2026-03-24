
CREATE TABLE IF NOT EXISTS public.reseller_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reseller_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.reseller_users(id) ON DELETE CASCADE,
  installation_id TEXT,
  cid TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reseller_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.reseller_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_reseller_users" ON public.reseller_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_reseller_generations" ON public.reseller_generations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_reseller_sessions" ON public.reseller_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reseller_gen_user ON public.reseller_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_gen_created ON public.reseller_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reseller_sessions_token ON public.reseller_sessions(token);
