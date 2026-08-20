import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DatabaseBackup, RefreshCw, Play, Pause, ShieldCheck, AlertTriangle,
  CheckCircle2, Loader2, ListChecks,
} from 'lucide-react';

type StatusResponse = {
  config?: { paused?: boolean; schema_ready?: boolean; initial_done?: boolean };
  queued?: number;
  failing?: number;
  backfill?: { done?: string[]; table?: string | null };
  logs?: { id: number; kind: string; status: string; details: Record<string, unknown>; created_at: string }[];
};

type VerifyRow = { primary: number; backup: number | null; match: boolean };

const AdminMirrorBackup = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [verifyRows, setVerifyRows] = useState<Record<string, VerifyRow> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const call = useCallback(async (action: string, silent = false) => {
    const { data, error } = await supabase.functions.invoke('backup-sync-worker', {
      body: { action },
    });
    if (error) {
      if (!silent) toast.error(`Sync error: ${error.message}`);
      return null;
    }
    return data as Record<string, unknown>;
  }, []);

  const loadStatus = useCallback(async (silent = true) => {
    const data = await call('status', silent);
    if (data) setStatus(data as StatusResponse);
  }, [call]);

  useEffect(() => {
    loadStatus();
    const t = setInterval(() => loadStatus(), 15000);
    return () => clearInterval(t);
  }, [loadStatus]);

  const run = async (action: string, label: string) => {
    setBusy(action);
    const data = await call(action);
    setBusy(null);
    if (data) {
      if (action === 'verify') setVerifyRows(data.tables as Record<string, VerifyRow>);
      else toast.success(`${label} completed`);
      await loadStatus();
    }
  };

  const cfg = status?.config ?? {};
  const doneCount = status?.backfill?.done?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DatabaseBackup className="h-6 w-6 text-primary" />
            Mirror Backup (Secondary Supabase)
          </h1>
          <p className="text-sm text-muted-foreground">
            Primary database stays the source of truth. Changes are replicated one-way to your own backup project.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadStatus(false)}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Replication</CardTitle></CardHeader>
          <CardContent>
            {cfg.paused
              ? <Badge variant="destructive">Paused</Badge>
              : <Badge className="bg-emerald-600">Active</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pending changes</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{status?.queued ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Retrying / failed</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-amber-600">{status?.failing ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Initial copy</CardTitle></CardHeader>
          <CardContent>
            {cfg.initial_done
              ? <Badge className="bg-emerald-600">Completed</Badge>
              : <Badge variant="secondary">{doneCount} tables done</Badge>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button disabled={!!busy} onClick={() => run('setup', 'Schema setup')}>
            {busy === 'setup' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Create structure in backup
          </Button>
          <Button disabled={!!busy} variant="secondary" onClick={() => run('backfill', 'Initial copy batch')}>
            {busy === 'backfill' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DatabaseBackup className="h-4 w-4 mr-2" />}
            Copy existing data
          </Button>
          <Button disabled={!!busy} variant="secondary" onClick={() => run('drain', 'Queue sync')}>
            {busy === 'drain' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync pending changes now
          </Button>
          <Button disabled={!!busy} variant="outline" onClick={() => run('verify', 'Verification')}>
            {busy === 'verify' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ListChecks className="h-4 w-4 mr-2" />}
            Verify record counts
          </Button>
          <Button
            disabled={!!busy}
            variant={cfg.paused ? 'default' : 'outline'}
            onClick={() => run(cfg.paused ? 'resume' : 'pause', cfg.paused ? 'Resume' : 'Pause')}
          >
            {cfg.paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {cfg.paused ? 'Resume replication' : 'Pause replication'}
          </Button>
          <Button disabled={!!busy} variant="ghost" onClick={() => run('reset-backfill', 'Full re-copy reset')}>
            Reset & re-copy everything
          </Button>
        </CardContent>
      </Card>

      {verifyRows && (
        <Card>
          <CardHeader><CardTitle className="text-base">Verification — primary vs backup</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Table</th><th>Primary</th><th>Backup</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(verifyRows)
                  .sort((a, b) => Number(a[1].match) - Number(b[1].match) || b[1].primary - a[1].primary)
                  .map(([table, r]) => (
                    <tr key={table} className="border-t border-border/50">
                      <td className="py-1.5 font-mono text-xs">{table}</td>
                      <td>{r.primary}</td>
                      <td>{r.backup ?? '—'}</td>
                      <td>
                        {r.match
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Recent sync activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(status?.logs ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
          {(status?.logs ?? []).map((l) => (
            <div key={l.id} className="flex items-start gap-3 text-sm border-b border-border/40 pb-2">
              <Badge variant={l.status === 'error' ? 'destructive' : 'secondary'}>{l.kind}</Badge>
              <span className="flex-1 font-mono text-xs break-all">{JSON.stringify(l.details)}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(l.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMirrorBackup;
