
-- OFFERS
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  banner_url text,
  prize_details text,
  terms text,
  status text NOT NULL DEFAULT 'draft', -- draft | active | closed
  start_at timestamptz,
  end_at timestamptz,
  max_submissions integer,
  require_login boolean NOT NULL DEFAULT false,
  success_message text DEFAULT 'ধন্যবাদ! আপনার এন্ট্রি গৃহীত হয়েছে।',
  google_form_url text,
  show_winners boolean NOT NULL DEFAULT true,
  submission_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active offers"
ON public.offers FOR SELECT
USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage offers"
ON public.offers FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- OFFER FIELDS
CREATE TABLE public.offer_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  field_type text NOT NULL, -- text|email|phone|number|textarea|select|radio|checkbox|date|file
  label text NOT NULL,
  placeholder text,
  help_text text,
  required boolean NOT NULL DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  validation jsonb DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.offer_fields TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_fields TO authenticated;
GRANT ALL ON public.offer_fields TO service_role;

ALTER TABLE public.offer_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view fields of active offers"
ON public.offer_fields FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.status = 'active' OR public.has_role(auth.uid(), 'admin')))
);

CREATE POLICY "Admins manage offer fields"
ON public.offer_fields FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX offer_fields_offer_id_idx ON public.offer_fields(offer_id, sort_order);

-- OFFER SUBMISSIONS
CREATE TABLE public.offer_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  participant_name text,
  participant_email text,
  participant_phone text,
  ip text,
  user_agent text,
  is_winner boolean NOT NULL DEFAULT false,
  winner_rank integer,
  prize_won text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.offer_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_submissions TO authenticated;
GRANT ALL ON public.offer_submissions TO service_role;

ALTER TABLE public.offer_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit to active offers"
ON public.offer_submissions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND o.status = 'active')
);

CREATE POLICY "Users view own submissions"
ON public.offer_submissions FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage submissions"
ON public.offer_submissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX offer_submissions_offer_idx ON public.offer_submissions(offer_id, created_at DESC);

-- Auto-increment submission_count
CREATE OR REPLACE FUNCTION public.bump_offer_submission_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.offers SET submission_count = submission_count + 1 WHERE id = NEW.offer_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER offer_submission_count_trigger
AFTER INSERT ON public.offer_submissions
FOR EACH ROW EXECUTE FUNCTION public.bump_offer_submission_count();

-- OFFER WINNERS
CREATE TABLE public.offer_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.offer_submissions(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  prize text,
  selected_by text NOT NULL DEFAULT 'random', -- random | ai | manual
  announced boolean NOT NULL DEFAULT true,
  ai_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.offer_winners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_winners TO authenticated;
GRANT ALL ON public.offer_winners TO service_role;

ALTER TABLE public.offer_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view winners of offers with show_winners"
ON public.offer_winners FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND o.show_winners = true AND announced = true)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins manage winners"
ON public.offer_winners FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX offer_winners_offer_idx ON public.offer_winners(offer_id, rank);
