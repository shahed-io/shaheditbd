-- Create public storage bucket for PDF invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access (anyone with the link can view/download)
DO $$ BEGIN
  CREATE POLICY "Public read invoices"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'invoices');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated users can upload (admin panel uses auth)
DO $$ BEGIN
  CREATE POLICY "Auth upload invoices"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'invoices');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated can update/overwrite
DO $$ BEGIN
  CREATE POLICY "Auth update invoices"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'invoices');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated can delete (cleanup)
DO $$ BEGIN
  CREATE POLICY "Auth delete invoices"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'invoices');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;