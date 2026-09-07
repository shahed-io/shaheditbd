
CREATE TABLE public.admin_email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_email_otps_user ON public.admin_email_otps(user_id, expires_at DESC);

ALTER TABLE public.admin_email_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_email_otps_deny_select ON public.admin_email_otps FOR SELECT USING (false);
CREATE POLICY admin_email_otps_deny_insert ON public.admin_email_otps FOR INSERT WITH CHECK (false);
CREATE POLICY admin_email_otps_deny_update ON public.admin_email_otps FOR UPDATE USING (false);
CREATE POLICY admin_email_otps_deny_delete ON public.admin_email_otps FOR DELETE USING (false);
