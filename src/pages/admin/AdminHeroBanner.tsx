import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Trash2, Save, Eye, EyeOff, ChevronUp, ChevronDown,
  LayoutTemplate, GripVertical, Pencil, X, CheckCircle2,
  ShoppingBag, ArrowRight, Sparkles, Link2, Image as ImageIcon,
  Loader2, Monitor, Smartphone, ChevronLeft, ChevronRight
} from 'lucide-react';

/* ═══════════════════ TYPES ═══════════════════ */
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

type StatCard = { label: string; value: string; icon: string };
type FloatCard = { label: string; value: string; icon: string };
type TrustItem = { text: string; icon: string };

/* ═══════════════════ DEFAULTS ═══════════════════ */
const DEFAULT_BG: BgSettings = { bgType: 'default', bgColor: '#f8f9ff', bgGradientFrom: '#e8ecff', bgGradientTo: '#f0f4ff' };
const DEFAULT_STATS: StatCard[] = [
  { label: 'Products', value: '500+', icon: '🛍️' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅' },
  { label: 'Happy Customers', value: '12K+', icon: '😊' },
  { label: 'Support Rating', value: '4.9★', icon: '⭐' },
];
const DEFAULT_FLOATING: FloatCard[] = [
  { label: 'Orders Today', value: '248+', icon: '📦' },
  { label: 'Happy Users', value: '12K+', icon: '😊' },
  { label: 'Avg Rating', value: '4.9★', icon: '⭐' },
];
const DEFAULT_TRUST: TrustItem[] = [
  { text: 'Instant Delivery', icon: '⚡' },
  { text: '100% Genuine', icon: '🛡️' },
  { text: '24/7 Support', icon: '🕐' },
  { text: '4.9★ Rating', icon: '⭐' },
];

const EMPTY_SLIDE = (): Slide => ({
  id: crypto.randomUUID(),
  tag: 'New Deal', tagIcon: '🔥', title: 'Product', titleAccent: 'Name',
  subtitle: 'Short subtitle here', desc: 'Describe the product briefly.',
  price: '৳999', original: '৳2,999', off: '67%', badge: 'HOT DEAL',
  accentFrom: 'hsl(243,75%,55%)', accentTo: 'hsl(263,70%,52%)',
  emoji: '🛍️', logoImg: '', features: ['Feature 1', 'Feature 2', 'Feature 3'],
  enabled: true, productSlug: '',
});

/* ═══════════════════ COMPONENT ═══════════════════ */
const AdminHeroBanner = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [bgSettings, setBgSettings] = useState<BgSettings>(DEFAULT_BG);
  const [stats, setStats] = useState<StatCard[]>(DEFAULT_STATS);
  const [floating, setFloating] = useState<FloatCard[]>(DEFAULT_FLOATING);
  const [trust, setTrust] = useState<TrustItem[]>(DEFAULT_TRUST);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['hero_slides', 'hero_background', 'hero_stats', 'hero_floating', 'hero_trust']);

    const get = (key: string) => data?.find(r => r.key === key)?.value;
    if (get('hero_slides')) try { setSlides(JSON.parse(get('hero_slides')!)); } catch { }
    if (get('hero_background')) try { setBgSettings(JSON.parse(get('hero_background')!)); } catch { }
    if (get('hero_stats')) try { setStats(JSON.parse(get('hero_stats')!)); } catch { }
    if (get('hero_floating')) try { setFloating(JSON.parse(get('hero_floating')!)); } catch { }
    if (get('hero_trust')) try { setTrust(JSON.parse(get('hero_trust')!)); } catch { }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      supabase.from('site_settings').upsert({ key: 'hero_slides', value: JSON.stringify(slides) }, { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_background', value: JSON.stringify(bgSettings) }, { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_stats', value: JSON.stringify(stats) }, { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_floating', value: JSON.stringify(floating) }, { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'hero_trust', value: JSON.stringify(trust) }, { onConflict: 'key' }),
    ]);
    toast.success('হিরো ব্যানার সেভ হয়েছে! হোমপেজে রিফ্রেশ করলে দেখতে পাবেন।');
    setSaving(false);
  };

  /* Slide CRUD */
  const addSlide = () => { const s = EMPTY_SLIDE(); setSlides(p => [...p, s]); setSelectedSlideId(s.id); setPreviewIdx(slides.length); };
  const removeSlide = (id: string) => { setSlides(p => p.filter(s => s.id !== id)); if (selectedSlideId === id) setSelectedSlideId(null); };
  const moveSlide = (id: string, dir: -1 | 1) => {
    setSlides(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev]; [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]; return arr;
    });
  };
  const updateSlide = useCallback((id: string, field: keyof Slide, value: unknown) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);
  const updateFeature = (slideId: string, idx: number, val: string) =>
    setSlides(prev => prev.map(s => { if (s.id !== slideId) return s; const f = [...s.features]; f[idx] = val; return { ...s, features: f }; }));
  const addFeature = (slideId: string) =>
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, features: [...s.features, 'New Feature'] } : s));
  const removeFeature = (slideId: string, idx: number) =>
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, features: s.features.filter((_, i) => i !== idx) } : s));

  const selectedSlide = slides.find(s => s.id === selectedSlideId);
  const enabledSlides = slides.filter(s => s.enabled);

  useEffect(() => {
    if (enabledSlides.length > 0 && previewIdx >= enabledSlides.length) setPreviewIdx(0);
  }, [enabledSlides.length, previewIdx]);

  useEffect(() => {
    if (selectedSlideId) {
      const idx = enabledSlides.findIndex(s => s.id === selectedSlideId);
      if (idx >= 0) setPreviewIdx(idx);
    }
  }, [selectedSlideId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <Loader2 size={28} className="animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    </div>
  );

  const previewSlide = enabledSlides[previewIdx] || enabledSlides[0] || null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground flex items-center gap-2">
            <LayoutTemplate size={20} className="text-primary" />
            হিরো ব্যানার এডিটর
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">স্লাইড এডিট করুন, রিয়েল-টাইমে প্রিভিউ দেখুন</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{slides.length}টি স্লাইড</span>
            <button onClick={addSlide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all">
              <Plus size={12} /> নতুন স্লাইড
            </button>
          </div>

          {slides.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <LayoutTemplate size={32} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো স্লাইড নেই</p>
              <button onClick={addSlide} className="text-xs text-primary font-semibold mt-2 hover:underline">+ যোগ করুন</button>
            </div>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {slides.map((slide, idx) => (
              <div key={slide.id}
                onClick={() => setSelectedSlideId(slide.id)}
                className={`bg-card border rounded-xl p-3 cursor-pointer transition-all group ${selectedSlideId === slide.id
                  ? 'border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30'
                  }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${slide.accentFrom}20, ${slide.accentTo}15)`, border: `1px solid ${slide.accentFrom}30` }}>
                    {slide.logoImg
                      ? <img src={slide.logoImg} alt="" className="w-6 h-6 object-contain" />
                      : slide.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{slide.title} {slide.titleAccent}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{slide.tag} · {slide.price}</div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => updateSlide(slide.id, 'enabled', !slide.enabled)}
                      className={`p-1 rounded-md transition-colors ${slide.enabled ? 'text-green-500' : 'text-muted-foreground'}`}
                      title={slide.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}>
                      {slide.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => moveSlide(slide.id, -1)} disabled={idx === 0} className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp size={13} /></button>
                    <button onClick={() => moveSlide(slide.id, 1)} disabled={idx === slides.length - 1} className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown size={13} /></button>
                    <button onClick={() => removeSlide(slide.id)} className="p-1 rounded-md text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                  </div>
                </div>
                {!slide.enabled && (
                  <span className="text-[10px] text-amber-500 font-medium mt-1 block">⚠ নিষ্ক্রিয় — হোমপেজে দেখাবে না</span>
                )}
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-3 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              📊 স্ট্যাটস বার
            </div>
            {stats.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={s.icon} onChange={e => setStats(p => p.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
                  className="w-10 bg-background border border-border rounded-lg px-1 py-1.5 text-center text-sm focus:outline-none focus:border-primary" />
                <input value={s.value} onChange={e => setStats(p => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                  className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-primary" />
                <input value={s.label} onChange={e => setStats(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                <button onClick={() => setStats(p => p.filter((_, j) => j !== i))}
                  className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
              </div>
            ))}
            <button onClick={() => setStats(p => [...p, { label: 'New', value: '0+', icon: '📊' }])}
              className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"><Plus size={10} /> স্ট্যাট যোগ</button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Monitor size={12} /> লাইভ প্রিভিউ
              </span>
              <div className="flex items-center gap-2">
                {enabledSlides.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewIdx(p => (p - 1 + enabledSlides.length) % enabledSlides.length)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground"><ChevronLeft size={14} /></button>
                    <span className="text-[10px] text-muted-foreground font-mono">{previewIdx + 1}/{enabledSlides.length}</span>
                    <button onClick={() => setPreviewIdx(p => (p + 1) % enabledSlides.length)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground"><ChevronRight size={14} /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              {previewSlide ? (
                <MiniSlidePreview slide={previewSlide} />
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  কোনো সক্রিয় স্লাইড নেই — একটি স্লাইড সক্রিয় করুন
                </div>
              )}
            </div>
          </div>

          {selectedSlide ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Pencil size={12} className="text-primary" />
                  এডিট: {selectedSlide.title} {selectedSlide.titleAccent}
                </span>
                <button onClick={() => setSelectedSlideId(null)} className="p-1 rounded-md text-muted-foreground hover:text-foreground"><X size={14} /></button>
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <SmartField label="টাইটেল" value={selectedSlide.title} onChange={v => updateSlide(selectedSlide.id, 'title', v)} />
                  <SmartField label="টাইটেল অ্যাকসেন্ট" value={selectedSlide.titleAccent} onChange={v => updateSlide(selectedSlide.id, 'titleAccent', v)} />
                  <SmartField label="সাবটাইটেল" value={selectedSlide.subtitle} onChange={v => updateSlide(selectedSlide.id, 'subtitle', v)} />
                  <SmartField label="ট্যাগ" value={selectedSlide.tag} onChange={v => updateSlide(selectedSlide.id, 'tag', v)} />
                  <SmartField label="ট্যাগ আইকন" value={selectedSlide.tagIcon} onChange={v => updateSlide(selectedSlide.id, 'tagIcon', v)} small />
                  <SmartField label="ব্যাজ" value={selectedSlide.badge} onChange={v => updateSlide(selectedSlide.id, 'badge', v)} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <SmartField label="মূল্য" value={selectedSlide.price} onChange={v => updateSlide(selectedSlide.id, 'price', v)} />
                  <SmartField label="আসল মূল্য" value={selectedSlide.original} onChange={v => updateSlide(selectedSlide.id, 'original', v)} />
                  <SmartField label="ছাড় %" value={selectedSlide.off} onChange={v => updateSlide(selectedSlide.id, 'off', v)} />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">বিবরণ</label>
                  <textarea value={selectedSlide.desc} rows={2}
                    onChange={e => updateSlide(selectedSlide.id, 'desc', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SmartField label="ইমোজি আইকন" value={selectedSlide.emoji} onChange={v => updateSlide(selectedSlide.id, 'emoji', v)} small />
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1 block">
                      <ImageIcon size={10} /> লোগো URL <span className="text-[9px] text-muted-foreground/60">(ঐচ্ছিক)</span>
                    </label>
                    <input value={selectedSlide.logoImg || ''} onChange={e => updateSlide(selectedSlide.id, 'logoImg', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    {selectedSlide.logoImg && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <img src={selectedSlide.logoImg} alt="" className="w-7 h-7 object-contain rounded border border-border" />
                        <button onClick={() => updateSlide(selectedSlide.id, 'logoImg', '')} className="text-[10px] text-destructive hover:underline">রিমুভ</button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1 block">
                    <Link2 size={10} /> প্রোডাক্ট লিংক (slug)
                  </label>
                  <div className="flex">
                    <span className="bg-muted/40 border border-r-0 border-border rounded-l-lg px-2 py-2 text-[10px] text-muted-foreground font-mono">/product/</span>
                    <input value={selectedSlide.productSlug}
                      onChange={e => updateSlide(selectedSlide.id, 'productSlug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="product-slug"
                      className="flex-1 bg-background border border-border rounded-r-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">অ্যাকসেন্ট কালার ১</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={hslToHex(selectedSlide.accentFrom)}
                        onChange={e => updateSlide(selectedSlide.id, 'accentFrom', hexToHsl(e.target.value))}
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer shrink-0" />
                      <input value={selectedSlide.accentFrom} onChange={e => updateSlide(selectedSlide.id, 'accentFrom', e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">অ্যাকসেন্ট কালার ২</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={hslToHex(selectedSlide.accentTo)}
                        onChange={e => updateSlide(selectedSlide.id, 'accentTo', hexToHsl(e.target.value))}
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer shrink-0" />
                      <input value={selectedSlide.accentTo} onChange={e => updateSlide(selectedSlide.id, 'accentTo', e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-muted-foreground">ফিচার পিলস</label>
                    <button onClick={() => addFeature(selectedSlide.id)} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5"><Plus size={10} /> যোগ</button>
                  </div>
                  <div className="space-y-1.5">
                    {selectedSlide.features.map((feat, fi) => (
                      <div key={fi} className="flex gap-2 items-center">
                        <input value={feat} onChange={e => updateFeature(selectedSlide.id, fi, e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary" />
                        <button onClick={() => removeFeature(selectedSlide.id, fi)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
              <Pencil size={28} className="text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">বাম পাশ থেকে একটি স্লাইড সিলেক্ট করুন এডিট করতে</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🎨 ব্যাকগ্রাউন্ড</div>
            <div className="flex gap-2 flex-wrap">
              {(['default', 'color', 'gradient'] as const).map(t => (
                <button key={t} onClick={() => setBgSettings(p => ({ ...p, bgType: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${bgSettings.bgType === t ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border border-border text-muted-foreground hover:text-foreground'
                    }`}>
                  {t === 'default' ? 'ডিফল্ট' : t === 'color' ? 'সলিড কালার' : 'গ্রেডিয়েন্ট'}
                </button>
              ))}
            </div>
            {bgSettings.bgType === 'color' && (
              <div className="flex gap-2 items-center">
                <input type="color" value={bgSettings.bgColor} onChange={e => setBgSettings(p => ({ ...p, bgColor: e.target.value }))}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer" />
                <input value={bgSettings.bgColor} onChange={e => setBgSettings(p => ({ ...p, bgColor: e.target.value }))}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
              </div>
            )}
            {bgSettings.bgType === 'gradient' && (
              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex gap-1.5 items-center">
                  <input type="color" value={bgSettings.bgGradientFrom} onChange={e => setBgSettings(p => ({ ...p, bgGradientFrom: e.target.value }))}
                    className="w-7 h-7 rounded-md border border-border cursor-pointer" />
                  <input value={bgSettings.bgGradientFrom} onChange={e => setBgSettings(p => ({ ...p, bgGradientFrom: e.target.value }))}
                    className="w-24 bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground">→</span>
                <div className="flex gap-1.5 items-center">
                  <input type="color" value={bgSettings.bgGradientTo} onChange={e => setBgSettings(p => ({ ...p, bgGradientTo: e.target.value }))}
                    className="w-7 h-7 rounded-md border border-border cursor-pointer" />
                  <input value={bgSettings.bgGradientTo} onChange={e => setBgSettings(p => ({ ...p, bgGradientTo: e.target.value }))}
                    className="w-24 bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-primary" />
                </div>
                <div className="w-16 h-7 rounded-md" style={{ background: `linear-gradient(90deg, ${bgSettings.bgGradientFrom}, ${bgSettings.bgGradientTo})` }} />
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🛡️ ট্রাস্ট সিগনালস</div>
            {trust.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={t.icon} onChange={e => setTrust(p => p.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
                  className="w-10 bg-background border border-border rounded-lg px-1 py-1.5 text-center text-sm focus:outline-none focus:border-primary" />
                <input value={t.text} onChange={e => setTrust(p => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                <button onClick={() => setTrust(p => p.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
              </div>
            ))}
            <button onClick={() => setTrust(p => [...p, { text: 'New', icon: '✅' }])}
              className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"><Plus size={10} /> যোগ</button>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🪄 ফ্লোটিং কার্ডস <span className="text-[9px] font-normal">(সর্বোচ্চ ৩)</span></div>
            {floating.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={f.icon} onChange={e => setFloating(p => p.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
                  className="w-10 bg-background border border-border rounded-lg px-1 py-1.5 text-center text-sm focus:outline-none focus:border-primary" />
                <input value={f.value} onChange={e => setFloating(p => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                  className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-primary" />
                <input value={f.label} onChange={e => setFloating(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                <button onClick={() => setFloating(p => p.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
              </div>
            ))}
            {floating.length < 3 && (
              <button onClick={() => setFloating(p => [...p, { label: 'New', value: '0+', icon: '📊' }])}
                className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"><Plus size={10} /> যোগ</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════ Mini Components ═══════════════════ */

const SmartField = ({ label, value, onChange, small }: { label: string; value: string; onChange: (v: string) => void; small?: boolean }) => (
  <div>
    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${small ? 'text-lg text-center' : 'text-sm'
        }`} />
  </div>
);

/* ── Live Preview (simplified hero card) ── */
const MiniSlidePreview = ({ slide }: { slide: Slide }) => {
  const bgFrom = slide.accentFrom || 'hsl(258,78%,55%)';
  const bgTo = slide.accentTo || 'hsl(200,90%,48%)';

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${bgFrom}08, ${bgTo}05)` }}>
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex gap-2 justify-center sm:justify-start">
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white"
              style={{ background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` }}>
              {slide.tagIcon} {slide.tag}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full"
              style={{ background: `${bgFrom}10`, border: `1px solid ${bgFrom}25`, color: bgFrom }}>
              {slide.badge}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">{slide.title}</h2>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight"
              style={{ background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {slide.titleAccent}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{slide.subtitle}</p>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-sm">{slide.desc}</p>

          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {slide.features.map(f => (
              <span key={f} className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: `${bgFrom}08`, border: `1px solid ${bgFrom}18`, color: bgFrom }}>
                <CheckCircle2 size={9} /> {f}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xs line-through text-muted-foreground">{slide.original}</span>
            <span className="text-xl font-black text-foreground">{slide.price}</span>
            <span className="text-[10px] font-black text-white px-2 py-1 rounded-full"
              style={{ background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` }}>
              {slide.off.startsWith('-') ? slide.off : `-${slide.off}`} OFF
            </span>
          </div>

          <div className="flex gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` }}>
              <ShoppingBag size={12} /> Buy Now <ArrowRight size={10} />
            </span>
          </div>
        </div>

        <div className="w-40 h-48 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(248,246,255,0.9))',
            border: `1.5px solid ${bgFrom}20`,
            boxShadow: `0 16px 48px ${bgFrom}15`,
          }}>
          <div className="text-center space-y-2">
            {slide.logoImg
              ? <img src={slide.logoImg} alt="" className="w-12 h-12 object-contain mx-auto" />
              : <span className="text-4xl block">{slide.emoji}</span>}
            <div>
              <p className="text-xs font-black text-foreground">{slide.title}</p>
              <p className="text-[10px] font-bold" style={{ color: bgFrom }}>{slide.titleAccent}</p>
            </div>
            <p className="text-sm font-black text-foreground">{slide.price}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════ Color Helpers ═══════════════════ */
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
  } catch { return 'hsl(258,78%,55%)'; }
}

export default AdminHeroBanner;
