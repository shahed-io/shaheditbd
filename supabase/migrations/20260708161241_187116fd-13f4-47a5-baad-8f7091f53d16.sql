
-- Blocked participants
CREATE TABLE IF NOT EXISTS public.offer_blocked_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('email','phone','facebook_id','user_id','name')),
  identifier text NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offer_blocked_lookup ON public.offer_blocked_participants(offer_id, kind, identifier);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_blocked_participants TO authenticated;
GRANT ALL ON public.offer_blocked_participants TO service_role;
ALTER TABLE public.offer_blocked_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocked participants"
  ON public.offer_blocked_participants FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Facebook comment pool
CREATE TABLE IF NOT EXISTS public.offer_facebook_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  post_url text,
  fb_comment_id text NOT NULL,
  author_id text,
  author_name text,
  message text,
  like_count integer NOT NULL DEFAULT 0,
  fb_created_time timestamptz,
  is_winner boolean NOT NULL DEFAULT false,
  winner_rank integer,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id, fb_comment_id)
);
CREATE INDEX IF NOT EXISTS offer_fb_comments_offer ON public.offer_facebook_comments(offer_id, imported_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_facebook_comments TO authenticated;
GRANT ALL ON public.offer_facebook_comments TO service_role;
ALTER TABLE public.offer_facebook_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fb comments"
  ON public.offer_facebook_comments FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Track source of a winner (submission vs facebook comment)
ALTER TABLE public.offer_winners ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'submission';
ALTER TABLE public.offer_winners ADD COLUMN IF NOT EXISTS fb_comment_id uuid REFERENCES public.offer_facebook_comments(id) ON DELETE SET NULL;
ALTER TABLE public.offer_winners ADD COLUMN IF NOT EXISTS participant_contact text;
ALTER TABLE public.offer_winners ADD COLUMN IF NOT EXISTS notes text;

-- Make submission_id nullable so FB-comment winners can be stored
ALTER TABLE public.offer_winners ALTER COLUMN submission_id DROP NOT NULL;
