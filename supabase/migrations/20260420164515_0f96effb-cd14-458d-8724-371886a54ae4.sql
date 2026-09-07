-- Seed default Google Ads & Custom Audience config rows in site_settings
INSERT INTO public.site_settings (key, value, category) VALUES
  ('google_ads_config', '[]', 'google_ads'),
  ('google_ads_enabled', 'false', 'google_ads'),
  ('ga4_measurement_id', '', 'google_ads'),
  ('ga4_enabled', 'false', 'google_ads'),
  ('gtm_container_id', '', 'google_ads'),
  ('gtm_enabled', 'false', 'google_ads'),
  ('enhanced_conversions_enabled', 'false', 'google_ads'),
  ('fb_custom_audiences', '[]', 'facebook_pixel')
ON CONFLICT (key) DO NOTHING;