CREATE POLICY "key_check_history_own_insert" ON public.key_check_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);