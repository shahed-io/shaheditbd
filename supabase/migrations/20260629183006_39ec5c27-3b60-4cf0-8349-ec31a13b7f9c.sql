UPDATE public.products
SET faq = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(faq::text,
  'Shahed Store', 'Shahed Store'),
  'ShahedStore', 'Shahed Store'),
  'shahed store', 'Shahed Store'),
  'শাহিদ স্টোর', 'Shahed Store'),
  'সাহেদ স্টোর', 'Shahed Store')::jsonb
WHERE faq::text ILIKE '%shahed store%'
   OR faq::text ILIKE '%ShahedStore%'
   OR faq::text ILIKE '%শাহিদ%'
   OR faq::text ILIKE '%সাহেদ%';