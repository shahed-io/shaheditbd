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
import { Eye, EyeOff, Save, ShieldCheck, AlertTriangle, Loader2, ExternalLink, Copy } from 'lucide-react';

const KEY = 'uddoktapay_pgw_config';

const cfgSchema = z.object({
  mode: z.enum(['sandbox', 'live']),
  api_key: z.string().trim().max(500),
  base_url: z.string().trim().url().max(300),
  currency: z.string().trim().min(3).max(3),
  is_active: z.boolean(),
});
type UddoktapayCfg = z.infer<typeof cfgSchema>;

const DEFAULT_CFG: UddoktapayCfg = {
  mode: 'sandbox',
  api_key: '',
  base_url: 'https://sandbox.uddoktapay.com',
  currency: 'BDT',
  is_active: false,
};

export default function AdminUddoktapayPGW() {
  const qc = useQueryClient();
  const [form, setForm] = useState<UddoktapayCfg>(DEFAULT_CFG);
  const [showSecrets, setShowSecrets] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['uddoktapay-pgw-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings').select('value').eq('key', KEY).maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_CFG, ...JSON.parse(data.value) } as UddoktapayCfg; }
        catch { return DEFAULT_CFG; }
      }
      return DEFAULT_CFG;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async (cfg: UddoktapayCfg) => {
      const parsed = cfgSchema.parse(cfg);
      const { error } = await supabase.from('site_settings').upsert(
        { key: KEY, value: JSON.stringify(parsed), category: 'payments' },
        { onConflict: 'key' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Uddoktapay configuration saved');
      qc.invalidateQueries({ queryKey: ['uddoktapay-pgw-config'] });
      try {
        const bc = new BroadcastChannel('uddoktapay-pgw-config-update');
        bc.postMessage('updated');
        bc.close();
      } catch { /* Safari fallback */ }
    },
    onError: (e: any) => toast.error(e.message || 'Save failed'),
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uddoktapay-webhook`;
  const returnUrl = `${window.location.origin}/uddoktapay/return`;
  const cancelUrl = `${window.location.origin}/checkout?uddoktapay=cancelled`;

  const copy = async (v: string, label: string) => {
    try { await navigator.clipboard.writeText(v); toast.success(`${label} copied`); }
    catch { toast.error('Copy failed'); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const isLive = form.mode === 'live';
  const willShowAtCheckout = form.is_active && form.api_key.trim().length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6 w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" /> Uddoktapay Gateway
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure Uddoktapay (bKash / Nagad / Rocket / Card aggregator). Checkout page auto-syncs when enabled.
          </p>
        </div>
        <Badge variant={willShowAtCheckout ? 'default' : 'secondary'}>
          {willShowAtCheckout ? 'ACTIVE · SHOWING AT CHECKOUT' : 'DISABLED · HIDDEN AT CHECKOUT'} · {form.mode.toUpperCase()}
        </Badge>
      </div>

      {isLive && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>Live mode charges real customers. Verify credentials before saving.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Callback URLs</CardTitle>
          <CardDescription>
            Paste these URLs inside your Uddoktapay merchant dashboard. Webhook is used for server-side verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Webhook (IPN) URL</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={webhookUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(webhookUrl, 'Webhook')}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Return URL</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={returnUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(returnUrl, 'Return URL')}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Cancel URL</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={cancelUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(cancelUrl, 'Cancel URL')}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://uddoktapay.com/" target="_blank" rel="noreferrer">
              Open Uddoktapay Dashboard <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Checkout page will automatically show/hide Uddoktapay based on this switch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Uddoktapay</Label>
              <p className="text-xs text-muted-foreground">Show Uddoktapay at checkout (requires API key)</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mode</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={form.mode === 'sandbox' ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, mode: 'sandbox', base_url: 'https://sandbox.uddoktapay.com' })}
                  className="flex-1">Sandbox</Button>
                <Button
                  variant={form.mode === 'live' ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, mode: 'live' })}
                  className="flex-1">Live</Button>
              </div>
            </div>
            <div>
              <Label>Currency (3-letter ISO)</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} />
              <p className="text-xs text-muted-foreground mt-1">Uddoktapay typically settles in BDT.</p>
            </div>
          </div>

          <div>
            <Label>API Base URL</Label>
            <Input
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value.trim() })}
              placeholder="https://your-merchant.uddoktapay.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For live mode use the merchant URL provided by Uddoktapay (e.g. <code>https://pay.example.com</code>).
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Show secret values</Label>
            <Button variant="ghost" size="sm" onClick={() => setShowSecrets(s => !s)}>
              {showSecrets ? <><EyeOff className="w-4 h-4 mr-1" />Hide</> : <><Eye className="w-4 h-4 mr-1" />Show</>}
            </Button>
          </div>

          <div>
            <Label>API Key</Label>
            <Input
              type={showSecrets ? 'text' : 'password'}
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder="Uddoktapay API Key"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Found in Uddoktapay Dashboard → API Documentation → API Key. Sent as <code>RT-UDDOKTAPAY-API-KEY</code> header.
            </p>
          </div>

          <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="w-full md:w-auto">
            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
