-- Notices table
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  body text NOT NULL DEFAULT '',
  reference_no text,
  audience text NOT NULL DEFAULT 'public' CHECK (audience IN ('public','customers','both')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  pinned boolean NOT NULL DEFAULT false,
  signed_by text,
  signed_role text,
  effective_date date,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- GRANTs (Data API)
GRANT SELECT ON public.notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;

-- RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Public visitors can read published public notices
CREATE POLICY "Public can read published public notices"
ON public.notices
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  AND (audience IN ('public','both'))
);

-- Authenticated customers can additionally read customers-only notices
CREATE POLICY "Authenticated can read published customer notices"
ON public.notices
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND audience IN ('customers','both')
);

-- Admins manage everything
CREATE POLICY "Admins can manage notices"
ON public.notices
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger (reuse existing helper)
CREATE TRIGGER update_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notices_status_published ON public.notices(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_audience ON public.notices(audience);