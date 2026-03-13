
-- Fix overly permissive INSERT policy on order_timeline
DROP POLICY IF EXISTS "System can insert timeline events" ON public.order_timeline;

-- Only admins can insert timeline events manually (triggers use SECURITY DEFINER so bypass RLS)
CREATE POLICY "Admins can insert timeline events"
  ON public.order_timeline FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
