CREATE TABLE public.backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  label text NOT NULL,
  tables text[] NOT NULL DEFAULT '{}',
  records integer NOT NULL DEFAULT 0,
  files integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error text,
  note text,
  snapshot jsonb,
  snapshot_rows integer NOT NULL DEFAULT 0,
  reverted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_history TO authenticated;
GRANT ALL ON public.backup_history TO service_role;

ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup history"
ON public.backup_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert backup history"
ON public.backup_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update backup history"
ON public.backup_history FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backup history"
ON public.backup_history FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_backup_history_created_at ON public.backup_history (created_at DESC);