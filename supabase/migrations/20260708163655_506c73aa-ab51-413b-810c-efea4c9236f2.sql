
CREATE TABLE IF NOT EXISTS public.custom_winner_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  notes text,
  winner_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_winner_events TO authenticated;
GRANT ALL ON public.custom_winner_events TO service_role;
ALTER TABLE public.custom_winner_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage custom events"
  ON public.custom_winner_events FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.custom_event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.custom_winner_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  facebook text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  is_winner boolean NOT NULL DEFAULT false,
  winner_rank integer,
  prize text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS custom_event_participants_event_idx ON public.custom_event_participants(event_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_event_participants TO authenticated;
GRANT ALL ON public.custom_event_participants TO service_role;
ALTER TABLE public.custom_event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage custom participants"
  ON public.custom_event_participants FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
