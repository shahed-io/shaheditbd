import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { ChevronDown, ChevronUp } from 'lucide-react';

const mapDbProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  category: p.categories?.name || 'Other',
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount: p.discount_percent || undefined,
  rating: 4.8,
  reviews: p.total_sales || Math.floor(Math.random() * 300) + 50,
  image: p.image_url || 'https://placehold.co/300x300/0a1020/00d4be?text=Product',
  isBestseller: p.is_featured,
  isNew: new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const INITIAL_VISIBLE = 8;

const SectionBadge = ({ text, variant = 'primary' }: { text: string; variant?: 'primary' | 'accent' }) => (
  <div
    className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-4 text-xs font-semibold tracking-[0.2em] uppercase"
    style={{
      background: variant === 'primary' ? 'hsla(180,100%,42%,0.08)' : 'hsla(265,85%,65%,0.08)',
      border: `1px solid ${variant === 'primary' ? 'hsla(180,100%,42%,0.2)' : 'hsla(265,85%,65%,0.2)'}`,
      color: variant === 'primary' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
    }}
  >
    <span>◈</span>
    <span>{text}</span>
  </div>
);

const TopProducts = () => {
  const [activeTab, setActiveTab] = useState('All Products');
  const [products, setProducts] = useState<Product[]>([]);
  const [tabs, setTabs] = useState<string[]>(['All Products']);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchProducts = async (attempt = 0) => {
      setLoading(true);
      setError(false);
      try {
        const { data, error: queryError } = await supabase
          .from('products')
          .select('*, categories(name, sort_order)')
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;

        if (data && data.length > 0) {
          const mapped = data.map(mapDbProduct);
          setProducts(mapped);
          const catMap = new Map<string, number>();
          data.forEach(p => {
            if (p.categories?.name) catMap.set(p.categories.name, p.categories.sort_order ?? 999);
          });
          const sortedCats = Array.from(catMap.entries()).sort((a, b) => a[1] - b[1]).map(([name]) => name);
          setTabs(['All Products', ...sortedCats]);
        }
      } catch (err) {
        if (attempt < 2) {
          setTimeout(() => fetchProducts(attempt + 1), 1000 * (attempt + 1));
          return;
        }
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [retryCount]);

  const filtered = activeTab === 'All Products' ? products : products.filter(p => p.category === activeTab);
  const categoryOrder = tabs.filter(t => t !== 'All Products');
  const toggleCat = (cat: string) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="orb orb-2 opacity-[0.07]" style={{ top: '15%', right: '-8%' }} />
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Section header */}
        <div className="text-center mb-10">
          <SectionBadge text="Best Sellers" />
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Top <span className="gradient-text">Selling Products</span>
          </h2>
          <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'var(--gradient-primary)' }} />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
              style={
                activeTab === tab
                  ? { background: 'var(--gradient-primary)', color: 'hsl(var(--background))', boxShadow: '0 4px 20px hsla(180,100%,42%,0.25)' }
                  : { background: 'hsla(228,28%,11%,0.7)', border: '1px solid hsla(180,100%,42%,0.15)', color: 'hsl(var(--muted-foreground))' }
              }
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.35)';
                  (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.15)';
                  (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))';
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-muted-foreground text-center">প্রোডাক্ট লোড করতে সমস্যা হচ্ছে।</p>
            <button
              onClick={() => setRetryCount(c => c + 1)}
              className="px-6 py-2.5 rounded-xl text-background text-sm font-bold"
              style={{ background: 'var(--gradient-primary)' }}
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Loading */}
        {!error && loading ? (
          <div className="space-y-10">
            {Array.from({ length: 2 }).map((_, g) => (
              <div key={g}>
                <div className="h-7 w-40 rounded-xl animate-pulse mb-4" style={{ background: 'hsla(228,25%,14%,0.6)' }} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ background: 'hsla(228,28%,11%,0.5)', border: '1px solid hsla(180,100%,42%,0.08)', animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

        ) : activeTab === 'All Products' ? (
          <div className="space-y-16">
            {categoryOrder.map(cat => {
              const catProducts = products.filter(p => p.category === cat);
              if (catProducts.length === 0) return null;
              const isExpanded = expandedCats[cat];
              const visibleProducts = isExpanded ? catProducts : catProducts.slice(0, INITIAL_VISIBLE);
              const hasMore = catProducts.length > INITIAL_VISIBLE;

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'hsl(var(--foreground))' }}>
                      <span className="w-1 h-7 rounded-full inline-block" style={{ background: 'var(--gradient-primary)' }} />
                      {cat}
                      <span className="text-sm font-normal px-3 py-1 rounded-full"
                        style={{ color: 'hsl(var(--muted-foreground))', background: 'hsla(228,28%,13%,0.7)', border: '1px solid hsla(228,25%,20%,0.5)' }}>
                        {catProducts.length}টি
                      </span>
                    </h3>
                    <button
                      onClick={() => setActiveTab(cat)}
                      className="text-sm hover:underline flex items-center gap-1 font-medium transition-all"
                      style={{ color: 'hsl(var(--primary))' }}
                    >
                      সব দেখুন →
                    </button>
                  </div>

                  {/* Mobile scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 md:hidden" style={{ scrollbarWidth: 'none' }}>
                    {catProducts.map((product, i) => (
                      <div key={product.id} className="flex-shrink-0 w-48">
                        <ProductCard product={product} delay={i * 0.05} />
                      </div>
                    ))}
                  </div>

                  {/* Desktop grid */}
                  <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {visibleProducts.map((product, i) => (
                      <ProductCard key={product.id} product={product} delay={i * 0.05} />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="hidden md:flex justify-center mt-6">
                      <button
                        onClick={() => toggleCat(cat)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all"
                        style={{ background: 'hsla(228,28%,11%,0.7)', border: '1px solid hsla(180,100%,42%,0.15)', color: 'hsl(var(--muted-foreground))' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.4)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.15)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}
                      >
                        {isExpanded ? <><ChevronUp size={16} /> কম দেখুন</> : <><ChevronDown size={16} /> আরও {catProducts.length - INITIAL_VISIBLE}টি দেখুন</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length}টি প্রোডাক্ট পাওয়া গেছে</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} delay={Math.min(i * 0.04, 0.4)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopProducts;
