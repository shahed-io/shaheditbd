CREATE TABLE IF NOT EXISTS public.user_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  name text NOT NULL,
  category text,
  image text,
  variant text,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_cart_items_unique
  ON public.user_cart_items (user_id, product_id, COALESCE(variant, ''));

CREATE INDEX IF NOT EXISTS user_cart_items_user_idx
  ON public.user_cart_items (user_id, created_at DESC);

ALTER TABLE public.user_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart items"
  ON public.user_cart_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_cart_items_updated_at
  BEFORE UPDATE ON public.user_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();