import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Eye, EyeOff, Save, ShieldCheck, AlertTriangle, Loader2, Plus, Trash2, FileText } from 'lucide-react';
import { BKASH_CONTENT_KEY, DEFAULT_BKASH_CONTENT, type BkashPgwContent } from '@/hooks/useBkashPgwContent';

const KEY = 'bkash_pgw_config';

const cfgSchema = z.object({
  mode: z.enum(['sandbox', 'live']),
  app_key: z.string().trim().max(200),
  app_secret: z.string().trim().max(500),
  username: z.string().trim().max(100),
  password: z.string().trim().max(200),
  is_active: z.boolean(),
});

type BkashCfg = z.infer<typeof cfgSchema>;

const DEFAULT_CFG: BkashCfg = {
  mode: 'sandbox',
  app_key: '',
  app_secret: '',
  username: '',
  password: '',
  is_active: true,
};

export default function AdminBkashPGW() {
  const qc = useQueryClient();
  const [form, setForm] = useState<BkashCfg>(DEFAULT_CFG);
  const [content, setContent] = useState<BkashPgwContent>(DEFAULT_BKASH_CONTENT);
  const [showSecrets, setShowSecrets] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['bkash-pgw-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      if (error) throw error;
      if (data?.value) {
        try { return { ...DEFAULT_CFG, ...JSON.parse(data.value) } as BkashCfg; }
        catch { return DEFAULT_CFG; }
      }
      return DEFAULT_CFG;
    },
  });

  const { data: contentData } = useQuery({
    queryKey: ['bkash-pgw-content-admin'],
    queryFn: async (): Promise<BkashPgwContent> => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', BKASH_CONTENT_KEY)
        .maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_BKASH_CONTENT, ...JSON.parse(data.value) }; }
        catch { return DEFAULT_BKASH_CONTENT; }
      }
      return DEFAULT_BKASH_CONTENT;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);
  useEffect(() => { if (contentData) setContent(contentData); }, [contentData]);

  const save = useMutation({
    mutationFn: async (next: BkashCfg) => {
      const parsed = cfgSchema.safeParse(next);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: KEY, value: JSON.stringify(parsed.data), category: 'private' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('bKash PGW settings saved');
      qc.invalidateQueries({ queryKey: ['bkash-pgw-config'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save'),
  });

  const saveContent = useMutation({
    mutationFn: async (next: BkashPgwContent) => {
      const cleaned: BkashPgwContent = {
        title: next.title.trim() || DEFAULT_BKASH_CONTENT.title,
        description: next.description.trim() || DEFAULT_BKASH_CONTENT.description,
        amount_prefix: next.amount_prefix.trim() || DEFAULT_BKASH_CONTENT.amount_prefix,
        bullets: next.bullets.map(b => b.trim()).filter(Boolean),
      };
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: BKASH_CONTENT_KEY, value: JSON.stringify(cleaned), category: 'public' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Checkout content saved');
      qc.invalidateQueries({ queryKey: ['bkash-pgw-content-admin'] });
      qc.invalidateQueries({ queryKey: ['bkash-pgw-content'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save'),
  });

  const update = <K extends keyof BkashCfg>(k: K, v: BkashCfg[K]) => setForm((f) => ({ ...f, [k]: v }));
  const updateContent = <K extends keyof BkashPgwContent>(k: K, v: BkashPgwContent[K]) =>
    setContent((c) => ({ ...c, [k]: v }));

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-pink-600" />
            bKash PGW Settings
          </h1>
          <p className="text-sm text-muted-foreground">Tokenized Checkout (Online Payment) configuration</p>
        </div>
        <Badge variant={form.mode === 'live' ? 'destructive' : 'secondary'} className="text-sm">
          {form.mode === 'live' ? 'LIVE MODE' : 'SANDBOX MODE'}
        </Badge>
      </div>

      {form.mode === 'live' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Live mode is active — real customer payments will be processed. Verify credentials carefully before saving.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gateway Status</CardTitle>
          <CardDescription>Toggle to enable/disable bKash Online checkout option for customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="font-medium">Enable bKash PGW</Label>
              <p className="text-xs text-muted-foreground mt-1">When off, checkout will hide the "bKash (Online)" option.</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => update('is_active', v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mode</CardTitle>
          <CardDescription>Switch between bKash sandbox (test) and live (production) APIs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="font-medium">Live Mode</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Sandbox: <code>tokenized.sandbox.bka.sh</code> · Live: <code>tokenized.pay.bka.sh</code>
              </p>
            </div>
            <Switch
              checked={form.mode === 'live'}
              onCheckedChange={(v) => update('mode', v ? 'live' : 'sandbox')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Merchant Credentials</CardTitle>
              <CardDescription>From bKash Merchant Portal → Development → API Credentials</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSecrets((s) => !s)}>
              {showSecrets ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showSecrets ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="app_key">App Key</Label>
            <Input
              id="app_key"
              type={showSecrets ? 'text' : 'password'}
              value={form.app_key}
              onChange={(e) => update('app_key', e.target.value)}
              placeholder="bKash App Key"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="app_secret">App Secret</Label>
            <Input
              id="app_secret"
              type={showSecrets ? 'text' : 'password'}
              value={form.app_secret}
              onChange={(e) => update('app_secret', e.target.value)}
              placeholder="bKash App Secret"
              autoComplete="off"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type={showSecrets ? 'text' : 'password'}
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                placeholder="Merchant Username"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showSecrets ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Merchant Password"
                autoComplete="off"
              />
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Credentials are stored encrypted at rest and only readable by admins. Edge functions
              (<code>bkash-create-payment</code>, <code>bkash-callback</code>) load these values dynamically — no redeploy needed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => data && setForm(data)} disabled={save.isPending}>Reset</Button>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="bg-pink-600 hover:bg-pink-700">
          {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
