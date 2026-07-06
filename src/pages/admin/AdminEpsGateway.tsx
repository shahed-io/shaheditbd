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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, Save, ShieldCheck, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

/**
 * EPS (Easy Payment System — eps.com.bd) Gateway Admin Configuration
 * ------------------------------------------------------------------
 * Stores configuration in `site_settings` under key `eps_gateway_config`.
 * This is a self-contained admin setup screen. Frontend checkout integration
 * (redirect flow / IPN) will be wired up separately once the merchant
 * provides EPS API credentials & docs.
 */

const KEY = 'eps_gateway_config';

const cfgSchema = z.object({
  is_active: z.boolean(),
  mode: z.enum(['sandbox', 'live']),
  display_label: z.string().trim().max(60),
  description: z.string().trim().max(500),
  logo_url: z.string().trim().max(500),
  merchant_id: z.string().trim().max(200),
  store_id: z.string().trim().max(200),
  api_key: z.string().trim().max(500),
  api_secret: z.string().trim().max(500),
  username: z.string().trim().max(200),
  password: z.string().trim().max(500),
  sandbox_base_url: z.string().trim().max(500),
  live_base_url: z.string().trim().max(500),
  success_url: z.string().trim().max(500),
  fail_url: z.string().trim().max(500),
  cancel_url: z.string().trim().max(500),
  ipn_url: z.string().trim().max(500),
  min_amount: z.number().min(0).max(10_000_000),
  max_amount: z.number().min(0).max(10_000_000),
  instructions: z.string().trim().max(2000),
});

export type EpsCfg = z.infer<typeof cfgSchema>;

const DEFAULT_CFG: EpsCfg = {
  is_active: false,
  mode: 'sandbox',
  display_label: 'EPS (Easy Payment System)',
  description: 'Card / MFS / Bank — EPS Payment Gateway এর মাধ্যমে পেমেন্ট করুন।',
  logo_url: '',
  merchant_id: '',
  store_id: '',
  api_key: '',
  api_secret: '',
  username: '',
  password: '',
  sandbox_base_url: 'https://sandbox.eps.com.bd',
  live_base_url: 'https://api.eps.com.bd',
  success_url: '',
  fail_url: '',
  cancel_url: '',
  ipn_url: '',
  min_amount: 10,
  max_amount: 500000,
  instructions:
    'EPS পেমেন্ট গেটওয়ে সিলেক্ট করার পর আপনি EPS এর সিকিউর পেজে redirect হবেন। সেখান থেকে Card / bKash / Nagad / Bank সহ যেকোনো পদ্ধতিতে পেমেন্ট সম্পন্ন করতে পারবেন।',
};

export default function AdminEpsGateway() {
  const qc = useQueryClient();
  const [form, setForm] = useState<EpsCfg>(DEFAULT_CFG);
  const [showSecrets, setShowSecrets] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['eps-gateway-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      if (error) throw error;
      if (data?.value) {
        try { return { ...DEFAULT_CFG, ...JSON.parse(data.value) } as EpsCfg; }
        catch { return DEFAULT_CFG; }
      }
      return DEFAULT_CFG;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  // Auto-fill URLs from current origin on first load if empty
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setForm(prev => {
      const origin = window.location.origin;
      return {
        ...prev,
        success_url: prev.success_url || `${origin}/checkout/success`,
        fail_url: prev.fail_url || `${origin}/checkout/failed`,
        cancel_url: prev.cancel_url || `${origin}/checkout`,
        ipn_url: prev.ipn_url || `${origin}/functions/v1/eps-ipn`,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (payload: EpsCfg) => {
      const parsed = cfgSchema.safeParse(payload);
      if (!parsed.success) throw new Error('Invalid configuration');
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: KEY, value: JSON.stringify(parsed.data), category: 'payment' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('EPS configuration saved');
      qc.invalidateQueries({ queryKey: ['eps-gateway-config'] });
      try {
        const bc = new BroadcastChannel('payment-settings-update');
        bc.postMessage('eps-updated');
        bc.close();
      } catch { /* noop */ }
    },
    onError: (e: Error) => toast.error(e.message || 'Save failed'),
  });

  const set = <K extends keyof EpsCfg>(k: K, v: EpsCfg[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const secretType = showSecrets ? 'text' : 'password';
  const isLive = form.mode === 'live';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            EPS Payment Gateway
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Easy Payment System (eps.com.bd) — credentials, mode, callbacks & display.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={form.is_active ? 'default' : 'secondary'}>
            {form.is_active ? 'Enabled' : 'Disabled'}
          </Badge>
          <Badge variant={isLive ? 'destructive' : 'outline'}>
            {isLive ? 'LIVE' : 'SANDBOX'}
          </Badge>
          <a
            href="https://www.eps.com.bd/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            eps.com.bd <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {isLive && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Live mode is selected. Real customer payments will be routed through EPS once enabled.
          </AlertDescription>
        </Alert>
      )}

      {/* Master switch + mode */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Status</CardTitle>
          <CardDescription>Enable/disable EPS everywhere on the checkout.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Enable EPS on Checkout</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Off = customers won't see EPS as a payment option.
              </p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
          </div>
          <div className="space-y-2">
            <Label>Environment Mode</Label>
            <Select value={form.mode} onValueChange={v => set('mode', v as 'sandbox' | 'live')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Active base URL: <code className="text-[11px]">{isLive ? form.live_base_url : form.sandbox_base_url}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>API Credentials</CardTitle>
            <CardDescription>Provided by EPS after merchant approval.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowSecrets(s => !s)}>
            {showSecrets ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSecrets ? 'Hide' : 'Show'}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Merchant ID</Label>
            <Input value={form.merchant_id} onChange={e => set('merchant_id', e.target.value)} placeholder="e.g. MER123456" />
          </div>
          <div className="space-y-2">
            <Label>Store ID</Label>
            <Input value={form.store_id} onChange={e => set('store_id', e.target.value)} placeholder="e.g. shahedstore" />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={form.username} onChange={e => set('username', e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type={secretType} value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>API Key</Label>
            <Input type={secretType} value={form.api_key} onChange={e => set('api_key', e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>API Secret</Label>
            <Input type={secretType} value={form.api_secret} onChange={e => set('api_secret', e.target.value)} autoComplete="off" />
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Base URLs from EPS integration docs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Sandbox Base URL</Label>
            <Input value={form.sandbox_base_url} onChange={e => set('sandbox_base_url', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Live Base URL</Label>
            <Input value={form.live_base_url} onChange={e => set('live_base_url', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Callback URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Callback URLs</CardTitle>
          <CardDescription>These must be whitelisted in your EPS merchant portal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Success URL</Label>
            <Input value={form.success_url} onChange={e => set('success_url', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fail URL</Label>
            <Input value={form.fail_url} onChange={e => set('fail_url', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cancel URL</Label>
            <Input value={form.cancel_url} onChange={e => set('cancel_url', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>IPN / Webhook URL</Label>
            <Input value={form.ipn_url} onChange={e => set('ipn_url', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Display & limits */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout Display</CardTitle>
          <CardDescription>How customers see EPS on the checkout page.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Display Label</Label>
            <Input value={form.display_label} onChange={e => set('display_label', e.target.value)} maxLength={60} />
          </div>
          <div className="space-y-2">
            <Label>Logo URL (optional)</Label>
            <Input value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Minimum Amount (৳)</Label>
            <Input type="number" min={0} value={form.min_amount}
              onChange={e => set('min_amount', Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Maximum Amount (৳)</Label>
            <Input type="number" min={0} value={form.max_amount}
              onChange={e => set('max_amount', Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Short Description</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} maxLength={500} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Customer Instructions</Label>
            <Textarea rows={4} value={form.instructions}
              onChange={e => set('instructions', e.target.value)} maxLength={2000} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-4">
        <Button
          size="lg"
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="shadow-lg"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Configuration</>
          )}
        </Button>
      </div>
    </div>
  );
}
