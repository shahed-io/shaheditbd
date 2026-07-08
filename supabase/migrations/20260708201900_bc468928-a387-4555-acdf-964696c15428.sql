-- Lock down participant_contact (PII) on offer_winners for public reads.
-- Non-admins may only read safe columns via the base table or offer_winners_public view.
REVOKE SELECT ON public.offer_winners FROM anon, authenticated;

GRANT SELECT (
  id, offer_id, submission_id, rank, prize, selected_by, announced,
  ai_reason, created_at, participant_name, source, fb_comment_id, notes
) ON public.offer_winners TO anon, authenticated;

-- Admins keep full access via the admin_offer_winners SECURITY DEFINER view
-- (gated by has_role), and via the base-table "Admins manage winners" policy
-- combined with GRANT ALL to service_role which already exists.
GRANT ALL ON public.offer_winners TO service_role;