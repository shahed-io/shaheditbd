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
import { Eye, EyeOff, Save, ShieldCheck, AlertTriangle, Loader2, ExternalLink, Copy, Bitcoin, FlaskConical } from 'lucide-react';

const KEY = 'binance_pgw_config';

const cfgSchema = z.object({
  api_key: z.string().trim().max(500),
  api_secret: z.string().trim().max(500),
  base_url: z.string().trim().url().max(300),
  currency: z.string().trim().min(3).max(10),
  bdt_rate: z.number().positive().max(100000),
  label: z.string().trim().min(2).max(60),
  is_active: z.boolean(),
  sandbox: z.boolean(),
  sandbox_base_url: z.string().trim().url().max(300),
});
type BinanceCfg = z.infer<typeof cfgSchema>;

const DEFAULT_CFG: BinanceCfg = {
  api_key: '',
  api_secret: '',
  base_url: 'https://bpay.binanceapi.com',
  currency: 'USDT',
  bdt_rate: 120,
  label: 'Binance Pay (Crypto)',
  is_active: false,
  sandbox: false,
  sandbox_base_url: 'https://bpay.binanceapi.com',
};

export default function AdminBinancePGW() {
  const qc = useQueryClient();
  const [form, setForm] = useState<BinanceCfg>(DEFAULT_CFG);
  const [showSecrets, setShowSecrets] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['binance-pgw-config-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings').select('value').eq('key', KEY).maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_CFG, ...JSON.parse(data.value) } as BinanceCfg; }
        catch { return DEFAULT_CFG; }
      }
      return DEFAULT_CFG;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async (cfg: BinanceCfg) => {
      const parsed = cfgSchema.parse(cfg);
      const { error } = await supabase.from('site_settings').upsert(
        { key: KEY, value: JSON.stringify(parsed), category: 'payments' },
        { onConflict: 'key' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Binance Pay configuration saved');
      qc.invalidateQueries({ queryKey: ['binance-pgw-config-admin'] });
      qc.invalidateQueries({ queryKey: ['binance-pgw-config'] });
      try {
        const bc = new BroadcastChannel('binance-pgw-config-update');
        bc.postMessage('updated');
        bc.close();
      } catch { /* Safari fallback */ }
    },
    onError: (e: any) => toast.error(e.message || 'Save failed'),
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/binance-webhook`;
  const returnUrl = `${window.location.origin}/binance/return`;
  const cancelUrl = `${window.location.origin}/checkout?binance=cancelled`;

  const copy = async (v: string, label: string) => {
    try { await navigator.clipboard.writeText(v); toast.success(`${label} copied`); }
    catch { toast.error('Copy failed'); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const hasCreds = form.api_key.trim().length > 0 && form.api_secret.trim().length > 0;
  const willShowAtCheckout = form.is_active && (form.sandbox || hasCreds);
  const demoMode = form.sandbox && !hasCreds;
  const sampleBdt = 1000;

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bitcoin className="w-6 h-6 text-amber-500" /> Binance Pay Gateway
          </h1>
          <p className="text-sm text-muted-foreground">
            Automatic crypto payments (USDT / BUSD / BTC) via Binance Pay. Checkout syncs instantly when enabled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {form.sandbox && <Badge variant="outline" className="border-amber-500 text-amber-600">SANDBOX / TEST MODE</Badge>}
          <Badge variant={willShowAtCheckout ? 'default' : 'secondary'}>
            {willShowAtCheckout ? 'ACTIVE · SHOWING AT CHECKOUT' : 'DISABLED · HIDDEN AT CHECKOUT'}
          </Badge>
        </div>
      </div>

      {form.sandbox && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <FlaskConical className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Test mode is ON — no real crypto is charged.{' '}
            {demoMode
              ? 'No API credentials set, so checkout runs a fully simulated demo transaction (order becomes paid + processing after you confirm on the return page).'
              : 'Requests are sent to the sandbox API host below using your test credentials.'}
            {' '}Turn this off before going live.
          </AlertDescription>
        </Alert>
      )}

      {form.is_active && !willShowAtCheckout && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>Enabled, but API Key / Secret are missing — Binance Pay stays hidden at checkout.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Callback URLs</CardTitle>
          <CardDescription>
            Add the webhook URL in Binance Merchant Dashboard → Developers → Webhook. Payments are re-verified server-side before an order is marked paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[['Webhook URL', webhookUrl], ['Return URL', returnUrl], ['Cancel URL', cancelUrl]].map(([label, val]) => (
            <div key={label}>
              <Label className="text-xs">{label}</Label>
              <div className="flex gap-2 mt-1">
                <Input readOnly value={val} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copy(val, label)}><Copy className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" asChild>
            <a href="https://merchant.binance.com/" target="_blank" rel="noreferrer">
              Open Binance Merchant Dashboard <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Everything below is controlled from this panel — no code change required.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Binance Auto Payment</Label>
              <p className="text-xs text-muted-foreground">Show Binance Pay at checkout (requires API key & secret)</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <div>
              <Label className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-amber-600" /> Sandbox / Test Mode</Label>
              <p className="text-xs text-muted-foreground">
                Run demo transactions to verify the end-to-end flow. No real payment is taken.
              </p>
            </div>
            <Switch checked={form.sandbox} onCheckedChange={(v) => setForm({ ...form, sandbox: v })} />
          </div>

          {form.sandbox && (
            <div>
              <Label>Sandbox API Base URL</Label>
              <Input
                value={form.sandbox_base_url}
                onChange={(e) => setForm({ ...form, sandbox_base_url: e.target.value.trim() })}
                placeholder="https://bpay.binanceapi.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used only when test API credentials are filled in. Leave the credentials empty for a fully simulated demo checkout.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Checkout Label</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={60} />
            </div>
            <div>
              <Label>Crypto Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase().trim() })} maxLength={10} placeholder="USDT" />
              <p className="text-xs text-muted-foreground mt-1">USDT is recommended (stable value).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Conversion Rate (BDT per 1 {form.currency || 'USDT'})</Label>
              <Input
                type="number" min={1} step="0.01"
                value={form.bdt_rate}
                onChange={(e) => setForm({ ...form, bdt_rate: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: ৳{sampleBdt} order → {form.bdt_rate > 0 ? (sampleBdt / form.bdt_rate).toFixed(2) : '—'} {form.currency || 'USDT'}
              </p>
            </div>
            <div>
              <Label>API Base URL</Label>
              <Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value.trim() })} />
              <p className="text-xs text-muted-foreground mt-1">Default: <code>https://bpay.binanceapi.com</code></p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Show secret values</Label>
            <Button variant="ghost" size="sm" onClick={() => setShowSecrets(s => !s)}>
              {showSecrets ? <><EyeOff className="w-4 h-4 mr-1" />Hide</> : <><Eye className="w-4 h-4 mr-1" />Show</>}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>API Key (Certificate SN)</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder="Binance Pay API Key"
              />
            </div>
            <div>
              <Label>API Secret</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                value={form.api_secret}
                onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
                placeholder="Binance Pay Secret Key"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Binance Merchant Dashboard → Developers → API Key Management. Requests are signed with HMAC-SHA512.
          </p>

          <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="w-full md:w-auto">
            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
