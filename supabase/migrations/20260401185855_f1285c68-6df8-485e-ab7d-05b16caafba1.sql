
CREATE TABLE public.personal_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  key_value TEXT,
  password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  customer_name TEXT,
  customer_phone TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage personal licenses"
ON public.personal_licenses
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
