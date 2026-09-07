
-- Allow anon/authenticated to read valid checkout tokens
CREATE POLICY "Anyone can read valid checkout tokens"
  ON public.telegram_checkout_tokens
  FOR SELECT
  TO anon, authenticated
  USING (is_used = false AND expires_at > now());

-- Allow marking tokens as used
CREATE POLICY "Anyone can mark token as used"
  ON public.telegram_checkout_tokens
  FOR UPDATE
  TO anon, authenticated
  USING (is_used = false AND expires_at > now())
  WITH CHECK (is_used = true);
