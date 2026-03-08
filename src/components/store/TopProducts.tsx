import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { Database, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

const mapProduct = (p: any): Product => ({
  id:            p.id,
  name:          p.name,
  category:      p.categories?.name || 'Other',
  price:         Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount:      p.discount_percent || undefined,
  rating:        4.8,
  reviews:       p.total_sales || Math.floor(Math.random() * 300) + 50,
  image:         p.image_url || 'https://placehold.co/300x300/0d1117/00d4ff?text=Product',
  isBestseller:  p.is_featured,
  isNew:         new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const LIMIT = 8;

const TopProducts = () => {
  const [activeTab,    setActiveTab]    = useState('All');
  const [products,     setProducts]     = useState<Product[]>([]);
  const [tabs,         setTabs]         = useState<string[]>(['All']);
  const [loading,      setLoading]      = useState(true);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [error,        setError]        = useState(false);
  const [retry,        setRetry]        = useState(0);

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
    <section className="py-24 px-4 sm:px-6 relative"
      style={{ borderTop: '1px solid hsl(var(--border))' }}>

      {/* Subtle grid */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      <div className="max-w-screen-xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Database size={14} style={{ color: 'var(--cyan)' }} />
              <span className="section-tag">// Product Database</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black section-title">
              <span className="text-foreground">Top</span>
              <span className="gradient-text-cyber ml-3">Selling</span>
            </h2>
            <div className="divider-cyber mt-3" />
          </div>
          <div className="flex items-center gap-2 text-xs"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
            <Terminal size={12} style={{ color: 'var(--cyan)' }} />
            {products.length} products indexed
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-10 pb-6"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-250"
              style={
                activeTab === tab
                  ? {
                      background: 'linear-gradient(135deg, hsla(185,100%,50%,0.2), hsla(270,80%,60%,0.2))',
                      border: '1px solid var(--cyan)',
                      color: 'var(--cyan)',
                      fontFamily: 'JetBrains Mono, monospace',
                      boxShadow: '0 0 10px hsla(185,100%,50%,0.2)',
                    }
                  : {
                      background: 'hsl(220,18%,7%)',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: 'JetBrains Mono, monospace',
                    }
              }
              onMouseEnter={e => { if (activeTab !== tab) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'; } }}
              onMouseLeave={e => { if (activeTab !== tab) { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; } }}
            >
              {activeTab === tab && <span className="mr-1.5" style={{ color: 'var(--cyan)' }}>›</span>}
              {tab}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20 space-y-4">
            <div className="text-4xl font-black" style={{ fontFamily: 'Orbitron, sans-serif', color: 'hsl(var(--border))' }}>
              ERROR_404
            </div>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              // প্রোডাক্ট লোড করতে সমস্যা হচ্ছে
            </p>
            <button onClick={() => setRetry(c => c + 1)}
              className="btn-cyber px-6 py-2.5 rounded-lg text-xs">
              RETRY_CONNECTION
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {!error && loading && (
          <div className="space-y-12">
            {[0, 1].map(g => (
              <div key={g}>
                <div className="h-5 w-28 rounded-lg animate-pulse mb-5" style={{ background: 'hsl(220,15%,12%)' }} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-xl animate-pulse"
                      style={{ height: '22rem', background: 'hsl(220,15%,10%)', border: '1px solid hsl(var(--border))' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Products — grouped */}
        {!error && !loading && activeTab === 'All' && (
          <div className="space-y-16">
            {catOrder.map(cat => {
              const items    = products.filter(p => p.category === cat);
              if (!items.length) return null;
              const expanded = !!expandedCats[cat];
              const visible  = expanded ? items : items.slice(0, LIMIT);
              const hasMore  = items.length > LIMIT;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-3"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      <div className="h-5 w-0.5 rounded-full"
                        style={{ background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
                      <span className="text-foreground">{cat}</span>
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'hsl(220,15%,12%)', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'JetBrains Mono, monospace' }}>
                        {items.length}
                      </span>
                    </h3>
                    <button onClick={() => setActiveTab(cat)}
                      className="text-[10px] font-bold transition-colors"
                      style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                      VIEW_ALL →
                    </button>
                  </div>

                  {/* Mobile scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 md:hidden scrollbar-hide">
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
                      <button onClick={() => toggleCat(cat)}
                        className="btn-cyber-outline flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs">
                        {expanded
                          ? <><ChevronUp size={13} /> COLLAPSE</>
                          : <><ChevronDown size={13} /> LOAD_MORE ({items.length - LIMIT})</>}
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
            <p className="text-xs mb-6" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
              <span style={{ color: 'var(--cyan)' }}>$</span> query --category="{activeTab}" -- {filtered.length} results found
            </p>
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
