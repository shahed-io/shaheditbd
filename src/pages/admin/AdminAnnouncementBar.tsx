import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Search, X } from 'lucide-react';

const formatBDT = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;

type ProductSearchResult = { id: string; name: string; price: number; original_price: number | null; discount_percent: number | null; slug: string };

type TickerItem = { label: string; price: string; off: string };
type AnnouncementSettings = {
  enabled: boolean;
  useLiveProducts: boolean;
  speedSeconds: number;
  bgFrom: string;
  bgTo: string;
  textColor: string;
  accentColor: string;
  liveLabel: string;
  items: TickerItem[];
};

const DEFAULT: AnnouncementSettings = {
  enabled: true,
  useLiveProducts: true,
  speedSeconds: 60,
  bgFrom: 'hsl(220,20%,97%)',
  bgTo: 'hsl(258,40%,96%)',
  textColor: 'hsl(226,35%,18%)',
  accentColor: 'hsl(258,78%,55%)',
  liveLabel: 'LIVE',
  items: [
    { label: 'Windows 11 Pro', price: '৳599', off: '-94%' },
    { label: 'Office 365 Personal', price: '৳1,999', off: '-88%' },
    { label: 'Netflix Premium', price: '৳499', off: '-81%' },
    { label: 'Adobe Creative Cloud', price: '৳599', off: '-70%' },
    { label: 'Spotify Premium', price: '৳899', off: '-60%' },
    { label: 'IDM Lifetime', price: '৳2,625', off: '-75%' },
    { label: 'NordVPN 1 Year', price: '৳1,299', off: '-80%' },
  ],
};

const AdminAnnouncementBar = () => {
  const [settings, setSettings] = useState<AnnouncementSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'announcement_bar').maybeSingle();
    if (data?.value) { try { setSettings(JSON.parse(data.value)); } catch {} }
    setLoading(false);
  };

  // Search products debounced
  useEffect(() => {
    if (!showSearch) return;
    const t = setTimeout(async () => {
      setSearching(true);
      let q = supabase.from('products')
        .select('id, name, price, original_price, discount_percent, slug')
        .eq('status', 'active')
        .limit(20);
      if (searchQuery.trim()) q = q.ilike('name', `%${searchQuery.trim()}%`);
      else q = q.order('total_sales', { ascending: false });
      const { data } = await q;
      setSearchResults((data as any) || []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, showSearch]);

  const addProductAsItem = (p: ProductSearchResult) => {
    const price = Number(p.price) || 0;
    const original = Number(p.original_price) || 0;
    let off = 0;
    if (p.discount_percent && p.discount_percent > 0) off = p.discount_percent;
    else if (original > price && price > 0) off = Math.round(((original - price) / original) * 100);
    setSettings(prev => ({
      ...prev,
      items: [...prev.items, {
        label: p.name,
        price: formatBDT(price),
        off: off > 0 ? `-${off}%` : '',
      }],
    }));
    toast.success(`'${p.name}' যোগ হয়েছে`);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'announcement_bar', value: JSON.stringify(settings) }, { onConflict: 'key' });
    toast.success('অ্যানাউন্সমেন্ট বার সেভ হয়েছে!');
    setSaving(false);
  };

  const updateItem = (i: number, field: keyof TickerItem, v: string) =>
    setSettings(p => { const items = [...p.items]; items[i] = { ...items[i], [field]: v }; return { ...p, items }; });

  const addItem = () =>
    setSettings(p => ({ ...p, items: [...p.items, { label: 'নতুন আইটেম', price: '৳000', off: '-00%' }] }));

  const removeItem = (i: number) =>
    setSettings(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const moveItem = (i: number, dir: -1 | 1) => {
    setSettings(p => {
      const items = [...p.items];
      const ni = i + dir;
      if (ni < 0 || ni >= items.length) return p;
      [items[i], items[ni]] = [items[ni], items[i]];
      return { ...p, items };
    });
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Announcement <span className="gradient-text">Bar</span>
          </h1>
          <p className="text-muted-foreground text-sm">হোমপেজের স্ক্রলিং টিকার ব্যানার কন্ট্রোল করুন</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Enable/Disable */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="font-bold text-foreground">Ticker Bar দেখানো</div>
          <div className="text-xs text-muted-foreground mt-0.5">হোমপেজের হিরো ব্যানারের নিচের স্ক্রলিং বার</div>
        </div>
        <button onClick={() => setSettings(p => ({ ...p, enabled: !p.enabled }))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${settings.enabled ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-card text-muted-foreground'}`}>
          {settings.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {settings.enabled ? 'চালু' : 'বন্ধ'}
        </button>
      </div>

      {/* Behavior Settings */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-bold text-foreground">ডেটা সোর্স</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {settings.useLiveProducts ? 'ডাটাবেস থেকে লাইভ প্রোডাক্ট দেখাবে (নিচের আইটেম তালিকা ব্যবহার হবে না)' : 'নিচের ম্যানুয়াল আইটেম তালিকা দেখাবে'}
            </div>
          </div>
          <button onClick={() => setSettings(p => ({ ...p, useLiveProducts: !p.useLiveProducts }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${settings.useLiveProducts ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-card text-muted-foreground'}`}>
            {settings.useLiveProducts ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {settings.useLiveProducts ? 'Live Products' : 'Manual Items'}
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-foreground">স্ক্রল স্পিড</label>
            <span className="text-xs text-muted-foreground font-mono">{settings.speedSeconds}s / loop</span>
          </div>
          <input type="range" min={20} max={180} step={5}
            value={settings.speedSeconds}
            onChange={e => setSettings(p => ({ ...p, speedSeconds: Number(e.target.value) }))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>দ্রুত (20s)</span>
            <span>স্বাভাবিক (60s)</span>
            <span>ধীর (180s)</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl overflow-hidden border border-border">
        <div className="text-xs text-muted-foreground px-4 py-2 bg-muted/20 border-b border-border font-medium">প্রিভিউ</div>
        <div className="relative overflow-hidden py-3 px-4 flex items-center gap-4"
          style={{ background: `linear-gradient(135deg, ${settings.bgFrom}, ${settings.bgTo})` }}>
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full text-white flex-shrink-0"
            style={{ background: settings.accentColor }}>
            ⚡ {settings.liveLabel}
          </span>
          <div className="flex gap-4 overflow-hidden">
            {settings.items.slice(0, 4).map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-[12px] whitespace-nowrap">
                <span className="font-semibold" style={{ color: settings.textColor }}>{item.label}</span>
                <span className="font-bold" style={{ color: settings.accentColor }}>{item.price}</span>
                <span className="font-bold text-[11px] px-2 py-0.5 rounded-full text-white" style={{ background: settings.accentColor }}>{item.off}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Style Settings */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Megaphone size={16} /> স্টাইল সেটিংস</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'ব্যাকগ্রাউন্ড From', key: 'bgFrom' as const },
            { label: 'ব্যাকগ্রাউন্ড To', key: 'bgTo' as const },
            { label: 'টেক্সট কালার', key: 'textColor' as const },
            { label: 'অ্যাকসেন্ট কালার', key: 'accentColor' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
                  style={{ background: settings[key] }} />
                <input value={settings[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
                  className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono" />
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-xs">
          <label className="text-xs text-muted-foreground mb-1.5 block">LIVE লেবেল টেক্সট</label>
          <input value={settings.liveLabel} onChange={e => setSettings(p => ({ ...p, liveLabel: e.target.value }))}
            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Items */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">টিকার আইটেমস ({settings.items.length})</h3>
          <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-primary px-3 py-1.5 rounded-xl glass-card hover:border-primary/40 transition-all">
            <Plus size={12} /> আইটেম যোগ করুন
          </button>
        </div>

        <div className="space-y-2">
          {settings.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-muted/20 rounded-xl px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <ArrowUp size={10} />
                </button>
                <button onClick={() => moveItem(i, 1)} disabled={i === settings.items.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <ArrowDown size={10} />
                </button>
              </div>
              <input value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="প্রোডাক্ট নাম"
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none" />
              <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="৳000"
                className="w-20 bg-transparent text-sm text-foreground focus:outline-none text-center font-mono" />
              <input value={item.off} onChange={e => updateItem(i, 'off', e.target.value)} placeholder="-00%"
                className="w-16 bg-transparent text-sm text-foreground focus:outline-none text-center font-mono" />
              <button onClick={() => removeItem(i)} className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncementBar;
