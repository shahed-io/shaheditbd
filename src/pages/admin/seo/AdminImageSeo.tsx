import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon, Save, Check, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const AdminImageSeo = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [alts, setAlts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'missing'>('all');

  useEffect(() => {
    supabase.from('products').select('id, name, slug, image_url, seo_title').order('name').then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  // We store alt text as part of product seo via site_settings keyed by product id
  const getAlt = (p: any) => alts[p.id] ?? p.seo_title ?? '';
  
  const save = async (product: any) => {
    setSaving(product.id);
    // Save alt text as seo_title if not set (repurpose seo_title as alt text hint)
    const altText = alts[product.id] ?? '';
    await supabase.from('products').update({ seo_title: altText || product.name }).eq('id', product.id);
    setSaving(null); setSaved(product.id);
    setTimeout(() => setSaved(null), 2000);
    toast.success('Alt text saved!');
  };

  const filtered = products
    .filter(p => filter === 'missing' ? !p.image_url : true)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const withImage = products.filter(p => p.image_url).length;
  const noImage = products.length - withImage;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Image <span className="gradient-text">SEO</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage product images and alt text for better SEO</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="text-green-400 font-bold">{withImage}</span><span className="text-muted-foreground">with image</span>
            {noImage > 0 && <><span className="text-muted-foreground">·</span><span className="text-red-400 font-bold">{noImage}</span><span className="text-muted-foreground">missing</span></>}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div className="flex glass-card rounded-xl overflow-hidden border border-border">
          {(['all', 'missing'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-medium transition-colors capitalize ${filter === f ? 'btn-glow text-white' : 'text-muted-foreground hover:text-foreground'}`}>
              {f === 'all' ? 'All Products' : `Missing Image (${noImage})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className={`glass-card rounded-2xl p-4 ${!p.image_url ? 'border-red-500/20' : ''}`}>
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center border border-border">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    : <AlertTriangle size={20} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    {!p.image_url && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium flex-shrink-0">No Image</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground flex-shrink-0">Alt Text:</label>
                    <input
                      value={getAlt(p)}
                      onChange={e => setAlts(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder={`${p.name} — Shahed Store`}
                      className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <button onClick={() => save(p)} disabled={saving === p.id}
                      className="flex-shrink-0 btn-glow px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-60">
                      {saved === p.id ? <Check size={11} /> : saving === p.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={11} />}
                      {saved === p.id ? 'Saved!' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">{filter === 'missing' ? 'All products have images! 🎉' : 'No products found'}</div>}
        </div>
      )}
    </div>
  );
};

export default AdminImageSeo;
