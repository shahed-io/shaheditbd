CREATE TABLE public.key_check_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_value text NOT NULL,
  status text NOT NULL,
  error_code text,
  product text,
  sub_type text,
  act_type text,
  remaining text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_key_check_history_user ON public.key_check_history(user_id, created_at DESC);

ALTER TABLE public.key_check_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own key checks"
  ON public.key_check_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all key checks"
  ON public.key_check_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));