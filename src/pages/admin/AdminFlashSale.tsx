import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Flame, Save, Timer, Plus, Trash2, Search, X, ToggleLeft, ToggleRight } from 'lucide-react';

type FlashSettings = {
  enabled: boolean;
  title: string;
  subtitle: string;
  endDate: string; // ISO date string
  maxProducts: number;
  pinnedProductIds: string[];
};

const DEFAULT: FlashSettings = {
  enabled: true,
  title: 'Biggest Discounts Today',
  subtitle: 'Top deals sorted by highest savings — grab them before time runs out!',
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  maxProducts: 8,
  pinnedProductIds: [],
};

const AdminFlashSale = () => {
  const [settings, setSettings] = useState<FlashSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [settingsRes, pinnedRes] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'flash_sale_settings').maybeSingle(),
      supabase.from('products').select('id, name, slug, price, original_price, discount_percent, image_url').eq('status', 'active').order('discount_percent', { ascending: false }).limit(20),
    ]);
    if (settingsRes.data?.value) {
      try { setSettings(JSON.parse(settingsRes.data.value)); } catch {}
    }
    setProducts(pinnedRes.data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'flash_sale_settings', value: JSON.stringify(settings) }, { onConflict: 'key' });
    toast.success('Flash Sale সেটিংস সেভ হয়েছে!');
    setSaving(false);
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from('products').select('id, name, price, original_price, discount_percent, image_url').eq('status', 'active').ilike('name', `%${q}%`).limit(8);
    setSearchResults(data || []);
    setSearching(false);
  };

  const pinProduct = (id: string) => {
    if (settings.pinnedProductIds.includes(id)) return;
    setSettings(p => ({ ...p, pinnedProductIds: [...p.pinnedProductIds, id] }));
    setSearch('');
    setSearchResults([]);
  };

  const unpinProduct = (id: string) => {
    setSettings(p => ({ ...p, pinnedProductIds: p.pinnedProductIds.filter(x => x !== id) }));
  };

  const pinnedProducts = products.filter(p => settings.pinnedProductIds.includes(p.id));
  const addFromSearch = searchResults.find(r => true);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Flash Sale <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">হোমপেজের ফ্ল্যাশ সেল সেকশন কন্ট্রোল করুন</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Enable/Disable */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="font-bold text-foreground">Flash Sale সেকশন</div>
          <div className="text-xs text-muted-foreground mt-0.5">হোমপেজে ফ্ল্যাশ সেল দেখানো বা লুকানো</div>
        </div>
        <button onClick={() => setSettings(p => ({ ...p, enabled: !p.enabled }))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${settings.enabled ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-card text-muted-foreground'}`}>
          {settings.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {settings.enabled ? 'চালু' : 'বন্ধ'}
        </button>
      </div>

      {/* Content Settings */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Flame size={16} className="text-orange-400" /> কন্টেন্ট সেটিংস</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">শিরোনাম (Title)</label>
            <input value={settings.title} onChange={e => setSettings(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">সর্বোচ্চ প্রোডাক্ট সংখ্যা</label>
            <input type="number" min={1} max={20} value={settings.maxProducts}
              onChange={e => setSettings(p => ({ ...p, maxProducts: Number(e.target.value) }))}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1.5 block">সাব-টাইটেল</label>
            <input value={settings.subtitle} onChange={e => setSettings(p => ({ ...p, subtitle: e.target.value }))}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Timer size={16} className="text-primary" /> কাউন্টডাউন টাইমার</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">সেল শেষের তারিখ ও সময়</label>
          <input type="datetime-local" value={settings.endDate}
            onChange={e => setSettings(p => ({ ...p, endDate: e.target.value }))}
            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        {settings.endDate && (
          <div className="flex items-center gap-3 mt-2">
            <div className="text-sm text-muted-foreground">সেল শেষ হবে:</div>
            <div className="text-sm font-semibold text-primary">{new Date(settings.endDate).toLocaleString('bn-BD')}</div>
          </div>
        )}
      </div>

      {/* Pinned Products */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Flame size={16} className="text-orange-400" /> পিন করা প্রোডাক্ট (ঐচ্ছিক)</h3>
        <p className="text-xs text-muted-foreground">যদি কোনো প্রোডাক্ট পিন না করেন, তাহলে সবচেয়ে বেশি ছাড়ের প্রোডাক্টগুলো অটোমেটিক দেখাবে।</p>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="প্রোডাক্ট খুঁজুন..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          {search && (
            <button onClick={() => { setSearch(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="bg-muted/20 rounded-xl border border-border overflow-hidden">
            {searchResults.map(p => (
              <button key={p.id} onClick={() => pinProduct(p.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left border-b border-border/30 last:border-0">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">৳{p.price} {p.discount_percent ? `(-${p.discount_percent}%)` : ''}</div>
                </div>
                <Plus size={14} className="text-primary flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Pinned list */}
        {pinnedProducts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">পিন করা প্রোডাক্টস ({pinnedProducts.length})</div>
            {pinnedProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">৳{p.price} {p.discount_percent ? `(-${p.discount_percent}%)` : ''}</div>
                </div>
                <button onClick={() => unpinProduct(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {settings.pinnedProductIds.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm bg-muted/10 rounded-xl border border-dashed border-border">
            কোনো প্রোডাক্ট পিন করা নেই — সবচেয়ে বেশি ছাড়ের প্রোডাক্ট অটোমেটিক দেখাবে
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFlashSale;
