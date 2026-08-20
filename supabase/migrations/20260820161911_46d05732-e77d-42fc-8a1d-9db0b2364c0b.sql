-- =========================================================
-- BACKUP REPLICATION LAYER (primary stays source of truth)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.backup_sync_queue (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  pk_text TEXT NOT NULL,
  op TEXT NOT NULL,
  row_data JSONB,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (table_name, pk_text)
);
CREATE INDEX IF NOT EXISTS backup_sync_queue_ready_idx ON public.backup_sync_queue (next_retry_at, id);

CREATE TABLE IF NOT EXISTS public.backup_sync_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backup_sync_log (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS backup_sync_log_created_idx ON public.backup_sync_log (created_at DESC);

GRANT ALL ON public.backup_sync_queue TO service_role;
GRANT ALL ON public.backup_sync_state TO service_role;
GRANT ALL ON public.backup_sync_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.backup_sync_queue_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.backup_sync_log_id_seq TO service_role;
GRANT SELECT ON public.backup_sync_queue TO authenticated;
GRANT SELECT ON public.backup_sync_state TO authenticated;
GRANT SELECT ON public.backup_sync_log TO authenticated;

ALTER TABLE public.backup_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup queue" ON public.backup_sync_queue
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view backup state" ON public.backup_sync_state
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view backup log" ON public.backup_sync_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------
-- Generic, failure-proof change recorder
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backup_enqueue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cols TEXT[];
  v_row JSONB;
  v_pk TEXT;
BEGIN
  BEGIN
    IF TG_OP = 'DELETE' THEN v_row := to_jsonb(OLD); ELSE v_row := to_jsonb(NEW); END IF;

    SELECT array_agg(a.attname ORDER BY k.ord)
      INTO v_cols
      FROM pg_index i
      JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
     WHERE i.indrelid = TG_RELID AND i.indisprimary;

    IF v_cols IS NULL THEN
      v_pk := md5(v_row::text);
    ELSE
      SELECT string_agg(coalesce(v_row->>c, ''), '|') INTO v_pk FROM unnest(v_cols) AS c;
    END IF;

    INSERT INTO public.backup_sync_queue (table_name, pk_text, op, row_data)
    VALUES (TG_TABLE_NAME, v_pk, TG_OP, CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE v_row END)
    ON CONFLICT (table_name, pk_text) DO UPDATE
      SET op = EXCLUDED.op,
          row_data = EXCLUDED.row_data,
          created_at = now(),
          attempts = 0,
          next_retry_at = now(),
          last_error = NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- never block primary writes
  END;
  RETURN NULL;
END;
$$;

-- ---------------------------------------------------------
-- Attach recorder to every application table
-- ---------------------------------------------------------
DO $do$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
       AND c.relname NOT IN ('backup_sync_queue','backup_sync_state','backup_sync_log')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zz_backup_sync ON public.%I', t.relname);
    EXECUTE format(
      'CREATE TRIGGER zz_backup_sync AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.backup_enqueue()',
      t.relname);
  END LOOP;
END
$do$;

-- ---------------------------------------------------------
-- Schema snapshot for recreating structure in backup project
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backup_schema_snapshot()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'enums', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('name', tn, 'labels', labels)), '[]'::jsonb)
      FROM (
        SELECT t.typname AS tn, jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          JOIN pg_enum e ON e.enumtypid = t.oid
         WHERE n.nspname = 'public'
         GROUP BY t.typname
      ) q
    ),
    'tables', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
               'name', tname,
               'columns', cols,
               'pk', pk
             ) ORDER BY tname), '[]'::jsonb)
      FROM (
        SELECT c.relname AS tname,
          (SELECT jsonb_agg(jsonb_build_object(
                    'name', a.attname,
                    'type', format_type(a.atttypid, a.atttypmod),
                    'notnull', false
                  ) ORDER BY a.attnum)
             FROM pg_attribute a
            WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) AS cols,
          (SELECT coalesce(jsonb_agg(a2.attname ORDER BY k.ord), '[]'::jsonb)
             FROM pg_index i
             JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
             JOIN pg_attribute a2 ON a2.attrelid = i.indrelid AND a2.attnum = k.attnum
            WHERE i.indrelid = c.oid AND i.indisprimary) AS pk
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
          AND c.relname NOT IN ('backup_sync_queue','backup_sync_state','backup_sync_log')
      ) q
    )
  );
$$;

REVOKE ALL ON FUNCTION public.backup_schema_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_schema_snapshot() TO service_role;

-- ---------------------------------------------------------
-- Row counts for verification
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backup_table_counts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record; out jsonb := '{}'::jsonb; n bigint;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n2 ON n2.oid = c.relnamespace
     WHERE n2.nspname = 'public' AND c.relkind = 'r'
       AND c.relname NOT IN ('backup_sync_queue','backup_sync_state','backup_sync_log')
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', r.relname) INTO n;
    out := out || jsonb_build_object(r.relname, n);
  END LOOP;
  RETURN out;
END;
$$;

REVOKE ALL ON FUNCTION public.backup_table_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_table_counts() TO service_role;

INSERT INTO public.backup_sync_state (key, value)
VALUES ('config', jsonb_build_object('paused', false, 'schema_ready', false, 'initial_done', false))
ON CONFLICT (key) DO NOTHING;