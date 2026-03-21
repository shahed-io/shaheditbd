import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facebook, Save, Eye, EyeOff, Info, CheckCircle2, XCircle, Zap, Globe, ShoppingCart, Users, MousePointerClick, Loader2 } from 'lucide-react';

const AdminFacebookPixel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testingPixel, setTestingPixel] = useState(false);

  const [form, setForm] = useState({
    pixel_id: '',
    capi_token: '',
    capi_test_event_code: '',
    pixel_enabled: true,
    capi_enabled: false,
    track_pageview: true,
    track_purchase: true,
    track_add_to_cart: true,
    track_view_content: true,
    track_lead: false,
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'facebook_pixel');

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value || ''; });
        setForm({
          pixel_id: map['fb_pixel_id'] || '',
          capi_token: map['fb_capi_token'] || '',
          capi_test_event_code: map['fb_capi_test_code'] || '',
          pixel_enabled: map['fb_pixel_enabled'] !== 'false',
          capi_enabled: map['fb_capi_enabled'] === 'true',
          track_pageview: map['fb_track_pageview'] !== 'false',
          track_purchase: map['fb_track_purchase'] !== 'false',
          track_add_to_cart: map['fb_track_add_to_cart'] !== 'false',
          track_view_content: map['fb_track_view_content'] !== 'false',
          track_lead: map['fb_track_lead'] === 'true',
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: 'fb_pixel_id',           value: form.pixel_id },
      { key: 'fb_capi_token',         value: form.capi_token },
      { key: 'fb_capi_test_code',     value: form.capi_test_event_code },
      { key: 'fb_pixel_enabled',      value: String(form.pixel_enabled) },
      { key: 'fb_capi_enabled',       value: String(form.capi_enabled) },
      { key: 'fb_track_pageview',     value: String(form.track_pageview) },
      { key: 'fb_track_purchase',     value: String(form.track_purchase) },
      { key: 'fb_track_add_to_cart',  value: String(form.track_add_to_cart) },
      { key: 'fb_track_view_content', value: String(form.track_view_content) },
      { key: 'fb_track_lead',         value: String(form.track_lead) },
    ];

    for (const entry of entries) {
      await supabase
        .from('site_settings')
        .upsert({ key: entry.key, value: entry.value, category: 'facebook_pixel' }, { onConflict: 'key' });
    }
    setSaving(false);
    toast.success('✅ Facebook Pixel সেটিংস সেভ হয়েছে!');
  };

  const testPixelEvent = async () => {
    if (!form.pixel_id) { toast.error('প্রথমে Pixel ID দিন'); return; }
    setTestingPixel(true);
    try {
      const { error } = await supabase.functions.invoke('facebook-capi', {
        body: {
          event_name: 'PageView',
          test_event_code: form.capi_test_event_code || undefined,
          event_source_url: window.location.origin,
          user_data: { client_user_agent: navigator.userAgent },
        },
      });
      if (error) throw error;
      toast.success('🎯 Test event পাঠানো হয়েছে! Facebook Events Manager চেক করুন।');
    } catch {
      toast.error('Test event পাঠাতে ব্যর্থ হয়েছে।');
    }
    setTestingPixel(false);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  const events = [
    { key: 'track_pageview',     label: 'PageView',      icon: Globe,            desc: 'প্রতিটি পেজ ভিজিটে ট্র্যাক করে' },
    { key: 'track_view_content', label: 'ViewContent',   icon: Eye,              desc: 'প্রোডাক্ট ডিটেইল পেজ দেখলে' },
    { key: 'track_add_to_cart',  label: 'AddToCart',     icon: ShoppingCart,     desc: 'কার্টে পণ্য যোগ করলে' },
    { key: 'track_purchase',     label: 'Purchase',      icon: CheckCircle2,     desc: 'অর্ডার সম্পন্ন হলে (সবচেয়ে গুরুত্বপূর্ণ)' },
    { key: 'track_lead',         label: 'Lead',          icon: Users,            desc: 'সাপোর্ট টিকেট বা রেজিস্ট্রেশনে' },
  ] as const;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <Facebook size={24} className="text-[#1877F2]" />
            Facebook <span className="gradient-text">Pixel & CAPI</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Facebook Pixel এবং Conversions API (Server-Side) সেটআপ করুন</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
        </button>
      </div>

      {/* Pixel ID Card */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1877F2, #42A5F5)' }}>
              <Facebook size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Facebook Pixel (Client-Side)</h2>
              <p className="text-xs text-muted-foreground">ব্রাউজার থেকে ইভেন্ট ট্র্যাক করে</p>
            </div>
          </div>
          <Toggle checked={form.pixel_enabled} onChange={v => setForm({ ...form, pixel_enabled: v })} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Pixel ID <span className="text-destructive">*</span>
          </label>
          <input
            value={form.pixel_id}
            onChange={e => setForm({ ...form, pixel_id: e.target.value })}
            placeholder="যেমন: 1234567890123456"
            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Info size={11} />
            Facebook Ads Manager → Events Manager → আপনার Pixel → Settings থেকে Pixel ID পাবেন
          </p>
        </div>

        {form.pixel_id && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'hsla(142,76%,36%,0.1)', border: '1px solid hsla(142,76%,36%,0.25)' }}>
            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
            <span className="text-xs text-green-600 dark:text-green-400">Pixel ID সেট করা আছে: <strong>{form.pixel_id}</strong></span>
          </div>
        )}
      </div>

      {/* Conversions API Card */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(280,70%,55%))' }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Conversions API (Server-Side)</h2>
              <p className="text-xs text-muted-foreground">সার্ভার থেকে সরাসরি Facebook-এ ইভেন্ট পাঠায় — Ad Blocker বাইপাস করে</p>
            </div>
          </div>
          <Toggle checked={form.capi_enabled} onChange={v => setForm({ ...form, capi_enabled: v })} />
        </div>

        {/* CAPI info banner */}
        <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'hsla(243,75%,59%,0.08)', border: '1px solid hsla(243,75%,59%,0.2)' }}>
          <p className="font-semibold text-primary">🛡️ Server-Side Tagging কেন গুরুত্বপূর্ণ?</p>
          <p className="text-muted-foreground">Client-side Pixel অনেক সময় Ad Blocker বা iOS Privacy restrictions এর কারণে কাজ করে না। CAPI সরাসরি আপনার সার্ভার থেকে Facebook-এ ডেটা পাঠায়, ফলে Conversion tracking আরও নির্ভুল হয়।</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Access Token (CAPI)
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={form.capi_token}
              onChange={e => setForm({ ...form, capi_token: e.target.value })}
              placeholder="EAAxxxxxxxxxxxx..."
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Info size={11} />
            Events Manager → আপনার Pixel → Settings → Conversions API → Generate Access Token
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Test Event Code <span className="text-muted-foreground/60">(ঐচ্ছিক)</span>
          </label>
          <input
            value={form.capi_test_event_code}
            onChange={e => setForm({ ...form, capi_test_event_code: e.target.value })}
            placeholder="যেমন: TEST12345"
            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Testing এর জন্য Events Manager → Test Events এ পাবেন। Live-এ দেওয়ার সময় খালি রাখুন।
          </p>
        </div>

        {form.capi_enabled && form.capi_token && (
          <button
            onClick={testPixelEvent}
            disabled={testingPixel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass-card border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            {testingPixel ? <Loader2 size={14} className="animate-spin" /> : <MousePointerClick size={14} />}
            Test Event পাঠান
          </button>
        )}
      </div>

      {/* Event Tracking */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
            <MousePointerClick size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">ইভেন্ট ট্র্যাকিং</h2>
            <p className="text-xs text-muted-foreground">কোন কোন ইভেন্ট ট্র্যাক করবেন তা বেছে নিন</p>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.key} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ev.icon size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground font-mono">{ev.label}</div>
                  <div className="text-[11px] text-muted-foreground">{ev.desc}</div>
                </div>
              </div>
              <Toggle
                checked={form[ev.key] as boolean}
                onChange={v => setForm({ ...form, [ev.key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Status Summary */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-3 text-sm">📊 বর্তমান অবস্থা</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Client Pixel', active: form.pixel_enabled && !!form.pixel_id },
            { label: 'Server CAPI',  active: form.capi_enabled && !!form.capi_token },
            { label: 'Purchase Event', active: form.track_purchase },
            { label: 'AddToCart Event', active: form.track_add_to_cart },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20">
              {item.active
                ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                : <XCircle size={14} className="text-muted-foreground flex-shrink-0" />
              }
              <span className={`text-xs font-medium ${item.active ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminFacebookPixel;
