import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facebook, Save, Eye, EyeOff, Info, CheckCircle2, XCircle, Zap, Globe, ShoppingCart, Users, MousePointerClick, Loader2, Plus, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface PixelConfig {
  id: string;
  name: string;
  pixel_id: string;
  capi_token: string;
  capi_test_event_code: string;
  pixel_enabled: boolean;
  capi_enabled: boolean;
  track_pageview: boolean;
  track_purchase: boolean;
  track_add_to_cart: boolean;
  track_view_content: boolean;
  track_lead: boolean;
}

const defaultPixel = (): PixelConfig => ({
  id: crypto.randomUUID(),
  name: '',
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

const AdminFacebookPixel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pixels, setPixels] = useState<PixelConfig[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [testingPixel, setTestingPixel] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'facebook_pixel');

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value || ''; });

        // Try loading multi-pixel config
        if (map['fb_pixels_config']) {
          try {
            const parsed = JSON.parse(map['fb_pixels_config']);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPixels(parsed);
              setExpandedId(parsed[0].id);
              setLoading(false);
              return;
            }
          } catch {}
        }

        // Migrate from single pixel config
        if (map['fb_pixel_id']) {
          const migrated: PixelConfig = {
            id: crypto.randomUUID(),
            name: 'Primary Pixel',
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
          };
          setPixels([migrated]);
          setExpandedId(migrated.id);
        } else {
          const first = defaultPixel();
          first.name = 'Primary Pixel';
          setPixels([first]);
          setExpandedId(first.id);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({
      key: 'fb_pixels_config',
      value: JSON.stringify(pixels),
      category: 'facebook_pixel',
    }, { onConflict: 'key' });

    // Also keep legacy keys for backward compat (first enabled pixel)
    const primary = pixels.find(p => p.pixel_enabled && p.pixel_id) || pixels[0];
    if (primary) {
      const legacyEntries = [
        { key: 'fb_pixel_id', value: primary.pixel_id },
        { key: 'fb_capi_token', value: primary.capi_token },
        { key: 'fb_capi_test_code', value: primary.capi_test_event_code },
        { key: 'fb_pixel_enabled', value: String(primary.pixel_enabled) },
        { key: 'fb_capi_enabled', value: String(primary.capi_enabled) },
        { key: 'fb_track_pageview', value: String(primary.track_pageview) },
        { key: 'fb_track_purchase', value: String(primary.track_purchase) },
        { key: 'fb_track_add_to_cart', value: String(primary.track_add_to_cart) },
        { key: 'fb_track_view_content', value: String(primary.track_view_content) },
        { key: 'fb_track_lead', value: String(primary.track_lead) },
      ];
      for (const entry of legacyEntries) {
        await supabase.from('site_settings').upsert({ key: entry.key, value: entry.value, category: 'facebook_pixel' }, { onConflict: 'key' });
      }
    }

    setSaving(false);
    toast.success('✅ সকল Pixel সেটিংস সেভ হয়েছে!');
  };

  const addPixel = () => {
    const p = defaultPixel();
    p.name = `Pixel ${pixels.length + 1}`;
    setPixels([...pixels, p]);
    setExpandedId(p.id);
  };

  const removePixel = (id: string) => {
    if (pixels.length <= 1) { toast.error('কমপক্ষে একটি Pixel থাকতে হবে'); return; }
    setPixels(pixels.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(pixels.find(p => p.id !== id)?.id || null);
  };

  const duplicatePixel = (pixel: PixelConfig) => {
    const dup = { ...pixel, id: crypto.randomUUID(), name: `${pixel.name} (Copy)`, pixel_id: '' };
    setPixels([...pixels, dup]);
    setExpandedId(dup.id);
  };

  const updatePixel = (id: string, updates: Partial<PixelConfig>) => {
    setPixels(pixels.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const testPixelEvent = async (pixel: PixelConfig) => {
    if (!pixel.pixel_id) { toast.error('প্রথমে Pixel ID দিন'); return; }
    setTestingPixel(pixel.id);
    try {
      const { error } = await supabase.functions.invoke('facebook-capi', {
        body: {
          event_name: 'PageView',
          pixel_id: pixel.pixel_id,
          capi_token: pixel.capi_token,
          test_event_code: pixel.capi_test_event_code || undefined,
          event_source_url: window.location.origin,
          user_data: { client_user_agent: navigator.userAgent },
        },
      });
      if (error) throw error;
      toast.success(`🎯 "${pixel.name}" এ Test event পাঠানো হয়েছে!`);
    } catch {
      toast.error('Test event পাঠাতে ব্যর্থ হয়েছে।');
    }
    setTestingPixel(null);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  const events = [
    { key: 'track_pageview' as const,     label: 'PageView',      icon: Globe,        desc: 'প্রতিটি পেজ ভিজিটে ট্র্যাক করে' },
    { key: 'track_view_content' as const, label: 'ViewContent',   icon: Eye,          desc: 'প্রোডাক্ট ডিটেইল পেজ দেখলে' },
    { key: 'track_add_to_cart' as const,  label: 'AddToCart',     icon: ShoppingCart,  desc: 'কার্টে পণ্য যোগ করলে' },
    { key: 'track_purchase' as const,     label: 'Purchase',      icon: CheckCircle2,  desc: 'অর্ডার সম্পন্ন হলে (সবচেয়ে গুরুত্বপূর্ণ)' },
    { key: 'track_lead' as const,         label: 'Lead',          icon: Users,         desc: 'সাপোর্ট টিকেট বা রেজিস্ট্রেশনে' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  const enabledCount = pixels.filter(p => p.pixel_enabled && p.pixel_id).length;
  const capiCount = pixels.filter(p => p.capi_enabled && p.capi_token).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <Facebook size={24} className="text-[#1877F2]" />
            Facebook <span className="gradient-text">Multi-Pixel & CAPI</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">একাধিক Facebook Pixel এবং Conversions API সেটআপ করুন</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addPixel}
            className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium glass-card border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus size={16} />
            নতুন Pixel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-3 text-sm">📊 সারাংশ</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20">
            <Facebook size={16} className="text-[#1877F2] flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-foreground">{pixels.length}</div>
              <div className="text-[11px] text-muted-foreground">মোট Pixel</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20">
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-foreground">{enabledCount}</div>
              <div className="text-[11px] text-muted-foreground">সক্রিয় Pixel</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20">
            <Zap size={16} className="text-primary flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-foreground">{capiCount}</div>
              <div className="text-[11px] text-muted-foreground">CAPI সক্রিয়</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pixel Cards */}
      <div className="space-y-3">
        {pixels.map((pixel, index) => {
          const isExpanded = expandedId === pixel.id;
          return (
            <div key={pixel.id} className="glass-card rounded-2xl overflow-hidden">
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : pixel.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pixel.pixel_enabled && pixel.pixel_id ? 'bg-[#1877F2]' : 'bg-muted-foreground/20'}`}>
                    <Facebook size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{pixel.name || `Pixel ${index + 1}`}</span>
                      {pixel.pixel_enabled && pixel.pixel_id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 font-medium">সক্রিয়</span>
                      )}
                      {pixel.capi_enabled && pixel.capi_token && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">CAPI</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{pixel.pixel_id || 'কনফিগার করা হয়নি'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle checked={pixel.pixel_enabled} onChange={v => updatePixel(pixel.id, { pixel_enabled: v })} />
                  {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-5 space-y-4 border-t border-border/30 pt-4">
                  {/* Name & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Pixel এর নাম</label>
                      <input
                        value={pixel.name}
                        onChange={e => updatePixel(pixel.id, { name: e.target.value })}
                        placeholder="যেমন: Main Store Pixel"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-5">
                      <button onClick={() => duplicatePixel(pixel)} className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors" title="ডুপ্লিকেট">
                        <Copy size={15} />
                      </button>
                      <button onClick={() => removePixel(pixel.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="মুছুন">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Pixel ID */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Pixel ID <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={pixel.pixel_id}
                      onChange={e => updatePixel(pixel.id, { pixel_id: e.target.value })}
                      placeholder="যেমন: 1234567890123456"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-2">
                      <Info size={11} />
                      Events Manager → আপনার Pixel → Settings থেকে Pixel ID পাবেন
                    </p>
                  </div>

                  {/* CAPI Section */}
                  <div className="rounded-xl border border-border/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">Conversions API (Server-Side)</span>
                      </div>
                      <Toggle checked={pixel.capi_enabled} onChange={v => updatePixel(pixel.id, { capi_enabled: v })} />
                    </div>

                    {pixel.capi_enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Access Token</label>
                          <div className="relative">
                            <input
                              type={showTokens[pixel.id] ? 'text' : 'password'}
                              value={pixel.capi_token}
                              onChange={e => updatePixel(pixel.id, { capi_token: e.target.value })}
                              placeholder="EAAxxxxxxxxxxxx..."
                              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowTokens(p => ({ ...p, [pixel.id]: !p[pixel.id] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showTokens[pixel.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                            Test Event Code <span className="text-muted-foreground/60">(ঐচ্ছিক)</span>
                          </label>
                          <input
                            value={pixel.capi_test_event_code}
                            onChange={e => updatePixel(pixel.id, { capi_test_event_code: e.target.value })}
                            placeholder="যেমন: TEST12345"
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                          />
                        </div>

                        {pixel.capi_token && (
                          <button
                            onClick={() => testPixelEvent(pixel)}
                            disabled={testingPixel === pixel.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass-card border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                          >
                            {testingPixel === pixel.id ? <Loader2 size={14} className="animate-spin" /> : <MousePointerClick size={14} />}
                            Test Event পাঠান
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Event Tracking */}
                  <div className="rounded-xl border border-border/40 p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MousePointerClick size={16} className="text-primary" />
                      <span className="text-sm font-semibold text-foreground">ইভেন্ট ট্র্যাকিং</span>
                    </div>
                    <div className="space-y-2">
                      {events.map((ev) => (
                        <div key={ev.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <ev.icon size={13} className="text-primary" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-foreground font-mono">{ev.label}</div>
                              <div className="text-[10px] text-muted-foreground">{ev.desc}</div>
                            </div>
                          </div>
                          <Toggle
                            checked={pixel[ev.key]}
                            onChange={v => updatePixel(pixel.id, { [ev.key]: v })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="p-4 rounded-2xl text-xs space-y-1.5" style={{ background: 'hsla(243,75%,59%,0.08)', border: '1px solid hsla(243,75%,59%,0.2)' }}>
        <p className="font-semibold text-primary">💡 একাধিক Pixel ব্যবহারের সুবিধা</p>
        <ul className="text-muted-foreground space-y-1 list-disc list-inside">
          <li>বিভিন্ন Ad Account-এর জন্য আলাদা Pixel ব্যবহার করতে পারবেন</li>
          <li>Agency এবং Client Pixel আলাদা রাখতে পারবেন</li>
          <li>প্রতিটি Pixel-এ আলাদা ইভেন্ট ট্র্যাকিং সেট করতে পারবেন</li>
          <li>CAPI আলাদাভাবে প্রতিটি Pixel-এর জন্য কনফিগার করা যাবে</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminFacebookPixel;
