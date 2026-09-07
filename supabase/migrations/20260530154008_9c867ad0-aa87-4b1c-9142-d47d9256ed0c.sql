REVOKE UPDATE (
  custom_commission_percent,
  custom_customer_discount_percent,
  available_balance,
  total_earned,
  total_paid,
  total_conversions,
  total_clicks,
  status,
  referral_code,
  user_id,
  approved_at,
  approved_by,
  admin_note
) ON public.affiliate_accounts FROM authenticated;

GRANT UPDATE (
  payout_method,
  payout_account,
  payout_account_name,
  application_note,
  applicant_name,
  applicant_email,
  applicant_phone,
  website_url,
  facebook_url,
  youtube_url,
  other_social_url,
  audience_size,
  niche,
  why_join,
  promotion_strategy,
  updated_at
) ON public.affiliate_accounts TO authenticated;