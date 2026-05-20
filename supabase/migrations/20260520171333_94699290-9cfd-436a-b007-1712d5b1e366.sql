
-- Fix unique constraint so PostgREST onConflict works
ALTER TABLE public.user_cart_items
  ALTER COLUMN variant SET DEFAULT '';

UPDATE public.user_cart_items SET variant = '' WHERE variant IS NULL;

ALTER TABLE public.user_cart_items
  ALTER COLUMN variant SET NOT NULL;

DROP INDEX IF EXISTS public.user_cart_items_unique;

ALTER TABLE public.user_cart_items
  DROP CONSTRAINT IF EXISTS user_cart_items_user_product_variant_key;

ALTER TABLE public.user_cart_items
  ADD CONSTRAINT user_cart_items_user_product_variant_key
  UNIQUE (user_id, product_id, variant);
