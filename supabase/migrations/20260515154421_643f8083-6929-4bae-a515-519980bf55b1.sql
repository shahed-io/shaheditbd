-- 2FA secrets per admin user
CREATE TABLE public.admin_2fa (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  backup_codes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  last_used_at timestamptz
);

ALTER TABLE public.admin_2fa ENABLE ROW LEVEL SECURITY;

-- Deny all client access — only edge functions (service role) may touch this table
CREATE POLICY "admin_2fa_deny_all_select" ON public.admin_2fa FOR SELECT USING (false);
CREATE POLICY "admin_2fa_deny_all_insert" ON public.admin_2fa FOR INSERT WITH CHECK (false);
CREATE POLICY "admin_2fa_deny_all_update" ON public.admin_2fa FOR UPDATE USING (false);
CREATE POLICY "admin_2fa_deny_all_delete" ON public.admin_2fa FOR DELETE USING (false);

-- Per-device 2FA sessions (issued after successful TOTP verify on login)
CREATE TABLE public.admin_2fa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  user_agent text,
  ip text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_2fa_sessions_user ON public.admin_2fa_sessions(user_id);
CREATE INDEX idx_admin_2fa_sessions_token ON public.admin_2fa_sessions(token);
CREATE INDEX idx_admin_2fa_sessions_expires ON public.admin_2fa_sessions(expires_at);

ALTER TABLE public.admin_2fa_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_2fa_sessions_deny_select" ON public.admin_2fa_sessions FOR SELECT USING (false);
CREATE POLICY "admin_2fa_sessions_deny_insert" ON public.admin_2fa_sessions FOR INSERT WITH CHECK (false);
CREATE POLICY "admin_2fa_sessions_deny_update" ON public.admin_2fa_sessions FOR UPDATE USING (false);
CREATE POLICY "admin_2fa_sessions_deny_delete" ON public.admin_2fa_sessions FOR DELETE USING (false);