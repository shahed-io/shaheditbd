
-- Add 'delivered' and 'failed' to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'failed';

-- Create order_timeline table for order history tracking
CREATE TABLE IF NOT EXISTS public.order_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage order timeline"
  ON public.order_timeline FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order timeline"
  ON public.order_timeline FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert timeline events"
  ON public.order_timeline FOR INSERT
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON public.order_timeline(order_id);

-- Function to automatically add timeline entry on order status change
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_timeline (order_id, status, note, created_by)
    VALUES (NEW.id, NEW.status::text, 'Status changed from ' || OLD.status::text || ' to ' || NEW.status::text, 'system');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on orders table
DROP TRIGGER IF EXISTS trigger_log_order_status ON public.orders;
CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Function to log initial order creation
CREATE OR REPLACE FUNCTION public.log_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_timeline (order_id, status, note, created_by)
  VALUES (NEW.id, NEW.status::text, 'অর্ডার তৈরি হয়েছে', 'system');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_order_created ON public.orders;
CREATE TRIGGER trigger_log_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_created();
