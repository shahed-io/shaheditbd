UPDATE public.products
SET faq = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(faq::text,
  'Shahed Store', 'শাহেদ স্টোর'),
  'ShahedStore', 'শাহেদ স্টোর'),
  'shahed store', 'শাহেদ স্টোর'),
  'শাহিদ স্টোর', 'শাহেদ স্টোর'),
  'সাহেদ স্টোর', 'শাহেদ স্টোর')::jsonb
WHERE faq::text ILIKE '%shahed store%'
   OR faq::text ILIKE '%ShahedStore%'
   OR faq::text ILIKE '%শাহিদ%'
   OR faq::text ILIKE '%সাহেদ%';