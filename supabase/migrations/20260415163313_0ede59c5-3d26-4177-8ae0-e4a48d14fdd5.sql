
CREATE TABLE public.welcome_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  visitor_id text NOT NULL,
  used_by_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_welcome_coupons_visitor ON public.welcome_coupons(visitor_id);
CREATE INDEX idx_welcome_coupons_code ON public.welcome_coupons(code);
CREATE INDEX idx_welcome_coupons_expires ON public.welcome_coupons(expires_at);

ALTER TABLE public.welcome_coupons ENABLE ROW LEVEL SECURITY;

-- Service role full access (edge functions)
CREATE POLICY "Service role full access on welcome_coupons"
  ON public.welcome_coupons
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anyone can read by code (for validation at checkout)
CREATE POLICY "Anyone can read welcome coupons by code"
  ON public.welcome_coupons
  FOR SELECT
  USING (true);
