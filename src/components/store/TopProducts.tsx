import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useReveal } from '@/hooks/useReveal';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { ArrowRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const mapProduct = (p: any): Product => ({
  id:            p.id,
  slug:          p.slug,
  name:          p.name,
  category:      p.category?.name || 'Other',
  price:         Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount:      p.discount_percent || undefined,
  rating:        4.8,
  reviews:       p.total_sales || Math.floor(Math.random() * 300) + 50,
  image:         p.image_url || 'https://placehold.co/300x300/f8f9ff/6366f1?text=Product',
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
  const { ref: headerRef, visible: headerVisible } = useReveal({ threshold: 0.1 });
  const { ref: sectionRef, visible: sectionVisible } = useReveal({ threshold: 0.05 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data, error: err } = await supabase
          .from('products')
          .select('*, category:category_id(name, sort_order)')
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .limit(200);
        if (cancelled) return;
        if (err) {
          console.error('[TopProducts] Supabase error:', err);
          throw err;
        }
        const rows = data ?? [];
        console.log('[TopProducts] Loaded products:', rows.length);
        const hiddenCats = ['Streaming', 'Adobe', 'Antivirus'];
        const filteredRows = rows.filter((p: any) => !hiddenCats.includes(p.category?.name));
        setProducts(filteredRows.map(mapProduct));
        const map = new Map<string, number>();
        filteredRows.forEach((p: any) => { if (p.category?.name) map.set(p.category.name, p.category.sort_order ?? 999); });
        const sorted = [...map.entries()].sort((a, b) => a[1] - b[1]).map(([n]) => n);
        setTabs(['All', ...sorted]);
      } catch (e) {
        if (!cancelled) {
          console.error('[TopProducts] Failed to load:', e);
          setError(true);
        }
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
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="py-20 bg-transparent below-fold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="section-label">Featured Products</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-3">
              Top{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Selling
              </span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">Handpicked bestsellers with guaranteed authenticity.</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles size={14} className="text-brand-indigo" />
            {products.length} products available
          </div>
        </div>

        {/* Tab Bar */}
        <div
          className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-border transition-all duration-700"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '0.18s',
          }}
        >
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? { background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' } : {}}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                activeTab === tab
                  ? 'text-white shadow-indigo'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 shadow-soft'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">😕</div>
            <p className="text-muted-foreground">Failed to load products. Please try again.</p>
            <button onClick={() => setRetry(c => c + 1)}
              className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white shadow-indigo"
              style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {!error && loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} className="rounded-2xl shimmer" style={{ height: '22rem', animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )}

        {/* All Products grouped */}
        {!error && !loading && activeTab === 'All' && (
          <div className="space-y-14">
            {catOrder.map((cat, catIdx) => {
              const items      = products.filter(p => p.category === cat);
              if (!items.length) return null;
              const isExpanded = !!expandedCats[cat];
              const shown      = isExpanded ? items : items.slice(0, LIMIT);
              const hasMore    = items.length > LIMIT;
              return (
                <CategoryRevealBlock key={cat} catIdx={catIdx}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-sora font-bold text-lg text-foreground flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(243,75%,59%), hsl(263,70%,58%))' }} />
                      {cat}
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">{items.length}</span>
                    </h3>
                    <button onClick={() => setActiveTab(cat)}
                      className="text-xs font-semibold text-brand-indigo flex items-center gap-1 hover:gap-2 transition-all">
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
                    <div className="hidden md:flex justify-center mt-6">
                      <button onClick={() => toggleCat(cat)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold bg-card border border-border shadow-soft hover:shadow-medium transition-all text-foreground">
                        {isExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Load more ({items.length - LIMIT})</>}
                      </button>
                    </div>
                  )}
                </CategoryRevealBlock>
              );
            })}
          </div>
        )}

        {/* Filtered by tab */}
        {!error && !loading && activeTab !== 'All' && (
          <div>
            <p className="text-sm text-muted-foreground mb-6 font-fira">{filtered.length} products in "{activeTab}"</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} delay={Math.min(i * 0.04, 0.4)} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

/* Helper: each category block reveals when it enters viewport */
const CategoryRevealBlock = ({ children, catIdx }: { children: React.ReactNode; catIdx: number }) => {
  const { ref, visible } = useReveal({ threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s cubic-bezier(0.23,1,0.32,1) ${catIdx * 0.05}s, transform 0.7s cubic-bezier(0.23,1,0.32,1) ${catIdx * 0.05}s`,
      }}
    >
      {children}
    </div>
  );
};

export default TopProducts;
