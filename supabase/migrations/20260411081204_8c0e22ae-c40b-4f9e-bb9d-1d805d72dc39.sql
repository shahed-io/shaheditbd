
ALTER TABLE public.telegram_bot_state DROP CONSTRAINT telegram_bot_state_id_check;

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (2, 0)
ON CONFLICT (id) DO NOTHING;
