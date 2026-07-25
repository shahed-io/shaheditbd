UPDATE public.site_settings
SET value = jsonb_build_array(
  jsonb_set((value::jsonb)->0, '{bgImage}', '"/__l5e/assets-v1/6f56c98d-a8c8-4f96-a471-6445502bd8e4/banner-win11.webp"'),
  jsonb_set((value::jsonb)->1, '{bgImage}', '"/__l5e/assets-v1/a528be01-6012-46f2-9cc9-edc9ad1652c4/banner-ms365.webp"'),
  jsonb_set((value::jsonb)->2, '{bgImage}', '"/__l5e/assets-v1/46ad73d9-6b46-437c-8bbd-bf4407cb1d69/banner-idm.webp"')
)::text
WHERE key = 'hero_slides';