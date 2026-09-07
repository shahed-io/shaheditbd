CREATE TABLE public.outreach_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'note',
  channel text,
  subject text,
  message text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_outreach_logs_prospect ON public.outreach_logs(prospect_id, occurred_at DESC);

ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage outreach logs"
ON public.outreach_logs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_outreach_logs_updated_at
BEFORE UPDATE ON public.outreach_logs
FOR EACH ROW EXECUTE FUNCTION public.touch_outreach_prospects_updated_at();