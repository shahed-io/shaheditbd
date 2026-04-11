-- 1. Revoke column-level access for cost_price and download_link from public roles
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;
REVOKE SELECT (download_link) ON public.products FROM anon, authenticated;

-- 2. Fix refund-screenshots storage policies
DROP POLICY IF EXISTS "Anyone can upload refund screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view refund screenshots" ON storage.objects;

CREATE POLICY "Authenticated users can upload refund screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'refund-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own refund screenshots or admin"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'refund-screenshots'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- 3. Remove orders and order_items from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.order_items;
  END IF;
END $$;

-- 4. Fix chat_conversations overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert chat conversations" ON public.chat_conversations;
CREATE POLICY "Anyone can insert chat conversations"
ON public.chat_conversations FOR INSERT
TO public
WITH CHECK (
  length(user_message) > 0 AND length(user_message) <= 2000
  AND length(ai_response) > 0 AND length(ai_response) <= 10000
  AND length(session_id) > 0 AND length(session_id) <= 200
);