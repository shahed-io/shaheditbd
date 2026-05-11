CREATE TABLE IF NOT EXISTS public.text_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  default_value TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_text_overrides_category ON public.text_overrides(category);

ALTER TABLE public.text_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view text overrides" ON public.text_overrides;
CREATE POLICY "Anyone can view text overrides"
  ON public.text_overrides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert text overrides" ON public.text_overrides;
CREATE POLICY "Admins can insert text overrides"
  ON public.text_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update text overrides" ON public.text_overrides;
CREATE POLICY "Admins can update text overrides"
  ON public.text_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete text overrides" ON public.text_overrides;
CREATE POLICY "Admins can delete text overrides"
  ON public.text_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_text_overrides_updated_at
  BEFORE UPDATE ON public.text_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();