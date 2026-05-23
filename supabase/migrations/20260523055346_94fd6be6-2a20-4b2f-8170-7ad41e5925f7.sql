-- Add user_id link from payment_link_submissions for dashboard tracking
ALTER TABLE public.payment_link_submissions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pls_user_id ON public.payment_link_submissions(user_id);

-- Allow the submitting user to view their own submissions
DROP POLICY IF EXISTS "pls_user_own_select" ON public.payment_link_submissions;
CREATE POLICY "pls_user_own_select"
ON public.payment_link_submissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());