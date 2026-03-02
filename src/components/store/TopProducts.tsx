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
  image: p.image_url || 'https://placehold.co/300x300/0a1628/00b4d8?text=Product',
  isBestseller: p.is_featured,
  isNew: new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const INITIAL_VISIBLE = 8;

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
    <section className="py-20 px-4 relative">
      <div className="orb orb-2 opacity-10" style={{ top: '20%', right: '-10%' }} />
      <div className="max-w-7xl mx-auto">

        {/* Section header - shahedit style */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm">◈</span>
            <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Best Sellers</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Top <span className="gradient-text">Selling Products</span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary to-accent text-background shadow-lg shadow-primary/20'
                  : 'bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-muted-foreground text-center">প্রোডাক্ট লোড করতে সমস্যা হচ্ছে।</p>
            <button
              onClick={() => setRetryCount(c => c + 1)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-background text-sm font-semibold"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {!error && loading ? (
          <div className="space-y-10">
            {Array.from({ length: 2 }).map((_, g) => (
              <div key={g}>
                <div className="h-7 w-40 bg-muted/40 rounded-xl animate-pulse mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-80 bg-card/50 border border-border/30 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
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
                    <h3 className="text-2xl font-bold text-foreground flex items-center gap-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      <span className="w-1 h-7 rounded-full bg-gradient-to-b from-primary to-accent inline-block" />
                      {cat}
                      <span className="text-sm text-muted-foreground font-normal bg-card border border-border/50 px-3 py-1 rounded-full">
                        {catProducts.length}টি
                      </span>
                    </h3>
                    <button
                      onClick={() => setActiveTab(cat)}
                      className="text-primary text-sm hover:underline flex items-center gap-1 hover:gap-2 transition-all font-medium"
                    >
                      সব দেখুন →
                    </button>
                  </div>

                  {/* Mobile: horizontal scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 md:hidden scrollbar-hide">
                    {catProducts.map((product, i) => (
                      <div key={product.id} className="flex-shrink-0 w-48">
                        <ProductCard product={product} delay={i * 0.05} />
                      </div>
                    ))}
                  </div>

                  {/* Desktop: grid */}
                  <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {visibleProducts.map((product, i) => (
                      <ProductCard key={product.id} product={product} delay={i * 0.05} />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="hidden md:flex justify-center mt-6">
                      <button
                        onClick={() => toggleCat(cat)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-card border border-border/50 text-muted-foreground text-sm font-medium hover:border-primary/40 hover:text-primary transition-all"
                      >
                        {isExpanded ? (
                          <><ChevronUp size={16} /> কম দেখুন</>
                        ) : (
                          <><ChevronDown size={16} /> আরও {catProducts.length - INITIAL_VISIBLE}টি দেখুন</>
                        )}
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
