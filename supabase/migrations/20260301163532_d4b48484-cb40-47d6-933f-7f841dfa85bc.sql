-- ============================================================
-- 1. Storage bucket for payment proof screenshots
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for payment-proofs bucket: users can upload their own, admins can read all
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Admins can manage payment proofs"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'payment-proofs'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- 2. Payment proofs table (links to orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,
  payment_method TEXT NOT NULL DEFAULT 'bkash',
  amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Users can submit and view their own proofs
CREATE POLICY "Users can insert own payment proofs"
  ON public.payment_proofs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can view own payment proofs"
  ON public.payment_proofs FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Admins can manage all payment proofs
CREATE POLICY "Admins can manage payment proofs"
  ON public.payment_proofs FOR ALL
  USING ( has_role(auth.uid(), 'admin'::app_role) );

-- ============================================================
-- 3. License keys vault table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  key_value TEXT NOT NULL,
  key_type TEXT NOT NULL DEFAULT 'license', -- license | credentials | activation_code
  extra_info TEXT, -- e.g. account email / password hint
  status TEXT NOT NULL DEFAULT 'available', -- available | assigned | revoked
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage the vault
CREATE POLICY "Admins can manage license keys"
  ON public.license_keys FOR ALL
  USING ( has_role(auth.uid(), 'admin'::app_role) );

-- Users can only see keys assigned to their order items
CREATE POLICY "Users can view own assigned keys"
  ON public.license_keys FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND order_item_id IN (
      SELECT oi.id FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE o.user_id = auth.uid()
      AND o.status = 'completed'
    )
  );

-- ============================================================
-- 4. Index for fast lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id ON public.payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(status);
CREATE INDEX IF NOT EXISTS idx_license_keys_product_id ON public.license_keys(product_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON public.license_keys(status);