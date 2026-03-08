import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';

const mapProduct = (p: any): Product => ({
  id:            p.id,
  name:          p.name,
  category:      p.categories?.name || 'Other',
  price:         Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount:      p.discount_percent || undefined,
  rating:        4.8,
  reviews:       p.total_sales || Math.floor(Math.random() * 300) + 50,
  image:         p.image_url || 'https://placehold.co/300x300/111/D97706?text=Product',
  isBestseller:  p.is_featured,
  isNew:         new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const LIMIT = 8;

const TopProducts = () => {
  const [activeTab,     setActiveTab]     = useState('All');
  const [products,      setProducts]      = useState<Product[]>([]);
  const [tabs,          setTabs]          = useState<string[]>(['All']);
  const [loading,       setLoading]       = useState(true);
  const [expandedCats,  setExpandedCats]  = useState<Record<string, boolean>>({});
  const [error,         setError]         = useState(false);
  const [retry,         setRetry]         = useState(0);

  useEffect(() => {
    const load = async (attempt = 0) => {
      setLoading(true); setError(false);
      try {
        const { data, error: err } = await supabase
          .from('products')
          .select('*, categories(name, sort_order)')
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (err) throw err;
        if (data?.length) {
          setProducts(data.map(mapProduct));
          const map = new Map<string, number>();
          data.forEach(p => { if (p.categories?.name) map.set(p.categories.name, p.categories.sort_order ?? 999); });
          const sorted = [...map.entries()].sort((a, b) => a[1] - b[1]).map(([n]) => n);
          setTabs(['All', ...sorted]);
        }
      } catch {
        if (attempt < 2) { setTimeout(() => load(attempt + 1), 1000 * (attempt + 1)); return; }
        setError(true);
      } finally { setLoading(false); }
    };
    load();
  }, [retry]);

  const filtered  = activeTab === 'All' ? products : products.filter(p => p.category === activeTab);
  const catOrder  = tabs.filter(t => t !== 'All');
  const toggleCat = (c: string) => setExpandedCats(p => ({ ...p, [c]: !p[c] }));

  return (
    <section className="py-20 px-4 sm:px-6"
      style={{ borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(0,0%,5%)' }}>
      <div className="max-w-screen-xl mx-auto">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="section-eyebrow mb-2">// Products</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Top <span style={{ color: 'var(--gold)' }}>Selling</span> Products
            </h2>
            <span className="divider-gold" />
          </div>
          <div className="flex items-center gap-1.5">
            <LayoutGrid size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{products.length} products</span>
          </div>
        </div>

        {/* Category tab bar */}
        <div className="flex flex-wrap gap-2 mb-10 pb-6"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded text-sm font-semibold transition-all duration-200"
              style={
                activeTab === tab
                  ? { backgroundColor: 'var(--gold)', color: 'hsl(0,0%,5%)', fontFamily: 'Syne, sans-serif' }
                  : { backgroundColor: 'var(--surface-1)', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
              }
              onMouseEnter={e => { if (activeTab !== tab) (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
              onMouseLeave={e => { if (activeTab !== tab) (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">প্রোডাক্ট লোড করতে সমস্যা হচ্ছে।</p>
            <button onClick={() => setRetry(c => c + 1)}
              className="btn-gold px-6 py-2.5 rounded text-sm">পুনরায় চেষ্টা করুন</button>
          </div>
        )}

        {/* Loading skeleton */}
        {!error && loading && (
          <div className="space-y-10">
            {[0, 1].map(g => (
              <div key={g}>
                <div className="h-6 w-32 rounded animate-pulse mb-5" style={{ backgroundColor: 'var(--surface-2)' }} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-lg animate-pulse"
                      style={{ height: '20rem', backgroundColor: 'var(--surface-1)', border: '1px solid hsl(var(--border))' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Products — grouped by category */}
        {!error && !loading && activeTab === 'All' && (
          <div className="space-y-14">
            {catOrder.map(cat => {
              const items      = products.filter(p => p.category === cat);
              if (!items.length) return null;
              const expanded   = !!expandedCats[cat];
              const visible    = expanded ? items : items.slice(0, LIMIT);
              const hasMore    = items.length > LIMIT;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold flex items-center gap-3"
                      style={{ fontFamily: 'Syne, sans-serif' }}>
                      <span className="inline-block w-1 h-5 rounded-sm" style={{ backgroundColor: 'var(--gold)' }} />
                      {cat}
                      <span className="text-xs font-normal px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--surface-2)', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                        {items.length}
                      </span>
                    </h3>
                    <button onClick={() => setActiveTab(cat)}
                      className="text-xs font-bold transition-colors"
                      style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}>
                      VIEW ALL →
                    </button>
                  </div>

                  {/* Mobile horizontal scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 md:hidden" style={{ scrollbarWidth: 'none' }}>
                    {items.map((p, i) => (
                      <div key={p.id} className="flex-shrink-0 w-44">
                        <ProductCard product={p} delay={i * 0.04} />
                      </div>
                    ))}
                  </div>

                  {/* Desktop grid */}
                  <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
                    {visible.map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.04} />)}
                  </div>

                  {hasMore && (
                    <div className="hidden md:flex justify-center mt-6">
                      <button
                        onClick={() => toggleCat(cat)}
                        className="btn-outline flex items-center gap-2 px-6 py-2.5 rounded text-sm">
                        {expanded ? <><ChevronUp size={14} /> কম দেখুন</> : <><ChevronDown size={14} /> আরও {items.length - LIMIT}টি দেখুন</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Filtered view */}
        {!error && !loading && activeTab !== 'All' && (
          <div>
            <p className="text-sm text-muted-foreground mb-5">{filtered.length}টি প্রোডাক্ট পাওয়া গেছে</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} delay={Math.min(i * 0.035, 0.35)} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopProducts;
