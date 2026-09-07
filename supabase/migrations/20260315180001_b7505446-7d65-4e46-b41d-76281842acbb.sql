CREATE TABLE public.software_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  download_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.software_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active software downloads"
  ON public.software_downloads FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage software downloads"
  ON public.software_downloads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public)
VALUES ('software-images', 'software-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view software images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'software-images');

CREATE POLICY "Admins can upload software images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'software-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update software images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'software-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete software images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'software-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_software_downloads_updated_at
  BEFORE UPDATE ON public.software_downloads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();