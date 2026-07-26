-- 1) Config table (server-only)
CREATE TABLE IF NOT EXISTS public.google_indexing_config (
  id INT PRIMARY KEY DEFAULT 1,
  service_account_json TEXT,
  service_account_email TEXT,
  project_id TEXT,
  last_tested_at TIMESTAMPTZ,
  last_test_ok BOOLEAN,
  last_test_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT google_indexing_config_singleton CHECK (id = 1)
);

GRANT ALL ON public.google_indexing_config TO service_role;
-- Deliberately NO grants for anon / authenticated: this table holds the private key.

ALTER TABLE public.google_indexing_config ENABLE ROW LEVEL SECURITY;
-- No policies = no client access. Backend edge functions use service_role.

-- 2) Log table
CREATE TABLE IF NOT EXISTS public.google_indexing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'URL_UPDATED',
  status_code INT,
  ok BOOLEAN NOT NULL DEFAULT false,
  response_body TEXT,
  error TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS google_indexing_log_product_idx ON public.google_indexing_log(product_id);
CREATE INDEX IF NOT EXISTS google_indexing_log_submitted_idx ON public.google_indexing_log(submitted_at DESC);

GRANT SELECT ON public.google_indexing_log TO authenticated;
GRANT ALL  ON public.google_indexing_log TO service_role;

ALTER TABLE public.google_indexing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view indexing log"
ON public.google_indexing_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));