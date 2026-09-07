DROP POLICY IF EXISTS "Anyone can insert abandoned checkout" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can update abandoned checkout" ON public.abandoned_checkouts;

CREATE POLICY "Public can insert abandoned checkout"
ON public.abandoned_checkouts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update abandoned checkout"
ON public.abandoned_checkouts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can read own abandoned checkout by session"
ON public.abandoned_checkouts
FOR SELECT
TO anon, authenticated
USING (true);

NOTIFY pgrst, 'reload schema';