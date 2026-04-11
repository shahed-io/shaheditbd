
-- Telegram cart items
CREATE TABLE public.telegram_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tg_cart_chat ON public.telegram_cart (chat_id);

ALTER TABLE public.telegram_cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.telegram_cart
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Telegram checkout tokens
CREATE TABLE public.telegram_checkout_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  chat_id text NOT NULL,
  cart_data jsonb NOT NULL DEFAULT '[]',
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tg_checkout_token ON public.telegram_checkout_tokens (token);

ALTER TABLE public.telegram_checkout_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.telegram_checkout_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon to read checkout tokens (for website checkout page)
CREATE POLICY "Anyone can read valid tokens" ON public.telegram_checkout_tokens
  FOR SELECT TO anon, authenticated
  USING (is_used = false AND expires_at > now());
