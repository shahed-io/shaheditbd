
CREATE TABLE public.abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  user_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  coupon_code TEXT,
  payment_method TEXT,
  notes TEXT,
  page_url TEXT,
  user_agent TEXT,
  converted BOOLEAN NOT NULL DEFAULT false,
  converted_order_id UUID,
  converted_at TIMESTAMPTZ,
  contacted BOOLEAN NOT NULL DEFAULT false,
  contacted_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_abandoned_checkouts_created ON public.abandoned_checkouts(created_at DESC);
CREATE INDEX idx_abandoned_checkouts_converted ON public.abandoned_checkouts(converted);
CREATE INDEX idx_abandoned_checkouts_email ON public.abandoned_checkouts(customer_email);
CREATE INDEX idx_abandoned_checkouts_phone ON public.abandoned_checkouts(customer_phone);

ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert abandoned checkout"
ON public.abandoned_checkouts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update abandoned checkout"
ON public.abandoned_checkouts FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view abandoned checkouts"
ON public.abandoned_checkouts FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins can delete abandoned checkouts"
ON public.abandoned_checkouts FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_abandoned_checkouts_updated
BEFORE UPDATE ON public.abandoned_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
