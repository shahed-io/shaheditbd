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

const KEY = 'paypal_pgw_config';

const cfgSchema = z.object({
  mode: z.enum(['sandbox', 'live']),
  client_id: z.string().trim().max(200),
  client_secret: z.string().trim().max(500),
  webhook_id: z.string().trim().max(200),
  currency: z.string().trim().min(3).max(3),
  is_active: z.boolean(),
});
type PayPalCfg = z.infer<typeof cfgSchema>;

const DEFAULT_CFG: PayPalCfg = {
  mode: 'sandbox',
  client_id: '',
  client_secret: '',
  webhook_id: '',
  currency: 'USD',
  is_active: true,
};

export default function AdminPayPalPGW() {
  const qc = useQueryClient();
  const [form, setForm] = useState<PayPalCfg>(DEFAULT_CFG);
  const [showSecrets, setShowSecrets] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['paypal-pgw-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings').select('value').eq('key', KEY).maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_CFG, ...JSON.parse(data.value) } as PayPalCfg; }
        catch { return DEFAULT_CFG; }
      }
      return DEFAULT_CFG;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async (cfg: PayPalCfg) => {
      const parsed = cfgSchema.parse(cfg);
      const { error } = await supabase.from('site_settings').upsert(
        { key: KEY, value: JSON.stringify(parsed), category: 'payments' },
        { onConflict: 'key' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('PayPal configuration saved');
      qc.invalidateQueries({ queryKey: ['paypal-pgw-config'] });
      try {
        const bc = new BroadcastChannel('paypal-pgw-config-update');
        bc.postMessage('updated');
        bc.close();
      } catch { /* Safari fallback */ }
    },
    onError: (e: any) => toast.error(e.message || 'Save failed'),
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-webhook`;

  const copyWebhook = async () => {
    try { await navigator.clipboard.writeText(webhookUrl); toast.success('Webhook URL copied'); }
    catch { toast.error('Copy failed'); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const isLive = form.mode === 'live';

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" /> PayPal Gateway
          </h1>
          <p className="text-sm text-muted-foreground">Configure PayPal Checkout (Sandbox / Live)</p>
        </div>
        <Badge variant={form.is_active ? 'default' : 'secondary'}>
          {form.is_active ? 'ACTIVE' : 'DISABLED'} · {form.mode.toUpperCase()}
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
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Add this URL in your PayPal Developer Dashboard → App → Webhooks. Subscribe to events:
            <code className="ml-1 text-xs">CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.REFUNDED, PAYMENT.CAPTURE.DENIED</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={webhookUrl} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copyWebhook}><Copy className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" asChild>
              <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable PayPal</Label>
              <p className="text-xs text-muted-foreground">Show PayPal at checkout</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mode</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={form.mode === 'sandbox' ? 'default' : 'outline'} onClick={() => setForm({ ...form, mode: 'sandbox' })} className="flex-1">Sandbox</Button>
                <Button variant={form.mode === 'live' ? 'default' : 'outline'} onClick={() => setForm({ ...form, mode: 'live' })} className="flex-1">Live</Button>
              </div>
            </div>
            <div>
              <Label>Currency (3-letter ISO)</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} />
              <p className="text-xs text-muted-foreground mt-1">PayPal charges in this currency. BDT is auto-converted.</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Show secret values</Label>
            <Button variant="ghost" size="sm" onClick={() => setShowSecrets(s => !s)}>
              {showSecrets ? <><EyeOff className="w-4 h-4 mr-1" />Hide</> : <><Eye className="w-4 h-4 mr-1" />Show</>}
            </Button>
          </div>

          <div>
            <Label>Client ID</Label>
            <Input type={showSecrets ? 'text' : 'password'} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} placeholder="Axxx..." />
          </div>
          <div>
            <Label>Client Secret</Label>
            <Input type={showSecrets ? 'text' : 'password'} value={form.client_secret} onChange={(e) => setForm({ ...form, client_secret: e.target.value })} placeholder="Exxx..." />
          </div>
          <div>
            <Label>Webhook ID</Label>
            <Input type={showSecrets ? 'text' : 'password'} value={form.webhook_id} onChange={(e) => setForm({ ...form, webhook_id: e.target.value })} placeholder="From PayPal → App → Webhooks" />
            <p className="text-xs text-muted-foreground mt-1">Required to verify incoming webhook signatures.</p>
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
