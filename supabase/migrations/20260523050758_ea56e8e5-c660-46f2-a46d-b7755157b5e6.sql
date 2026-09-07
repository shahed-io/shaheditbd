
CREATE TABLE public.payment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  product_id UUID,
  product_name TEXT NOT NULL,
  product_image TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  original_amount NUMERIC,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  allow_qty_change BOOLEAN NOT NULL DEFAULT false,
  payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_fields JSONB NOT NULL DEFAULT '{"name":true,"phone":true,"email":false,"address":false,"note":false}'::jsonb,
  custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired')),
  redirect_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_links_slug ON public.payment_links(slug);
CREATE INDEX idx_payment_links_status ON public.payment_links(status);
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_public_select_active" ON public.payment_links FOR SELECT USING (status = 'active');
CREATE POLICY "pl_admin_all" ON public.payment_links FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_payment_links_updated_at BEFORE UPDATE ON public.payment_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_link_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
  link_slug TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  product_id UUID,
  product_name TEXT NOT NULL,
  product_image TEXT,
  amount NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  sender_number TEXT,
  payment_screenshot_url TEXT,
  custom_field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','converted')),
  admin_note TEXT,
  order_id UUID,
  order_number TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pls_status ON public.payment_link_submissions(status);
CREATE INDEX idx_pls_link ON public.payment_link_submissions(payment_link_id);
CREATE INDEX idx_pls_created ON public.payment_link_submissions(created_at DESC);
ALTER TABLE public.payment_link_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pls_public_insert" ON public.payment_link_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "pls_admin_all" ON public.payment_link_submissions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pls_public_select" ON public.payment_link_submissions FOR SELECT USING (true);
CREATE TRIGGER update_pls_updated_at BEFORE UPDATE ON public.payment_link_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='pp_public_read') THEN
    CREATE POLICY "pp_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='pp_public_insert') THEN
    CREATE POLICY "pp_public_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='pp_admin_all') THEN
    CREATE POLICY "pp_admin_all" ON storage.objects FOR ALL USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
