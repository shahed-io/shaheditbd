
DROP POLICY IF EXISTS "pls_public_insert" ON public.payment_link_submissions;

CREATE POLICY "pls_insert_self_or_guest"
ON public.payment_link_submissions
FOR INSERT
TO public
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.payment_links pl
    WHERE pl.id = payment_link_submissions.payment_link_id
      AND pl.status = 'active'
  )
);
