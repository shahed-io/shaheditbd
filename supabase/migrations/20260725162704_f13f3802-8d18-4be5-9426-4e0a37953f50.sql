UPDATE public.site_settings
SET value = jsonb_build_array(
  jsonb_set((value::jsonb)->0, '{bgImage}', '"/__l5e/assets-v1/a24128cf-1091-4ff1-95fa-55f9fdfdefc3/banner-win11.webp"'),
  jsonb_set((value::jsonb)->1, '{bgImage}', '"/__l5e/assets-v1/a851c90c-f7a0-47e7-8a33-7e4b2cb99832/banner-ms365.webp"'),
  jsonb_set((value::jsonb)->2, '{bgImage}', '"/__l5e/assets-v1/dfbdbec7-acc4-4690-a502-eb9ec3b1b905/banner-idm.webp"')
)::text
WHERE key = 'hero_slides';