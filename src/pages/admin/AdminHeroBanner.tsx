import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Eye, EyeOff, ChevronUp, ChevronDown, Palette, LayoutTemplate, BarChart3, ShieldCheck } from 'lucide-react';

type SlideFeature = string;
type Slide = {
  id: string;
  tag: string;
  tagIcon: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  desc: string;
  price: string;
  original: string;
  off: string;
  badge: string;
  accentFrom: string;
  accentTo: string;
  emoji: string;
  logoImg: string;
  features: SlideFeature[];
  enabled: boolean;
  productSlug: string;
};

type BgSettings = {
  bgType: 'default' | 'gradient' | 'color';
  bgColor: string;
  bgGradientFrom: string;
  bgGradientTo: string;
};

type StatCard   = { label: string; value: string; icon: string };
type FloatCard  = { label: string; value: string; icon: string };
type TrustItem  = { text: string; icon: string };

const DEFAULT_BG: BgSettings = {
  bgType: 'default',
  bgColor: '#f8f9ff',
  bgGradientFrom: '#e8ecff',
  bgGradientTo: '#f0f4ff',
};

const DEFAULT_STATS: StatCard[] = [
  { label: 'Products',         value: '500+', icon: '🛍️' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅' },
  { label: 'Happy Customers',  value: '12K+', icon: '😊' },
  { label: 'Support Rating',   value: '4.9★', icon: '⭐' },
];

const DEFAULT_FLOATING: FloatCard[] = [
  { label: 'Orders Today', value: '248+', icon: '📦' },
  { label: 'Happy Users',  value: '12K+', icon: '😊' },
  { label: 'Avg Rating',   value: '4.9★', icon: '⭐' },
];

const DEFAULT_TRUST: TrustItem[] = [
  { text: 'Instant Delivery', icon: '⚡' },
  { text: '100% Genuine',     icon: '🛡️' },
  { text: '24/7 Support',     icon: '🕐' },
  { text: '4.9★ Rating',      icon: '⭐' },
];

const EMPTY_SLIDE = (): Slide => ({
  id: crypto.randomUUID(),
  tag: '🔥 New Deal',
  title: 'Product',
  titleAccent: 'Name',
  subtitle: 'Short subtitle here',
  desc: 'Describe the product briefly here.',
  price: '৳999',
  original: '৳2,999',
  off: '67%',
  badge: 'HOT DEAL',
  accentFrom: 'hsl(243,75%,55%)',
  accentTo: 'hsl(263,70%,52%)',
  emoji: '🛍️',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  enabled: true,
  productSlug: '',
});

const AdminHeroBanner = () => {
  const [slides,   setSlides]   = useState<Slide[]>([]);
  const [bgSettings, setBgSettings] = useState<BgSettings>(DEFAULT_BG);
  const [stats,    setStats]    = useState<StatCard[]>(DEFAULT_STATS);
  const [floating, setFloating] = useState<FloatCard[]>(DEFAULT_FLOATING);
  const [trust,    setTrust]    = useState<TrustItem[]>(DEFAULT_TRUST);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [activeTab, setActiveTab] = useState<'slides' | 'background' | 'stats'>('slides');
  const [editingSlide, setEditingSlide] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['hero_slides', 'hero_background', 'hero_stats', 'hero_floating', 'hero_trust']);

    const get = (key: string) => data?.find(r => r.key === key)?.value;
    if (get('hero_slides'))     try { setSlides(JSON.parse(get('hero_slides')!)); }     catch {}
    if (get('hero_background')) try { setBgSettings(JSON.parse(get('hero_background')!)); } catch {}
    if (get('hero_stats'))      try { setStats(JSON.parse(get('hero_stats')!)); }       catch {}
    if (get('hero_floating'))   try { setFloating(JSON.parse(get('hero_floating')!)); } catch {}
    if (get('hero_trust'))      try { setTrust(JSON.parse(get('hero_trust')!)); }       catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      supabase.from('site_settings').upsert({ key: 'hero_slides',     value: JSON.stringify(slides) },     { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_background', value: JSON.stringify(bgSettings) }, { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_stats',      value: JSON.stringify(stats) },      { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_floating',   value: JSON.stringify(floating) },   { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_trust',      value: JSON.stringify(trust) },      { onConflict: 'key' }),
    ]);
    toast.success('Hero Banner সেটিংস সেভ হয়েছে!');
    setSaving(false);
  };

  const addSlide = () => {
    const s = EMPTY_SLIDE();
    setSlides(prev => [...prev, s]);
    setEditingSlide(s.id);
  };
  const removeSlide = (id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id));
    if (editingSlide === id) setEditingSlide(null);
  };
  const moveSlide = (id: string, dir: -1 | 1) => {
    setSlides(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };
  const updateSlide = (id: string, field: keyof Slide, value: unknown) =>
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const updateFeature = (slideId: string, idx: number, val: string) =>
    setSlides(prev => prev.map(s => {
      if (s.id !== slideId) return s;
      const feats = [...s.features]; feats[idx] = val;
      return { ...s, features: feats };
    }));
  const addFeature = (slideId: string) =>
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, features: [...s.features, 'New Feature'] } : s));
  const removeFeature = (slideId: string, idx: number) =>
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, features: s.features.filter((_, i) => i !== idx) } : s));

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Hero Banner <span className="gradient-text">Customizer</span>
          </h1>
          <p className="text-muted-foreground text-sm">হোমপেজের স্লাইডার, স্ট্যাটস ও ব্যাকগ্রাউন্ড কাস্টমাইজ করুন</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          ['slides',     'স্লাইডস',       LayoutTemplate],
          ['background', 'ব্যাকগ্রাউন্ড', Palette],
          ['stats',      'স্ট্যাটস ও ট্রাস্ট', BarChart3],
        ] as const).map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════ SLIDES TAB ══════════════════ */}
      {activeTab === 'slides' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{slides.length} টি স্লাইড</p>
            <button onClick={addSlide} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass-card hover:border-primary/40 text-primary transition-all">
              <Plus size={15} /> নতুন স্লাইড
            </button>
          </div>

          {slides.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <LayoutTemplate size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো স্লাইড নেই। নতুন স্লাইড যোগ করুন।</p>
            </div>
          )}

          {slides.map((slide, idx) => (
            <div key={slide.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setEditingSlide(editingSlide === slide.id ? null : slide.id)}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{slide.title} {slide.titleAccent}</div>
                  <div className="text-xs text-muted-foreground truncate">{slide.tag} · {slide.price}</div>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => updateSlide(slide.id, 'enabled', !slide.enabled)}
                    className={`p-1.5 rounded-lg transition-colors ${slide.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                    {slide.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => moveSlide(slide.id, -1)} disabled={idx === 0}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ChevronUp size={15} />
                  </button>
                  <button onClick={() => moveSlide(slide.id, 1)} disabled={idx === slides.length - 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ChevronDown size={15} />
                  </button>
                  <button onClick={() => removeSlide(slide.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {editingSlide === slide.id && (
                <div className="border-t border-border/50 p-5 space-y-5 bg-muted/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="ট্যাগ (Tag)"           value={slide.tag}          onChange={v => updateSlide(slide.id, 'tag', v)}          placeholder="🔥 Best Seller" />
                    <Field label="ব্যাজ (Badge)"          value={slide.badge}        onChange={v => updateSlide(slide.id, 'badge', v)}        placeholder="MOST POPULAR" />
                    <Field label="টাইটেল (Title)"        value={slide.title}        onChange={v => updateSlide(slide.id, 'title', v)}        placeholder="Windows 11" />
                    <Field label="টাইটেল অ্যাকসেন্ট"   value={slide.titleAccent}  onChange={v => updateSlide(slide.id, 'titleAccent', v)}  placeholder="Pro" />
                    <Field label="সাবটাইটেল"            value={slide.subtitle}     onChange={v => updateSlide(slide.id, 'subtitle', v)}     placeholder="Original License Key" />
                    <Field label="ইমোজি"                value={slide.emoji}        onChange={v => updateSlide(slide.id, 'emoji', v)}        placeholder="🪟" />
                    <Field label="মূল্য (Price)"         value={slide.price}        onChange={v => updateSlide(slide.id, 'price', v)}        placeholder="৳599" />
                    <Field label="আসল মূল্য (Original)" value={slide.original}     onChange={v => updateSlide(slide.id, 'original', v)}     placeholder="৳9,999" />
                    <Field label="ছাড় (% Off)"           value={slide.off}          onChange={v => updateSlide(slide.id, 'off', v)}          placeholder="94%" />
                    {/* Product Slug */}
                    <div className="md:col-span-2">
                      <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                        🔗 প্রোডাক্ট লিংক (Product Slug)
                        <span className="text-[10px] text-primary/60">"Buy Now" বাটন এই প্রোডাক্টে নিয়ে যাবে</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-l-xl px-3 py-2.5 font-mono">/product/</span>
                        <input value={slide.productSlug}
                          onChange={e => updateSlide(slide.id, 'productSlug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                          placeholder="windows-11-pro"
                          className="flex-1 bg-muted/30 border border-border rounded-r-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-mono" />
                      </div>
                      {slide.productSlug && (
                        <a href={`/product/${slide.productSlug}`} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1">
                          ↗ /product/{slide.productSlug} — প্রিভিউ দেখুন
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">বিবরণ (Description)</label>
                    <textarea value={slide.desc} rows={2}
                      onChange={e => updateSlide(slide.id, 'desc', e.target.value)}
                      placeholder="Describe the product..."
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">অ্যাকসেন্ট কালার From</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={hslToHex(slide.accentFrom)}
                          onChange={e => updateSlide(slide.id, 'accentFrom', hexToHsl(e.target.value))}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                        <input value={slide.accentFrom} onChange={e => updateSlide(slide.id, 'accentFrom', e.target.value)}
                          className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">অ্যাকসেন্ট কালার To</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={hslToHex(slide.accentTo)}
                          onChange={e => updateSlide(slide.id, 'accentTo', hexToHsl(e.target.value))}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                        <input value={slide.accentTo} onChange={e => updateSlide(slide.id, 'accentTo', e.target.value)}
                          className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted-foreground">ফিচার পিলস (Feature Pills)</label>
                      <button onClick={() => addFeature(slide.id)}
                        className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus size={11} /> যোগ করুন
                      </button>
                    </div>
                    <div className="space-y-2">
                      {slide.features.map((feat, fi) => (
                        <div key={fi} className="flex gap-2 items-center">
                          <input value={feat} onChange={e => updateFeature(slide.id, fi, e.target.value)}
                            className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                          <button onClick={() => removeFeature(slide.id, fi)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini preview */}
                  <div className="rounded-2xl p-4 flex items-center gap-4"
                    style={{ background: `linear-gradient(135deg, ${slide.accentFrom}12, ${slide.accentTo}08)`, border: `1px solid ${slide.accentFrom}25` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: 'rgba(255,255,255,0.8)', border: `1px solid ${slide.accentFrom}30` }}>
                      {slide.emoji}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{slide.title} <span style={{ color: slide.accentFrom }}>{slide.titleAccent}</span></div>
                      <div className="text-xs text-muted-foreground">{slide.subtitle}</div>
                      <div className="font-bold mt-1" style={{ color: slide.accentFrom }}>{slide.price}</div>
                    </div>
                    <div className="ml-auto">
                      <span className="text-[10px] font-bold px-3 py-1.5 rounded-full text-white"
                        style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                        Preview
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════ BACKGROUND TAB ══════════════════ */}
      {activeTab === 'background' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="font-bold text-foreground mb-1 flex items-center gap-2"><Palette size={16} /> ব্যাকগ্রাউন্ড টাইপ</h3>
            <p className="text-xs text-muted-foreground mb-4">হোমপেজের হিরো সেকশনের ব্যাকগ্রাউন্ড কাস্টমাইজ করুন</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                ['default',  '⚙️ Default',     'সিস্টেম ডিফল্ট ব্যাকগ্রাউন্ড'],
                ['color',    '🎨 Solid Color',  'একটি সলিড রঙ'],
                ['gradient', '✨ Gradient',     'গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড'],
              ] as const).map(([type, label, desc]) => (
                <button key={type} onClick={() => setBgSettings(p => ({ ...p, bgType: type }))}
                  className={`p-4 rounded-xl text-left transition-all ${
                    bgSettings.bgType === type ? 'border-2 border-primary bg-primary/10' : 'glass-card hover:border-primary/40'
                  }`}>
                  <div className="font-semibold text-sm text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {bgSettings.bgType === 'color' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">ব্যাকগ্রাউন্ড রঙ</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={bgSettings.bgColor}
                  onChange={e => setBgSettings(p => ({ ...p, bgColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg border border-border cursor-pointer" />
                <input value={bgSettings.bgColor}
                  onChange={e => setBgSettings(p => ({ ...p, bgColor: e.target.value }))}
                  className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono" />
              </div>
              <div className="mt-3 h-20 rounded-xl" style={{ background: bgSettings.bgColor }} />
            </div>
          )}

          {bgSettings.bgType === 'gradient' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">গ্রেডিয়েন্ট From</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bgSettings.bgGradientFrom}
                      onChange={e => setBgSettings(p => ({ ...p, bgGradientFrom: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <input value={bgSettings.bgGradientFrom}
                      onChange={e => setBgSettings(p => ({ ...p, bgGradientFrom: e.target.value }))}
                      className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">গ্রেডিয়েন্ট To</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bgSettings.bgGradientTo}
                      onChange={e => setBgSettings(p => ({ ...p, bgGradientTo: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <input value={bgSettings.bgGradientTo}
                      onChange={e => setBgSettings(p => ({ ...p, bgGradientTo: e.target.value }))}
                      className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono" />
                  </div>
                </div>
              </div>
              <div className="h-20 rounded-xl" style={{ background: `linear-gradient(135deg, ${bgSettings.bgGradientFrom}, ${bgSettings.bgGradientTo})` }} />
            </div>
          )}

          {bgSettings.bgType === 'default' && (
            <div className="rounded-xl p-4 bg-muted/20 border border-border text-sm text-muted-foreground">
              ✅ সিস্টেম থিমের ডিফল্ট ব্যাকগ্রাউন্ড ব্যবহার হবে (<code className="font-mono text-xs">hsl(var(--background))</code>)
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ STATS & TRUST TAB ══════════════════ */}
      {activeTab === 'stats' && (
        <div className="space-y-6">

          {/* Bottom Stats Row */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2"><BarChart3 size={16} /> নিচের স্ট্যাটস রো</h3>
                <p className="text-xs text-muted-foreground mt-0.5">হিরো ব্যানারের একদম নিচে ৪টি স্ট্যাট কার্ড (Products, Orders Delivered ইত্যাদি)</p>
              </div>
              <button onClick={() => setStats(p => [...p, { label: 'New Stat', value: '0+', icon: '📊' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass-card hover:border-primary/40 text-primary transition-all">
                <Plus size={12} /> যোগ করুন
              </button>
            </div>
            <div className="space-y-3">
              {stats.map((s, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center">
                  <input value={s.icon} onChange={e => setStats(p => p.map((x,j) => j===i ? {...x, icon: e.target.value} : x))}
                    className="w-14 bg-muted/30 border border-border rounded-xl px-3 py-2 text-center text-lg focus:outline-none focus:border-primary transition-colors" />
                  <input value={s.value} placeholder="500+"
                    onChange={e => setStats(p => p.map((x,j) => j===i ? {...x, value: e.target.value} : x))}
                    className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors" />
                  <input value={s.label} placeholder="Products"
                    onChange={e => setStats(p => p.map((x,j) => j===i ? {...x, label: e.target.value} : x))}
                    className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setStats(p => p.filter((_,j) => j!==i))}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Cards */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">🪄 ফ্লোটিং স্ট্যাট কার্ডস</h3>
                <p className="text-xs text-muted-foreground mt-0.5">ডান পাশের প্রোডাক্ট কার্ডের চারপাশে ভাসমান ছোট কার্ডগুলো (Orders Today, Avg Rating ইত্যাদি)</p>
              </div>
              <button onClick={() => setFloating(p => [...p, { label: 'New Card', value: '0+', icon: '📊' }])}
                disabled={floating.length >= 3}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass-card hover:border-primary/40 text-primary transition-all disabled:opacity-40">
                <Plus size={12} /> যোগ করুন
              </button>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">সর্বোচ্চ ৩টি ফ্লোটিং কার্ড সাপোর্ট করে</p>
            <div className="space-y-3">
              {floating.map((f, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center">
                  <input value={f.icon} onChange={e => setFloating(p => p.map((x,j) => j===i ? {...x, icon: e.target.value} : x))}
                    className="w-14 bg-muted/30 border border-border rounded-xl px-3 py-2 text-center text-lg focus:outline-none focus:border-primary transition-colors" />
                  <input value={f.value} placeholder="248+"
                    onChange={e => setFloating(p => p.map((x,j) => j===i ? {...x, value: e.target.value} : x))}
                    className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors" />
                  <input value={f.label} placeholder="Orders Today"
                    onChange={e => setFloating(p => p.map((x,j) => j===i ? {...x, label: e.target.value} : x))}
                    className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setFloating(p => p.filter((_,j) => j!==i))}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Signals */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2"><ShieldCheck size={16} /> ট্রাস্ট সিগনালস</h3>
                <p className="text-xs text-muted-foreground mt-0.5">প্রাইস সেকশনের নিচে ছোট ট্রাস্ট আইকনগুলো (Instant Delivery, 100% Genuine ইত্যাদি)</p>
              </div>
              <button onClick={() => setTrust(p => [...p, { text: 'New Signal', icon: '✅' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass-card hover:border-primary/40 text-primary transition-all">
                <Plus size={12} /> যোগ করুন
              </button>
            </div>
            <div className="space-y-3">
              {trust.map((t, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                  <input value={t.icon} onChange={e => setTrust(p => p.map((x,j) => j===i ? {...x, icon: e.target.value} : x))}
                    className="w-14 bg-muted/30 border border-border rounded-xl px-3 py-2 text-center text-lg focus:outline-none focus:border-primary transition-colors" />
                  <input value={t.text} placeholder="Instant Delivery"
                    onChange={e => setTrust(p => p.map((x,j) => j===i ? {...x, text: e.target.value} : x))}
                    className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setTrust(p => p.filter((_,j) => j!==i))}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save reminder */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">পরিবর্তন সেভ করতে উপরের <strong>Save Changes</strong> বাটনে ক্লিক করুন।</p>
        <button onClick={handleSave} disabled={saving} className="btn-glow px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Save size={14} /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

// Helper
const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
  </div>
);

function hslToHex(hsl: string): string {
  try {
    const match = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
    if (!match) return '#7c3aed';
    const h = parseFloat(match[1]) / 360, s = parseFloat(match[2]) / 100, l = parseFloat(match[3]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  } catch { return '#7c3aed'; }
}

function hexToHsl(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `hsl(${Math.round(h * 360)},${Math.round(s * 100)}%,${Math.round(l * 100)}%)`;
  } catch { return 'hsl(243,75%,55%)'; }
}

export default AdminHeroBanner;
