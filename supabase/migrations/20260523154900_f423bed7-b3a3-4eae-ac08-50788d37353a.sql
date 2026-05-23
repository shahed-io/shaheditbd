
CREATE TABLE IF NOT EXISTS public.product_content_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  description text,
  faq jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcb_product_created
  ON public.product_content_backups (product_id, created_at DESC);

ALTER TABLE public.product_content_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view product content backups"
  ON public.product_content_backups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert product content backups"
  ON public.product_content_backups FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete product content backups"
  ON public.product_content_backups FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
