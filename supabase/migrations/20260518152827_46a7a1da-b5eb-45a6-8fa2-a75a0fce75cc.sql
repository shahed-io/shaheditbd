
-- Insert default bKash PGW config (admin-only via category='private')
INSERT INTO public.site_settings (key, value, category)
VALUES (
  'bkash_pgw_config',
  jsonb_build_object(
    'mode', 'sandbox',
    'app_key', '',
    'app_secret', '',
    'username', '',
    'password', '',
    'is_active', true
  )::text,
  'private'
)
ON CONFLICT (key) DO NOTHING;
