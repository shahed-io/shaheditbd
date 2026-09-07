
-- Create wallet top-up requests table
CREATE TABLE public.wallet_topup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bkash',
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_topup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own topup requests"
  ON public.wallet_topup_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own topup requests"
  ON public.wallet_topup_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all topup requests"
  ON public.wallet_topup_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_wallet_topup_requests_updated_at
  BEFORE UPDATE ON public.wallet_topup_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
