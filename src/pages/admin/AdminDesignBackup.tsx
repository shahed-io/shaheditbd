import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Palette, Download, Upload, RotateCcw, Save, Camera, Trash2, History, Loader2,
} from 'lucide-react';
import {
  ADMIN_DESIGN_KEY, ADMIN_DESIGN_SNAPSHOTS_KEY, ADMIN_TOKENS, TOKEN_GROUPS,
  AdminDesignConfig, DEFAULT_ADMIN_DESIGN, DesignBackupFile,
  applyAdminDesign, isDesignBackupFile, mergeDesign,
} from '@/lib/adminDesign';
import { useAdminDesign } from '@/hooks/useAdminDesign';

/** site_settings keys captured together with the admin design. */
const CAPTURED_KEYS = ['site_theme', 'invoice_design'];

type Snapshot = { id: string; name: string; created_at: string; payload: DesignBackupFile };

const hslToHex = (hsl: string): string => {
  const m = hsl.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return '#000000';
  const h = parseFloat(m[1]) / 360, s = parseFloat(m[2]) / 100, l = parseFloat(m[3]) / 100;
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * v).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex: string): string => {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const AdminDesignBackup = () => {
  const { config, save, refresh } = useAdminDesign();
  const [draft, setDraft] = useState<AdminDesignConfig>(config);
  const [busy, setBusy] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapName, setSnapName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(config); }, [config]);

  // Live preview of unsaved edits
  useEffect(() => { applyAdminDesign(draft); }, [draft]);

  const loadSnapshots = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings').select('value').eq('key', ADMIN_DESIGN_SNAPSHOTS_KEY).maybeSingle();
    const list = Array.isArray(data?.value) ? (data!.value as unknown as Snapshot[]) : [];
    setSnapshots(list);
  }, []);
  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  const tokenValue = (name: string) =>
    draft.tokens[name] ?? ADMIN_TOKENS.find(t => t.name === name)!.value;

  const setToken = (name: string, value: string) => {
    const def = ADMIN_TOKENS.find(t => t.name === name)!;
    setDraft(d => {
      const tokens = { ...d.tokens };
      if (value.trim() === def.value) delete tokens[name];
      else tokens[name] = value;
      return { ...d, tokens };
    });
  };

  const buildBackup = async (): Promise<DesignBackupFile> => {
    const { data } = await supabase
      .from('site_settings').select('key, value, category').in('key', CAPTURED_KEYS);
    const settings = (data ?? []) as { key: string; value: unknown; category: string | null }[];
    return {
      type: 'shahed-store-admin-design',
      version: 1,
      exported_at: new Date().toISOString(),
      design: mergeDesign(draft),
      theme: (settings.find(s => s.key === 'site_theme')?.value as string) ?? null,
      settings,
    };
  };

  const handleSave = async () => {
    setBusy('save');
    try {
      await save(draft);
      toast.success('Admin design saved');
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    }
    setBusy(null);
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const backup = await buildBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-design-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup file downloaded');
    } catch (e) {
      toast.error(`Export failed: ${(e as Error).message}`);
    }
    setBusy(null);
  };

  const restore = async (backup: DesignBackupFile) => {
    await save(backup.design);
    const rows = (backup.settings ?? []).filter(s => CAPTURED_KEYS.includes(s.key));
    if (rows.length) {
      const { error } = await supabase.from('site_settings').upsert(
        rows.map(r => ({ key: r.key, value: r.value as never, category: r.category ?? 'appearance' })),
        { onConflict: 'key' },
      );
      if (error) throw error;
    }
    if (backup.theme) {
      document.documentElement.setAttribute('data-theme', backup.theme);
      localStorage.setItem('site_theme', backup.theme);
    }
    await refresh();
  };

  const handleImportFile = async (file: File) => {
    setBusy('import');
    try {
      const parsed = JSON.parse(await file.text());
      if (!isDesignBackupFile(parsed)) throw new Error('Not a valid admin design backup file');
      await restore(parsed);
      toast.success('Admin design restored from file');
    } catch (e) {
      toast.error(`Import failed: ${(e as Error).message}`);
    }
    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const persistSnapshots = async (list: Snapshot[]) => {
    const { error } = await supabase.from('site_settings').upsert(
      { key: ADMIN_DESIGN_SNAPSHOTS_KEY, value: list as never, category: 'appearance' },
      { onConflict: 'key' },
    );
    if (error) throw error;
    setSnapshots(list);
  };

  const handleSnapshot = async () => {
    setBusy('snapshot');
    try {
      const backup = await buildBackup();
      const snap: Snapshot = {
        id: crypto.randomUUID(),
        name: snapName.trim() || `Snapshot ${new Date().toLocaleString()}`,
        created_at: new Date().toISOString(),
        payload: backup,
      };
      await persistSnapshots([snap, ...snapshots].slice(0, 20));
      setSnapName('');
      toast.success('Snapshot saved to the database');
    } catch (e) {
      toast.error(`Snapshot failed: ${(e as Error).message}`);
    }
    setBusy(null);
  };

  const handleRestoreSnapshot = async (snap: Snapshot) => {
    setBusy(snap.id);
    try {
      await restore(snap.payload);
      toast.success(`Restored "${snap.name}"`);
    } catch (e) {
      toast.error(`Restore failed: ${(e as Error).message}`);
    }
    setBusy(null);
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await persistSnapshots(snapshots.filter(s => s.id !== id));
      toast.success('Snapshot deleted');
    } catch (e) {
      toast.error(`Delete failed: ${(e as Error).message}`);
    }
  };

  const handleReset = async () => {
    setBusy('reset');
    try {
      await save(DEFAULT_ADMIN_DESIGN);
      setDraft(DEFAULT_ADMIN_DESIGN);
      toast.success('Admin design reset to defaults');
    } catch (e) {
      toast.error(`Reset failed: ${(e as Error).message}`);
    }
    setBusy(null);
  };

  const changedCount = Object.keys(draft.tokens).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Design Backup &amp; Restore</h1>
            <p className="text-sm text-muted-foreground">
              Export, import and roll back the complete admin panel look — colours, shape, depth,
              gradients, layout switches and custom CSS.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!!busy} onClick={handleExport}>
            {busy === 'export' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export JSON
          </Button>
          <Button variant="outline" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {busy === 'import' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Import JSON
          </Button>
          <Button disabled={!!busy} onClick={handleSave}>
            {busy === 'save' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save &amp; Apply
          </Button>
          <input
            ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Snapshots
            <Badge variant="secondary">{snapshots.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              value={snapName} onChange={e => setSnapName(e.target.value)}
              placeholder="Snapshot name (optional)" className="max-w-xs"
            />
            <Button variant="secondary" disabled={!!busy} onClick={handleSnapshot}>
              {busy === 'snapshot' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              Save snapshot
            </Button>
            <Button variant="ghost" disabled={!!busy} onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset to default design
            </Button>
          </div>

          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snapshots yet.</p>
          ) : (
            <div className="space-y-2">
              {snapshots.map(s => (
                <div key={s.id} className="flex items-center gap-3 border-b border-border/50 pb-2 text-sm">
                  <History className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => handleRestoreSnapshot(s)}>
                    {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Restore'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteSnapshot(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Admin shell features</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {([
            ['animations', 'Animations & transitions'],
            ['glassSidebar', 'Glass sidebar blur'],
            ['gradientHeader', 'Gradient page header'],
            ['compactDensity', 'Compact density'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <Label htmlFor={key} className="text-sm">{label}</Label>
              <Switch
                id={key}
                checked={draft.features[key]}
                onCheckedChange={v => setDraft(d => ({ ...d, features: { ...d.features, [key]: v } }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Design tokens
            {changedCount > 0 && <Badge>{changedCount} customised</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {TOKEN_GROUPS.map(group => (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{group}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {ADMIN_TOKENS.filter(t => t.group === group).map(t => (
                  <div key={t.name} className="space-y-1.5">
                    <Label className="text-xs font-medium">{t.label}</Label>
                    <div className="flex items-center gap-2">
                      {t.kind === 'hsl' && (
                        <input
                          type="color"
                          aria-label={`${t.label} colour`}
                          value={hslToHex(tokenValue(t.name))}
                          onChange={e => setToken(t.name, hexToHsl(e.target.value))}
                          className="h-9 w-10 rounded-md border border-border bg-transparent p-0.5 cursor-pointer shrink-0"
                        />
                      )}
                      <Input
                        value={tokenValue(t.name)}
                        onChange={e => setToken(t.name, e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Custom admin CSS</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={8}
            value={draft.customCss ?? ''}
            onChange={e => setDraft(d => ({ ...d, customCss: e.target.value }))}
            placeholder="body.admin-page .admin-glass-card { border-radius: 24px; }"
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Applied inside the admin panel only and included in every backup file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDesignBackup;
