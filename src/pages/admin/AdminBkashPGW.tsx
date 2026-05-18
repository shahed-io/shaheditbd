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
import { Eye, EyeOff, Save, ShieldCheck, AlertTriangle, Loader2, Plus, Trash2, FileText, Upload, ImageIcon, X } from 'lucide-react';
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
        logo_url: (next.logo_url || '').trim(),
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

      {/* ─── Customer-facing content editor ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-pink-600" />
            Checkout Display Content
          </CardTitle>
          <CardDescription>
            Customize the text shown to customers when they select "bKash (Online)" on Checkout & Quick Order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo upload */}
          <div>
            <Label>bKash Logo</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Upload a custom bKash logo (PNG/JPG/SVG, ≤2MB). Shown on Checkout & Quick Order info block. Leave empty to use the default bundled logo.
            </p>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {content.logo_url ? (
                  <img src={content.logo_url} alt="bKash logo preview" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 cursor-pointer text-sm font-medium transition-colors">
                  <Upload className="h-4 w-4" />
                  {content.logo_url ? 'Replace Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('File too large (max 2MB)');
                        return;
                      }
                      try {
                        const ext = file.name.split('.').pop() || 'png';
                        const path = `bkash-pgw/logo-${Date.now()}.${ext}`;
                        const { error: upErr } = await supabase.storage
                          .from('product-images')
                          .upload(path, file, { upsert: true, contentType: file.type });
                        if (upErr) throw upErr;
                        const { data: { publicUrl } } = supabase.storage
                          .from('product-images')
                          .getPublicUrl(path);
                        updateContent('logo_url', publicUrl);
                        toast.success('Logo uploaded — click "Save Content" to apply');
                      } catch (err: any) {
                        toast.error(err?.message || 'Upload failed');
                      }
                    }}
                  />
                </label>
                {content.logo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateContent('logo_url', '')}
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bk_title">Title</Label>
            <Input
              id="bk_title"
              value={content.title}
              onChange={(e) => updateContent('title', e.target.value)}
              placeholder="bKash Online Payment (PGW)"
            />
          </div>
          <div>
            <Label htmlFor="bk_desc">Description</Label>
            <Textarea
              id="bk_desc"
              value={content.description}
              onChange={(e) => updateContent('description', e.target.value)}
              rows={3}
              placeholder="Describe the bKash Online flow…"
            />
          </div>
          <div>
            <Label htmlFor="bk_amount">Amount Line Prefix</Label>
            <Input
              id="bk_amount"
              value={content.amount_prefix}
              onChange={(e) => updateContent('amount_prefix', e.target.value)}
              placeholder="💳 মোট পরিশোধ:"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Shown on Checkout right before the total amount.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Bullet Points</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateContent('bullets', [...content.bullets, ''])}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {content.bullets.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={b}
                    onChange={(e) => {
                      const next = [...content.bullets];
                      next[i] = e.target.value;
                      updateContent('bullets', next);
                    }}
                    placeholder={`Bullet ${i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => updateContent('bullets', content.bullets.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {content.bullets.length === 0 && (
                <p className="text-xs text-muted-foreground">No bullet points — add one above.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => contentData && setContent(contentData)}
              disabled={saveContent.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={() => saveContent.mutate(content)}
              disabled={saveContent.isPending}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {saveContent.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
