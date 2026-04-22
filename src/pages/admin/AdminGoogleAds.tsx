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

          {/* ─────── Google Ads বিস্তারিত গাইড ─────── */}
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-6 space-y-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <BookOpen className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Google Ads সম্পূর্ণ গাইড</h3>
                <p className="text-xs text-muted-foreground">Conversion tracking সঠিকভাবে setup করার নিয়ম</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/20 border border-border/40 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Target size={14} className="text-primary" /> Conversion Tracking কী?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                আপনি Google-এ ad চালালে Google জানতে চায় কোন ad থেকে কতটা sale হলো। সেই data পাঠানোর সিস্টেমকে <strong>Conversion Tracking</strong> বলে। এতে Google smart-ভাবে campaign optimize করে — যেখানে বেশি sale হয় সেখানে বেশি ad দেখায়।
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Setup Steps</p>
              {[
                { n: '1', t: 'Google Ads-এ Conversion Action তৈরি করুন', d: 'Google Ads → Tools (🔧) → Conversions → "+ New conversion action" → Website। চারটি action তৈরি করুন: Purchase, Begin Checkout, Add to Cart, Lead।' },
                { n: '2', t: 'Conversion ID ও Label কপি করুন', d: 'প্রতিটি action তৈরির পর AW-1234567890/AbCdEfGh123 format-এ tag পাবেন। প্রথম অংশ (AW-...) Conversion ID, slash-এর পরের অংশ Label।' },
                { n: '3', t: 'উপরের form-এ যোগ করুন', d: '"Add Account" বাটনে ক্লিক করে Account name দিন, Conversion ID বসান, এবং প্রতিটি event-এর জন্য সঠিক Label বসান।' },
                { n: '4', t: 'Switch ON করে Save করুন', d: 'উপরের toggle ON করে "Save All" চাপুন। ৫–১০ মিনিটের মধ্যে Google Tag Assistant-এ verify করতে পারবেন।' },
              ].map(s => (
                <div key={s.n} className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.n}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Hash size={14} className="text-primary" /> Field-গুলোর ব্যাখ্যা</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { k: 'Account Name', v: 'আপনার নিজের চেনার জন্য একটা নাম (যেমন: "Main Brand Ads")। Google-এ যায় না।' },
                  { k: 'Conversion ID', v: 'AW-XXXXXXXXXX format। প্রতিটি Google Ads account-এর একটাই ID — সব action-এর জন্য একই।' },
                  { k: 'Purchase Label', v: 'Order complete হলে fire হয়। Revenue tracking-এর জন্য সবচেয়ে গুরুত্বপূর্ণ।' },
                  { k: 'Begin Checkout Label', v: 'Customer checkout page-এ ঢুকলে fire হয়। Funnel analysis-এ কাজে আসে।' },
                  { k: 'Add to Cart Label', v: 'Cart-এ product add করলে fire হয়। Smart Bidding-এর জন্য micro-conversion।' },
                  { k: 'Lead/Sign Up Label', v: 'নতুন user signup/registration করলে fire হয়।' },
                ].map(f => (
                  <div key={f.k} className="p-3 rounded-lg bg-background/40 border border-border/40">
                    <p className="text-xs font-semibold text-foreground">{f.k}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{f.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-primary flex items-center gap-2"><AlertTriangle size={14} /> গুরুত্বপূর্ণ Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-5">
                <li>Label-এ শুধু slash (<code>/</code>)-এর পরের অংশটি বসাবেন — পুরো tag নয়।</li>
                <li>একাধিক Google Ads account থাকলে আলাদা আলাদা Add Account করুন।</li>
                <li>কোনো event track না করতে চাইলে সেই Label খালি রাখুন।</li>
                <li>Setup এর পর <strong>Google Tag Assistant</strong> Chrome extension দিয়ে verify করুন।</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* GA4 */}
        <TabsContent value="ga4" className="mt-4 space-y-4">
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

          {/* ─────── GA4 বিস্তারিত গাইড ─────── */}
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-6 space-y-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <TrendingUp className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Google Analytics 4 (GA4) গাইড</h3>
                <p className="text-xs text-muted-foreground">Visitor behavior ও traffic analyze করার সম্পূর্ণ system</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/20 border border-border/40 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Search size={14} className="text-primary" /> GA4 কী এবং কেন প্রয়োজন?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                GA4 হলো Google-এর free analytics tool যা আপনার website-এ কারা আসছে, কোথা থেকে আসছে, কোন page বেশি দেখা হচ্ছে, কতক্ষণ থাকছে — এসব track করে। <strong>SEO ranking</strong>-এর জন্য Google জানতে চায় আপনার site-এ real users আসে কি না, তারা content পছন্দ করে কি না। GA4 connected থাকলে Google আপনার site-কে trustworthy মনে করে।
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Setup Steps</p>
              {[
                { n: '1', t: 'GA4 Property তৈরি করুন', d: 'analytics.google.com → Admin → Create Property → আপনার website-এর নাম, time zone (Asia/Dhaka), currency (BDT) দিন।' },
                { n: '2', t: 'Web Data Stream যোগ করুন', d: 'Property তৈরির পর "Web" platform বেছে নিন → আপনার website URL (https://shahedstore.com.bd) দিন → Stream তৈরি হবে।' },
                { n: '3', t: 'Measurement ID কপি করুন', d: 'Stream-এর details page-এ "G-XXXXXXXXXX" format-এ একটা ID পাবেন। সেটাই Measurement ID। উপরে paste করুন।' },
                { n: '4', t: 'Switch ON করে Save করুন', d: 'Toggle ON করে Save All চাপুন। ২৪–৪৮ ঘণ্টায় Realtime report-এ data দেখা যাবে।' },
              ].map(s => (
                <div key={s.n} className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.n}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-primary flex items-center gap-2"><Lightbulb size={14} /> SEO ও Ranking-এর জন্য Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-5">
                <li>GA4-কে <strong>Google Search Console</strong>-এর সাথে link করুন — organic search performance দেখা যাবে।</li>
                <li>Engagement rate, bounce rate কম রাখার চেষ্টা করুন — ranking factor।</li>
                <li>Realtime report দিয়ে instantly verify করুন site track হচ্ছে কি না।</li>
                <li>GA4 ID একই — Conversion ID (AW-...) থেকে আলাদা। গুলিয়ে ফেলবেন না।</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* GTM */}
        <TabsContent value="gtm" className="mt-4 space-y-4">
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

          {/* ─────── GTM বিস্তারিত গাইড ─────── */}
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-6 space-y-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <SettingsIcon className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Google Tag Manager (GTM) গাইড</h3>
                <p className="text-xs text-muted-foreground">একটি জায়গা থেকে সব tracking tags manage করার system</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/20 border border-border/40 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Tag size={14} className="text-primary" /> GTM কী এবং কখন ব্যবহার করবেন?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                GTM হলো Google-এর free tag management system। এটা enable করলে আপনি <strong>code edit ছাড়াই</strong> Google Ads, Facebook Pixel, TikTok Pixel, Hotjar — যেকোনো third-party tag GTM dashboard থেকে add করতে পারবেন। Advanced marketers-দের জন্য সবচেয়ে flexible option।
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-primary">Note:</strong> আমাদের site-এ ইতিমধ্যে Google Ads, GA4, Facebook ও TikTok pixel direct integrate করা আছে। GTM শুধু তখনই enable করুন যদি আপনি advanced custom tags add করতে চান।
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Setup Steps</p>
              {[
                { n: '1', t: 'GTM Account তৈরি করুন', d: 'tagmanager.google.com → Create Account → Country: Bangladesh, Container name: shahedstore.com.bd, Target: Web।' },
                { n: '2', t: 'Container ID কপি করুন', d: 'Container তৈরির পর "GTM-XXXXXXX" format-এ ID পাবেন। সেটাই Container ID। উপরে paste করুন।' },
                { n: '3', t: 'Tags & Triggers configure করুন', d: 'GTM dashboard-এ Tags → New → তারপর তৈরি tag (যেমন Hotjar, LinkedIn Insight)। Trigger বাছুন (যেমন All Pages)।' },
                { n: '4', t: 'Switch ON করে Save', d: 'উপরে toggle ON করে Save All। GTM dashboard থেকে "Submit" করতে ভুলবেন না — নাহলে live হবে না।' },
              ].map(s => (
                <div key={s.n} className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.n}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-primary flex items-center gap-2"><AlertTriangle size={14} /> সতর্কতা</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-5">
                <li>GTM-এ Google Ads tag duplicate add করবেন না — এতে double conversion count হবে।</li>
                <li>GA4-ও duplicate add করবেন না (আমরা ইতিমধ্যে direct করি)।</li>
                <li>GTM mostly third-party tools (Hotjar, Clarity, LinkedIn) এর জন্য use করুন।</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* ENHANCED CONVERSIONS */}
        <TabsContent value="enhanced" className="mt-4 space-y-4">
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

          {/* ─────── Enhanced Conversions বিস্তারিত গাইড ─────── */}
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-6 space-y-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Enhanced Conversions গাইড</h3>
                <p className="text-xs text-muted-foreground">iOS & ad-blocker থেকেও accurate conversion tracking</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/20 border border-border/40 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /> Enhanced Conversions কী?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                আজকাল iOS users এবং ad-blockers এর কারণে Google প্রায় <strong>৩০–৫০% conversion miss</strong> করে। Enhanced Conversions enable করলে আমরা customer-এর email/phone-কে <strong>SHA-256 hash</strong> করে Google-কে পাঠাই। Google সেই hash-কে নিজের data-base-এর সাথে match করে missing conversions recover করে। Privacy-safe — original data কখনো leave করে না।
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Setup Steps</p>
              {[
                { n: '1', t: 'Google Ads-এ Enhanced Conversions enable করুন', d: 'Google Ads → Tools → Conversions → আপনার Purchase action → Settings → "Turn on enhanced conversions" → Method: "Google tag" বাছুন।' },
                { n: '2', t: 'Customer data terms accept করুন', d: 'Google data processing terms accept করুন। এটা GDPR/privacy compliance-এর জন্য বাধ্যতামূলক।' },
                { n: '3', t: 'উপরের toggle ON করুন', d: 'এই page-এ Enhanced Conversions toggle ON করে Save All চাপুন।' },
                { n: '4', t: 'Verify করুন', d: 'Google Ads → Conversions-এ "Recording enhanced conversions" status দেখুন। ৭২ ঘণ্টা পর diagnostics-এ match rate দেখা যাবে।' },
              ].map(s => (
                <div key={s.n} className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.n}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-primary flex items-center gap-2"><Lightbulb size={14} /> Benefits</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-5">
                <li><strong>৩০–৫০% বেশি conversions</strong> attribution recover হবে।</li>
                <li>Smart Bidding আরও ভালো performance দিবে — ROAS বাড়বে।</li>
                <li>iOS 14.5+ users-এর data-ও capture হবে।</li>
                <li>100% privacy-safe — শুধু one-way SHA-256 hash পাঠানো হয়।</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGoogleAds;
