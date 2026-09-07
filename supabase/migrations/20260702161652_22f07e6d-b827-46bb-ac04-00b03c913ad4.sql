
-- Extend offers with new fields
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS auto_publish boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_close boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_entries_per_user integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_purchase_amount numeric,
  ADD COLUMN IF NOT EXISTS referral_bonus_entries integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS winner_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS winner_selection_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS auto_notify_winners boolean NOT NULL DEFAULT true;

-- Daily analytics view
CREATE OR REPLACE VIEW public.offer_analytics_daily AS
SELECT
  offer_id,
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS entries,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_users
FROM public.offer_submissions
GROUP BY offer_id, date_trunc('day', created_at)::date;

GRANT SELECT ON public.offer_analytics_daily TO authenticated;
GRANT ALL ON public.offer_analytics_daily TO service_role;

-- Auto-publish / auto-close cron function
CREATE OR REPLACE FUNCTION public.offers_auto_status_tick()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.offers
     SET status = 'active', updated_at = now()
   WHERE auto_publish = true
     AND status = 'draft'
     AND start_at IS NOT NULL
     AND start_at <= now()
     AND (end_at IS NULL OR end_at > now());

  UPDATE public.offers
     SET status = 'closed', updated_at = now()
   WHERE auto_close = true
     AND status IN ('active','draft')
     AND end_at IS NOT NULL
     AND end_at <= now();
END;
$$;

-- Winner notification trigger
CREATE OR REPLACE FUNCTION public.notify_offer_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer RECORD;
  v_submission RECORD;
BEGIN
  SELECT * INTO v_offer FROM public.offers WHERE id = NEW.offer_id;
  IF NOT FOUND OR NOT COALESCE(v_offer.auto_notify_winners, false) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_submission FROM public.offer_submissions WHERE id = NEW.submission_id;

  -- In-app notification (if we know the user)
  IF v_submission.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, is_read)
    VALUES (
      v_submission.user_id,
      '🎉 অভিনন্দন! আপনি বিজয়ী হয়েছেন',
      'Giveaway "' || v_offer.title || '" এ আপনি ' || NEW.rank || ' নম্বর বিজয়ী হয়েছেন। পুরস্কার: ' || COALESCE(NEW.prize, 'শীঘ্রই ঘোষণা করা হবে'),
      'promo', false
    );
  END IF;

  -- Email (best-effort, non-blocking)
  IF v_submission.participant_email IS NOT NULL AND v_submission.participant_email <> '' THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/send-transactional-email',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
        ),
        body := jsonb_build_object(
          'templateName','giveaway-winner',
          'recipientEmail', v_submission.participant_email,
          'idempotencyKey', 'giveaway-winner-' || NEW.id::text,
          'templateData', jsonb_build_object(
            'name', v_submission.participant_name,
            'offerTitle', v_offer.title,
            'rank', NEW.rank,
            'prize', NEW.prize
          )
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'notify_offer_winner email failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_offer_winner ON public.offer_winners;
CREATE TRIGGER trg_notify_offer_winner
AFTER INSERT ON public.offer_winners
FOR EACH ROW EXECUTE FUNCTION public.notify_offer_winner();

-- Schedule cron every 5 minutes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'offers-auto-status-tick') THEN
    PERFORM cron.schedule('offers-auto-status-tick', '*/5 * * * *', $cron$SELECT public.offers_auto_status_tick();$cron$);
  END IF;
END $$;
