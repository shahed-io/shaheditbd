
-- Telegram bot polling state (singleton)
CREATE TABLE public.telegram_bot_state (
  id int PRIMARY KEY CHECK (id = 1),
  update_offset bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.telegram_bot_state FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Map Telegram message_id to order_id
CREATE TABLE public.telegram_order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_message_id bigint NOT NULL,
  telegram_chat_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_tg_msg_chat ON public.telegram_order_messages (telegram_message_id, telegram_chat_id);
CREATE INDEX idx_tg_order ON public.telegram_order_messages (order_id);

ALTER TABLE public.telegram_order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.telegram_order_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
