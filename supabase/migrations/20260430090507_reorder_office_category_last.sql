-- Move Office category to the end of the list
UPDATE public.categories SET sort_order = 99 WHERE slug = 'office';
