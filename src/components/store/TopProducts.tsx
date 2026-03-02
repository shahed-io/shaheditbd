import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';

const mapDbProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  category: p.categories?.name || 'Other',
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount: p.discount_percent || undefined,
  rating: 4.8,
  reviews: Math.floor(Math.random() * 300) + 50,
  image: p.image_url || 'https://placehold.co/300x300/0a1628/00b4d8?text=Product',
  isBestseller: p.is_featured,
  isNew: new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const TopProducts = () => {
  const [activeTab, setActiveTab] = useState('All Products');
  const [products, setProducts] = useState<Product[]>([]);
  const [tabs, setTabs] = useState<string[]>(['All Products']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, sort_order)')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const mapped = data.map(mapDbProduct);
        setProducts(mapped);
        // Sort categories by their sort_order from DB
        const catMap = new Map<string, number>();
        data.forEach(p => {
          if (p.categories?.name) {
            catMap.set(p.categories.name, p.categories.sort_order ?? 999);
          }
        });
        const sortedCats = Array.from(catMap.entries())
          .sort((a, b) => a[1] - b[1])
          .map(([name]) => name);
        setTabs(['All Products', ...sortedCats]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = activeTab === 'All Products'
    ? products
    : products.filter(p => p.category === activeTab);

  // For "All Products" view, group by category in order
  const categoryOrder = tabs.filter(t => t !== 'All Products');

  return (
    <section className="py-16 px-4 relative">
      <div className="orb orb-2 opacity-10" style={{ top: '20%', right: '-10%' }} />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-1">Featured</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Top <span className="gradient-text">Selling Products</span>
            </h2>
          </div>
          <a href="/shop" className="text-primary text-sm hover:underline self-start sm:self-auto">
            View All Products →
          </a>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-primary hover:border-primary/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 glass-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'All Products' ? (
          // Grouped by category
          <div className="space-y-12">
            {categoryOrder.map(cat => {
              const catProducts = products.filter(p => p.category === cat);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-xl font-bold text-foreground flex items-center gap-2"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      <span className="w-1 h-6 rounded-full bg-primary inline-block" />
                      {cat}
                      <span className="text-sm text-muted-foreground font-normal">
                        ({catProducts.length})
                      </span>
                    </h3>
                    <button
                      onClick={() => setActiveTab(cat)}
                      className="text-primary text-sm hover:underline"
                    >
                      সব দেখুন →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                    {catProducts.slice(0, 4).map((product, i) => (
                      <ProductCard key={product.id} product={product} delay={i * 0.06} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single category filtered view
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={i * 0.06} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopProducts;

