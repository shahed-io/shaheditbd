import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, Loader2, Tag, BarChart3, Settings as SettingsIcon, ShieldCheck, BookOpen, Lightbulb, AlertTriangle, CheckCircle2, Hash, Target, TrendingUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import { reloadGoogleTrackingConfig, type GoogleAdsAccount } from '@/components/store/GoogleTracking';

const newAccount = (): GoogleAdsAccount => ({
  id: crypto.randomUUID(),
  name: 'New Account',
  conversion_id: '',
  enabled: true,
  label_purchase: '',
  label_begin_checkout: '',
  label_add_to_cart: '',
  label_lead: '',
});

const AdminGoogleAds = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [ga4Id, setGa4Id] = useState('');
  const [ga4Enabled, setGa4Enabled] = useState(false);
  const [gtmId, setGtmId] = useState('');
  const [gtmEnabled, setGtmEnabled] = useState(false);
  const [enhancedConv, setEnhancedConv] = useState(false);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('site_settings').select('key,value').eq('category', 'google_ads');
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value || ''; });
    try { setAccounts(JSON.parse(map['google_ads_config'] || '[]')); } catch { setAccounts([]); }
    setAdsEnabled(map['google_ads_enabled'] === 'true');
    setGa4Id(map['ga4_measurement_id'] || '');
    setGa4Enabled(map['ga4_enabled'] === 'true');
    setGtmId(map['gtm_container_id'] || '');
    setGtmEnabled(map['gtm_enabled'] === 'true');
    setEnhancedConv(map['enhanced_conversions_enabled'] === 'true');
    setLoading(false);
  })(); }, []);

  const save = async () => {
    setSaving(true);
    const rows = [
      { key: 'google_ads_config', value: JSON.stringify(accounts), category: 'google_ads' },
      { key: 'google_ads_enabled', value: String(adsEnabled), category: 'google_ads' },
      { key: 'ga4_measurement_id', value: ga4Id.trim(), category: 'google_ads' },
      { key: 'ga4_enabled', value: String(ga4Enabled), category: 'google_ads' },
      { key: 'gtm_container_id', value: gtmId.trim(), category: 'google_ads' },
      { key: 'gtm_enabled', value: String(gtmEnabled), category: 'google_ads' },
      { key: 'enhanced_conversions_enabled', value: String(enhancedConv), category: 'google_ads' },
    ];
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('সেভ ব্যর্থ: ' + error.message); return; }
    reloadGoogleTrackingConfig();
    toast.success('Google Ads/Analytics সেটিংস সেভ হয়েছে। পেজ রিলোড করলে নতুন কনফিগ লোড হবে।');
  };

  const updateAccount = (id: string, patch: Partial<GoogleAdsAccount>) =>
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  const removeAccount = (id: string) => setAccounts(prev => prev.filter(a => a.id !== id));
  const addAccount = () => setAccounts(prev => [...prev, newAccount()]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="text-primary" /> Google Ads & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Conversion tracking, GA4, GTM ও Enhanced Conversions নিয়ন্ত্রণ করুন।</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All
        </Button>
      </div>

      <Tabs defaultValue="ads" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="ads">Google Ads</TabsTrigger>
          <TabsTrigger value="ga4">Analytics (GA4)</TabsTrigger>
          <TabsTrigger value="gtm">Tag Manager</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
        </TabsList>

        {/* GOOGLE ADS */}
        <TabsContent value="ads" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Tag size={18} /> Conversion Accounts</CardTitle>
                  <CardDescription>একাধিক Google Ads account/Conversion ID add করতে পারেন। প্রতিটার আলাদা label।</CardDescription>
                </div>
                <Switch checked={adsEnabled} onCheckedChange={setAdsEnabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {accounts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  কোনো account add করা হয়নি। নিচে "Add Account" বাটনে ক্লিক করুন।
                </div>
              )}
              {accounts.map(acc => (
                <div key={acc.id} className="border rounded-xl p-4 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={acc.name}
                      onChange={e => updateAccount(acc.id, { name: e.target.value })}
                      placeholder="Account name (e.g. Main Ads)"
                      className="font-semibold max-w-xs"
                    />
                    <div className="flex items-center gap-3">
                      <Switch checked={acc.enabled} onCheckedChange={v => updateAccount(acc.id, { enabled: v })} />
                      <Button variant="ghost" size="icon" onClick={() => removeAccount(acc.id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Conversion ID</Label>
                    <Input
                      value={acc.conversion_id}
                      onChange={e => updateAccount(acc.id, { conversion_id: e.target.value.trim() })}
                      placeholder="AW-1234567890"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Google Ads → Tools → Conversions → Tag setup → ID টি কপি করুন</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Purchase Label</Label>
                      <Input
                        value={acc.label_purchase}
                        onChange={e => updateAccount(acc.id, { label_purchase: e.target.value.trim() })}
                        placeholder="abc123XYZ"
                      />
                    </div>
                    <div>
                      <Label>Begin Checkout Label</Label>
                      <Input
                        value={acc.label_begin_checkout}
                        onChange={e => updateAccount(acc.id, { label_begin_checkout: e.target.value.trim() })}
                        placeholder="def456ABC"
                      />
                    </div>
                    <div>
                      <Label>Add to Cart Label</Label>
                      <Input
                        value={acc.label_add_to_cart}
                        onChange={e => updateAccount(acc.id, { label_add_to_cart: e.target.value.trim() })}
                        placeholder="ghi789DEF"
                      />
                    </div>
                    <div>
                      <Label>Lead/Sign Up Label</Label>
                      <Input
                        value={acc.label_lead}
                        onChange={e => updateAccount(acc.id, { label_lead: e.target.value.trim() })}
                        placeholder="jkl012GHI"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Label = AW-XXXX/<strong>LABEL</strong> অংশের শুধু LABEL part।  খালি রাখলে সেই event এই account-এ fire হবে না।
                  </p>
                </div>
              ))}
              <Button variant="outline" onClick={addAccount} className="w-full gap-2"><Plus size={16} /> Add Account</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GA4 */}
        <TabsContent value="ga4" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Analytics 4</CardTitle>
                  <CardDescription>Page views ও events GA4-এ পাঠানো হবে।</CardDescription>
                </div>
                <Switch checked={ga4Enabled} onCheckedChange={setGa4Enabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label>Measurement ID</Label>
              <Input value={ga4Id} onChange={e => setGa4Id(e.target.value)} placeholder="G-XXXXXXXXXX" />
              <p className="text-xs text-muted-foreground">GA4 → Admin → Data Streams → Web → Measurement ID</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GTM */}
        <TabsContent value="gtm" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Tag Manager</CardTitle>
                  <CardDescription>Container ID দিন — GTM-এ আপনি নিজে tags manage করবেন। dataLayer auto-push হয়।</CardDescription>
                </div>
                <Switch checked={gtmEnabled} onCheckedChange={setGtmEnabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label>GTM Container ID</Label>
              <Input value={gtmId} onChange={e => setGtmId(e.target.value)} placeholder="GTM-XXXXXXX" />
              <p className="text-xs text-muted-foreground">tagmanager.google.com → আপনার container → Container ID</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENHANCED CONVERSIONS */}
        <TabsContent value="enhanced" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck size={18} /> Enhanced Conversions</CardTitle>
                  <CardDescription>হ্যাশড email/phone Google-কে পাঠিয়ে conversion accuracy বাড়ান (privacy-safe SHA-256)।</CardDescription>
                </div>
                <Switch checked={enhancedConv} onCheckedChange={setEnhancedConv} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
                <p className="font-semibold">কীভাবে কাজ করে:</p>
                <ul className="list-disc ml-5 space-y-1 text-muted-foreground text-xs">
                  <li>Checkout/signup-এ entered email ও phone client-side SHA-256 hash হয়</li>
                  <li>Plain text কখনো server-এ যায় না — শুধু hash পাঠানো হয়</li>
                  <li>Google Ads conversions আরো accurate match হয়</li>
                  <li>প্রথমে Google Ads dashboard-এ Enhanced Conversions enable করতে হবে</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGoogleAds;
