CREATE POLICY "Users delete own key checks"
ON public.key_check_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);