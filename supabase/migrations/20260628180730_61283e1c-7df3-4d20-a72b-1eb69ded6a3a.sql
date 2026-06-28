
ALTER TABLE public.offer_winners ADD COLUMN IF NOT EXISTS participant_name TEXT;

UPDATE public.offer_winners w
SET participant_name = s.participant_name
FROM public.offer_submissions s
WHERE w.submission_id = s.id AND w.participant_name IS NULL;
