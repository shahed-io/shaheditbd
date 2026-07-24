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
import { toast } from 'sonner';
import { Eye, EyeOff, Save, ShieldCheck, AlertTriangle, Loader2, Copy, Info } from 'lucide-react';

const KEY = 'sslcommerz_pgw_config';

const cfgSchema = z.object({
  mode: z.enum(['sandbox', 'live']),
  store_id: z.string().trim().max(200),
  store_password: z.string().trim().max(500),
  is_active: z.boolean(),
});

type SslCfg = z.infer<typeof cfgSchema>;

const DEFAULT_CFG: SslCfg = {
  mode: 'sandbox',
  store_id: '',
  store_password: '',
  is_active: false,
};

export default function AdminSSLCommerzPGW() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SslCfg>(DEFAULT_CFG);
  const [showSecrets, setShowSecrets] = useState(false);

  const projectRef =
    (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ||
    ((import.meta.env.VITE_SUPABASE_URL as string | undefined)?.match(/https:\/\/([^.]+)/)?.[1] ?? '');
  const fnBase = projectRef ? `https://${projectRef}.functions.supabase.co` : '';
  const ipnUrl = `${fnBase}/sslcommerz-ipn?type=ipn`;
  const successUrl = `${fnBase}/sslcommerz-ipn?type=success`;
  const failUrl = `${fnBase}/sslcommerz-ipn?type=fail`;
  const cancelUrl = `${fnBase}/sslcommerz-ipn?type=cancel`;

  const { data, isLoading } = useQuery({
    queryKey: ['sslcommerz-pgw-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      if (error) throw error;
      if (data?.value) {
        try { return { ...DEFAULT_CFG, ...JSON.parse(data.value) } as SslCfg; }
        catch { return DEFAULT_CFG; }
      }
      return DEFAULT_CFG;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async (next: SslCfg) => {
      const parsed = cfgSchema.safeParse(next);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: KEY, value: JSON.stringify(parsed.data), category: 'private' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('SSLCommerz settings saved');
      qc.invalidateQueries({ queryKey: ['sslcommerz-pgw-config'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save'),
  });

  const update = <K extends keyof SslCfg>(k: K, v: SslCfg[K]) => setForm((f) => ({ ...f, [k]: v }));

  const copyUrl = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`${label} URL copied`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            SSLCommerz Payment Gateway
          </h1>
          <p className="text-sm text-muted-foreground">Bangladesh's leading online payment gateway (Cards, MFS, Net Banking)</p>
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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Get your credentials from <strong>SSLCommerz Merchant Panel</strong> → <em>My Store → Store Information</em>.
          Use <strong>testbox.sslcommerz.com</strong> for sandbox and <strong>securepay.sslcommerz.com</strong> for live.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Gateway Status</CardTitle>
          <CardDescription>Toggle to enable/disable SSLCommerz option at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="font-medium">Enable SSLCommerz</Label>
              <p className="text-xs text-muted-foreground mt-1">When off, checkout will hide the "SSLCommerz (Cards/MFS/Net Banking)" option.</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => update('is_active', v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mode</CardTitle>
          <CardDescription>Switch between sandbox (test) and live (production).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="font-medium">Live Mode</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Sandbox: <code>sandbox.sslcommerz.com</code> · Live: <code>securepay.sslcommerz.com</code>
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
              <CardTitle>Store Credentials</CardTitle>
              <CardDescription>From SSLCommerz Merchant Panel → My Store</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSecrets((s) => !s)}>
              {showSecrets ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showSecrets ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="store_id">Store ID</Label>
            <Input
              id="store_id"
              type={showSecrets ? 'text' : 'password'}
              value={form.store_id}
              onChange={(e) => update('store_id', e.target.value)}
              placeholder="e.g. yourstore0live"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="store_password">Store Password</Label>
            <Input
              id="store_password"
              type={showSecrets ? 'text' : 'password'}
              value={form.store_password}
              onChange={(e) => update('store_password', e.target.value)}
              placeholder="SSLCommerz Store Password"
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Callback / IPN URLs</CardTitle>
          <CardDescription>Paste these into SSLCommerz Merchant Panel → My Store → IPN Settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'IPN URL', url: ipnUrl },
            { label: 'Success URL', url: successUrl },
            { label: 'Fail URL', url: failUrl },
            { label: 'Cancel URL', url: cancelUrl },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">{row.label}</p>
                <p className="text-xs font-mono break-all">{row.url || '(project URL missing)'}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => copyUrl(row.url, row.label)} disabled={!row.url}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending} size="lg">
          {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
