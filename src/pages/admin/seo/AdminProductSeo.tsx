import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PackageSearch, Save, Check, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const AdminProductSeo = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, { seo_title: string; seo_description: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('products').select('id, name, slug, seo_title, seo_description, status').order('name').then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  const get = (id: string, field: 'seo_title' | 'seo_description') =>
    edits[id]?.[field] ?? (products.find(p => p.id === id)?.[field] || '');

  const set = (id: string, field: 'seo_title' | 'seo_description', value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], ...{ seo_title: get(id, 'seo_title'), seo_description: get(id, 'seo_description') }, [field]: value } }));

  const save = async (product: any) => {
    setSaving(product.id);
    await supabase.from('products').update({ seo_title: get(product.id, 'seo_title'), seo_description: get(product.id, 'seo_description') }).eq('id', product.id);
    setSaving(null); setSaved(product.id);
    setTimeout(() => setSaved(null), 2000);
    toast.success(`"${product.name}" SEO updated`);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));
  const withSeo = products.filter(p => p.seo_title || p.seo_description).length;
  const missing = products.length - withSeo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Product <span className="gradient-text">SEO</span>
          </h1>
          <p className="text-muted-foreground text-sm">Bulk manage SEO title & description for all products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="text-green-400 font-bold">{withSeo}</span> <span className="text-muted-foreground">configured</span>
            {missing > 0 && <><span className="text-muted-foreground">·</span><span className="text-red-400 font-bold">{missing}</span><span className="text-muted-foreground">missing</span></>}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name or slug…"
          className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const titleVal = get(p.id, 'seo_title');
            const descVal = get(p.id, 'seo_description');
            const titleLen = titleVal.length;
            const descLen = descVal.length;
            const isSaved = saved === p.id;
            const hasSeo = titleVal || descVal;

            return (
              <div key={p.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground">{p.name}</h3>
                      {!hasSeo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">Missing SEO</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${p.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                    </div>
                    <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1 w-fit">
                      /product/{p.slug} <ExternalLink size={10} />
                    </a>
                  </div>
                  <button onClick={() => save(p)} disabled={saving === p.id}
                    className="flex-shrink-0 btn-glow px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-60">
                    {isSaved ? <Check size={12} /> : saving === p.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={12} />}
                    {isSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-muted-foreground">SEO Title</label>
                      <span className={`text-[10px] font-mono ${titleLen > 60 ? 'text-red-400' : titleLen > 50 ? 'text-yellow-400' : titleLen > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>{titleLen}/60</span>
                    </div>
                    <input value={titleVal} onChange={e => set(p.id, 'seo_title', e.target.value)}
                      placeholder={`${p.name} | Shahed Store`}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-muted-foreground">Meta Description</label>
                      <span className={`text-[10px] font-mono ${descLen > 160 ? 'text-red-400' : descLen > 140 ? 'text-yellow-400' : descLen > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>{descLen}/160</span>
                    </div>
                    <input value={descVal} onChange={e => set(p.id, 'seo_description', e.target.value)}
                      placeholder="Brief description for search engines…"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">No products match your search</div>}
        </div>
      )}
    </div>
  );
};

export default AdminProductSeo;
