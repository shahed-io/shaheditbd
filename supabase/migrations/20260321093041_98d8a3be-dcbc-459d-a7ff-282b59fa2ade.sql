
-- Create public bucket for refund screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('refund-screenshots', 'refund-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload screenshots (for refund requests, no login required)
CREATE POLICY "Anyone can upload refund screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'refund-screenshots');

-- Anyone can view refund screenshots (public bucket)
CREATE POLICY "Anyone can view refund screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'refund-screenshots');

-- Anyone can delete refund screenshots
CREATE POLICY "Anyone can delete refund screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'refund-screenshots');
