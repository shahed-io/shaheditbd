import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { Search, X, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  badge: string | null;
  is_featured: boolean | null;
  status: string;
  category_id: string | null;
  short_description: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

const CAT_META: Record<string, { icon: string; accent: string }> = {
  'Windows':          { icon: '🪟', accent: 'hsl(210,90%,55%)' },
  'Office':           { icon: '📦', accent: 'hsl(25,90%,58%)' },
  'Software':         { icon: '💻', accent: 'hsl(263,70%,60%)' },
  'VPN':              { icon: '🔒', accent: 'hsl(190,70%,48%)' },
  'Subscription':     { icon: '🎬', accent: 'hsl(283,65%,58%)' },
  'Antivirus':        { icon: '🛡️', accent: 'hsl(158,64%,45%)' },
  'Streaming':        { icon: '📺', accent: 'hsl(0,80%,58%)' },
  'Microsoft Office': { icon: '📦', accent: 'hsl(25,90%,58%)' },
  'default':          { icon: '🛒', accent: 'hsl(243,75%,60%)' },
};

const SORT_OPTIONS = [
  { label: 'সর্বশেষ',   value: 'newest' },
  { label: 'কম দামে',   value: 'price_asc' },
  { label: 'বেশি দামে', value: 'price_desc' },
  { label: 'বেশি ছাড়', value: 'discount' },
  { label: 'জনপ্রিয়',  value: 'popular' },
];

const ShopProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const discount = product.discount_percent ?? (
    product.original_price && product.original_price > product.price
      ? Math.round(100 - (product.price / product.original_price) * 100)
      : null
  );

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
      style={{
        border: '1.5px solid hsl(var(--border))',
        background: 'hsl(var(--background))',
        boxShadow: '0 2px 12px hsla(258,78%,55%,0.06)',
      }}
      onClick={() => navigate(`/product/${product.slug}`)}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>🛒</div>
        }
        {discount && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-1 rounded-full"
            style={{ background: 'hsl(32,100%,52%)' }}>-{discount}%</span>
        )}
        {product.badge && (
          <span className="absolute top-2 right-2 text-[10px] font-bold text-white px-2 py-1 rounded-full"
            style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
            {product.badge}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-2">{product.name}</div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-black text-base text-foreground">৳{product.price.toLocaleString()}</div>
            {product.original_price && product.original_price > product.price && (
              <div className="text-xs text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</div>
            )}
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              addToCart({ id: product.id, name: product.name, price: product.price, category: '', image: product.image_url || '' });
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState(searchParams.get('q') || '');
  const [sort, setSort]             = useState('newest');

  const activeCatSlug = searchParams.get('category') || '';

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      let query = supabase.from('products')
        .select('id, name, slug, price, original_price, discount_percent, image_url, badge, is_featured, status, category_id, short_description')
        .eq('status', 'active');

      if (activeCatSlug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', activeCatSlug).maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (search) query = query.ilike('name', `%${search}%`);

      switch (sort) {
        case 'price_asc':  query = query.order('price', { ascending: true }); break;
        case 'price_desc': query = query.order('price', { ascending: false }); break;
        case 'discount':   query = query.order('discount_percent', { ascending: false, nullsFirst: false }); break;
        case 'popular':    query = query.order('total_sales', { ascending: false, nullsFirst: false }); break;
        default:           query = query.order('created_at', { ascending: false }); break;
      }

      const { data } = await query.limit(60);
      setProducts((data as Product[]) || []);
      setLoading(false);
    };
    fetchProducts();
  }, [activeCatSlug, search, sort]);

  const setCategory = (slug: string) => {
    if (slug) setSearchParams({ category: slug });
    else setSearchParams({});
  };

  const activeCategory = categories.find(c => c.slug === activeCatSlug);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={activeCategory
          ? `${activeCategory.name} | Buy ${activeCategory.name} Online – Best Price Bangladesh`
          : 'Buy Digital Software, License Keys & Subscriptions – Best Price in Bangladesh'}
        description={activeCategory
          ? `Buy original ${activeCategory.name} at the best price in Bangladesh. Instant delivery, genuine license keys. Shahed Store – Bangladesh's most trusted digital software shop.`
          : 'Shop Windows, Office, Adobe, Antivirus, VPN, Streaming subscriptions & all digital software at the lowest price in Bangladesh. 100% genuine. Instant delivery.'}
        canonical={activeCatSlug ? `https://shahedstore.com.bd/shop?category=${activeCatSlug}` : 'https://shahedstore.com.bd/shop'}
      />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-sora font-black text-3xl text-foreground">
            {activeCategory ? (
              <span className="flex items-center gap-3">
                <span>{(CAT_META[activeCategory.name] || CAT_META.default).icon}</span>
                <span>{activeCategory.name}</span>
              </span>
            ) : 'সব প্রোডাক্ট'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {loading ? 'লোড হচ্ছে...' : `${products.length}টি প্রোডাক্ট পাওয়া গেছে`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="rounded-2xl border p-4 sticky top-24"
              style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}>
              <div className="font-bold text-xs text-muted-foreground mb-3 uppercase tracking-widest">ক্যাটাগরি</div>
              <button onClick={() => setCategory('')}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 transition-all text-left"
                style={{
                  background: !activeCatSlug ? 'hsla(258,78%,55%,0.12)' : 'transparent',
                  color: !activeCatSlug ? 'hsl(258,78%,50%)' : 'hsl(var(--muted-foreground))',
                }}>
                🛒 <span>সব প্রোডাক্ট</span>
              </button>
              {categories.map(cat => {
                const meta = CAT_META[cat.name] || CAT_META.default;
                const isActive = activeCatSlug === cat.slug;
                return (
                  <button key={cat.id} onClick={() => setCategory(cat.slug)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 transition-all text-left"
                    style={{
                      background: isActive ? `${meta.accent}18` : 'transparent',
                      color: isActive ? meta.accent : 'hsl(var(--muted-foreground))',
                      border: isActive ? `1px solid ${meta.accent}40` : '1px solid transparent',
                    }}>
                    <span>{meta.icon}</span> <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex-1 min-w-[180px] relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="প্রোডাক্ট খুঁজুন..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border bg-background text-foreground focus:outline-none"
                  style={{ borderColor: 'hsl(var(--border))' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-xl border bg-background text-foreground focus:outline-none cursor-pointer"
                style={{ borderColor: 'hsl(var(--border))' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {activeCatSlug && activeCategory && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-white"
                  style={{ background: (CAT_META[activeCategory.name] || CAT_META.default).accent }}>
                  {(CAT_META[activeCategory.name] || CAT_META.default).icon}
                  <span className="ml-1">{activeCategory.name}</span>
                  <button onClick={() => setCategory('')} className="ml-0.5 hover:opacity-70"><X size={11} /></button>
                </div>
              )}
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted))', height: '280px' }} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <div className="text-5xl mb-4">🔍</div>
                <div className="font-semibold text-lg">কোনো প্রোডাক্ট পাওয়া যায়নি</div>
                <button onClick={() => { setSearch(''); setCategory(''); }}
                  className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'hsl(258,78%,55%)' }}>
                  সব দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => <ShopProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
