import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link2, Save, Check, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';

const AdminSlugEditor = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [slugEdits, setSlugEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('products').select('id, name, slug, status').order('name').then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  const getSlug = (id: string) => slugEdits[id] ?? products.find(p => p.id === id)?.slug ?? '';
  const sanitize = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const save = async (product: any) => {
    const newSlug = getSlug(product.id);
    if (!newSlug) return toast.error('Slug cannot be empty');
    if (newSlug === product.slug) return toast.info('No changes made');
    // Check uniqueness
    const { data: existing } = await supabase.from('products').select('id').eq('slug', newSlug).neq('id', product.id);
    if (existing && existing.length > 0) return toast.error('This slug is already used by another product');
    setSaving(product.id);
    await supabase.from('products').update({ slug: newSlug }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, slug: newSlug } : p));
    setSaving(null); setSaved(product.id);
    setTimeout(() => setSaved(null), 2000);
    toast.success('Slug updated! Remember to add a redirect for the old URL.');
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            URL Slug <span className="gradient-text">Editor</span>
          </h1>
          <p className="text-muted-foreground text-sm">Edit URL slugs for all products</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground">{products.length} products</div>
      </div>

      <div className="glass-card rounded-xl px-4 py-3 text-xs text-yellow-400 flex items-start gap-2">
        ⚠️ Changing a slug changes the product URL. Always add a 301 redirect from the old slug to avoid broken links and SEO loss.
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
          className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 glass-card rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border grid grid-cols-3 gap-4">
            <span className="text-xs font-medium text-muted-foreground">Product</span>
            <span className="text-xs font-medium text-muted-foreground">URL Slug</span>
            <span className="text-xs font-medium text-muted-foreground">Actions</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(p => {
              const currentSlug = getSlug(p.id);
              const changed = currentSlug !== p.slug;
              return (
                <div key={p.id} className="grid grid-cols-3 gap-4 items-center px-5 py-3 hover:bg-muted/10 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${p.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">/product/</span>
                    <input
                      value={currentSlug}
                      onChange={e => setSlugEdits(prev => ({ ...prev, [p.id]: sanitize(e.target.value) }))}
                      className={`flex-1 min-w-0 bg-background border rounded-lg px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none transition-colors ${changed ? 'border-yellow-500/50 focus:border-yellow-500' : 'border-border focus:border-primary'}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => save(p)} disabled={saving === p.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60 ${changed ? 'btn-glow' : 'glass-card text-muted-foreground'}`}>
                      {saved === p.id ? <Check size={11} /> : saving === p.id ? <div className="w-3 h-3 border-2 border-current/40 border-t-current rounded-full animate-spin" /> : <Save size={11} />}
                      {saved === p.id ? 'Saved!' : 'Save'}
                    </button>
                    <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSlugEditor;
