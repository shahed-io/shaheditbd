import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { ArrowRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const mapProduct = (p: any): Product => ({
  id:            p.id,
  slug:          p.slug,
  name:          p.name,
  category:      p.categories?.name || 'Other',
  price:         Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount:      p.discount_percent || undefined,
  rating:        4.8,
  reviews:       p.total_sales || Math.floor(Math.random() * 300) + 50,
  image:         p.image_url || 'https://placehold.co/300x300/1e2030/6366f1?text=Product',
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
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data, error: err } = await supabase
          .from('products')
          .select('*, categories(name, sort_order)')
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .limit(200);
        if (cancelled) return;
        if (err) throw err;
        const rows = data ?? [];
        setProducts(rows.map(mapProduct));
        const map = new Map<string, number>();
        rows.forEach(p => { if (p.categories?.name) map.set(p.categories.name, p.categories.sort_order ?? 999); });
        const sorted = [...map.entries()].sort((a, b) => a[1] - b[1]).map(([n]) => n);
        setTabs(['All', ...sorted]);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [retry]);

  const filtered  = activeTab === 'All' ? products : products.filter(p => p.category === activeTab);
  const catOrder  = tabs.filter(t => t !== 'All');
  const toggleCat = (c: string) => setExpandedCats(p => ({ ...p, [c]: !p[c] }));

  return (
    <section className="py-16" style={{ background: 'hsl(222, 22%, 9%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-sora font-black text-2xl sm:text-3xl text-white">
              ⭐ Top{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Picks for You
              </span>
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'hsla(0,0%,100%,0.4)' }}>
              Handpicked bestsellers with guaranteed authenticity.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'hsla(0,0%,100%,0.35)' }}>
            <Sparkles size={14} style={{ color: 'hsl(243,75%,65%)' }} />
            {products.length} products available
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2 mb-8 pb-6" style={{ borderBottom: '1px solid hsla(0,0%,100%,0.07)' }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200"
              style={activeTab === tab
                ? { background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', color: 'white' }
                : { background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsla(0,0%,100%,0.55)' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">😕</div>
            <p style={{ color: 'hsla(0,0%,100%,0.4)' }}>Failed to load products. Please try again.</p>
            <button onClick={() => setRetry(c => c + 1)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {!error && loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} className="rounded-xl shimmer" style={{ height: '22rem', animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )}

        {/* All Products grouped */}
        {!error && !loading && activeTab === 'All' && (
          <div className="space-y-12">
            {catOrder.map((cat) => {
              const items      = products.filter(p => p.category === cat);
              if (!items.length) return null;
              const isExpanded = !!expandedCats[cat];
              const shown      = isExpanded ? items : items.slice(0, LIMIT);
              const hasMore    = items.length > LIMIT;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-sora font-bold text-lg text-white flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(243,75%,59%), hsl(263,70%,58%))' }} />
                      {cat}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'hsla(0,0%,100%,0.07)', color: 'hsla(0,0%,100%,0.4)', border: '1px solid hsla(0,0%,100%,0.1)' }}>{items.length}</span>
                    </h3>
                    <button onClick={() => setActiveTab(cat)}
                      className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                      style={{ color: 'hsl(243,75%,65%)' }}>
                      View all <ArrowRight size={13} />
                    </button>
                  </div>
                  {/* Mobile scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 md:hidden scrollbar-hide">
                    {items.map((p, i) => (
                      <div key={p.id} className="flex-shrink-0 w-48">
                        <ProductCard product={p} delay={i * 0.05} />
                      </div>
                    ))}
                  </div>
                  {/* Desktop grid */}
                  <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
                    {shown.map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.05} />)}
                  </div>
                  {hasMore && (
                    <div className="hidden md:flex justify-center mt-5">
                      <button onClick={() => toggleCat(cat)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border"
                        style={{ background: 'hsla(0,0%,100%,0.05)', borderColor: 'hsla(0,0%,100%,0.1)', color: 'hsla(0,0%,100%,0.6)' }}>
                        {isExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Load more ({items.length - LIMIT})</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Filtered by tab */}
        {!error && !loading && activeTab !== 'All' && (
          <div>
            <p className="text-sm mb-6 font-fira" style={{ color: 'hsla(0,0%,100%,0.35)' }}>{filtered.length} products in "{activeTab}"</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} delay={Math.min(i * 0.04, 0.4)} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopProducts;
