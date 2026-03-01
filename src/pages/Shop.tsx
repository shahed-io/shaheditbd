import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, Star, ShoppingCart, Heart, Zap, Award } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { WhatsAppButton } from '@/components/store/Extras';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  is_featured: boolean | null;
  tags: string[] | null;
  slug: string;
  categories?: { name: string } | null;
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'সবচেয়ে জনপ্রিয়' },
  { value: 'price_asc', label: 'কম দাম প্রথমে' },
  { value: 'price_desc', label: 'বেশি দাম প্রথমে' },
  { value: 'discount', label: 'সর্বোচ্চ ছাড়' },
  { value: 'newest', label: 'নতুন পণ্য' },
];

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [filterOpen, setFilterOpen] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').eq('is_active', true);
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('status', 'active');
    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || p.categories?.name === selectedCategory;
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchSearch && matchCat && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'discount') return (b.discount_percent || 0) - (a.discount_percent || 0);
      return 0;
    });

  const getBadge = (p: Product) => {
    if (p.tags?.includes('flash-sale')) return { label: '🔥 ফ্ল্যাশ সেল', cls: 'bg-orange-500 text-white' };
    if (p.is_featured) return { label: '⭐ বেস্টসেলার', cls: 'bg-primary text-primary-foreground' };
    if ((p.discount_percent || 0) >= 80) return { label: '💥 মেগা ডিল', cls: 'bg-accent text-white' };
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-4xl font-bold gradient-text mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              সব পণ্য
            </h1>
            <p className="text-muted-foreground">অরিজিনাল সফটওয়্যার লাইসেন্স ও ডিজিটাল সাবস্ক্রিপশন</p>
          </div>

          <div className="flex gap-6">
            {/* Sidebar filter - desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <FilterPanel
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
              />
            </aside>

            <div className="flex-1">
              {/* Search & sort bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="w-full glass-card rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary/50 outline-none bg-transparent"
                    placeholder="পণ্য খুঁজুন..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glass-card rounded-xl px-4 py-2.5 text-sm text-foreground border border-border focus:border-primary/50 outline-none bg-card"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                  onClick={() => setFilterOpen(true)}
                  className="lg:hidden glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm"
                >
                  <SlidersHorizontal size={16} />
                  ফিল্টার
                </button>
              </div>

              {/* Category quick filters */}
              <div className="flex gap-2 flex-wrap mb-6">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedCategory ? 'btn-glow' : 'glass-card hover:border-primary/40'}`}
                >
                  সব
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(selectedCategory === c.name ? '' : c.name)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === c.name ? 'btn-glow' : 'glass-card hover:border-primary/40'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Result count */}
              <p className="text-sm text-muted-foreground mb-4">{filtered.length}টি পণ্য পাওয়া গেছে</p>

              {/* Products grid */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="glass-card rounded-2xl h-64 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <p className="text-4xl mb-3">😕</p>
                  <p>কোনো পণ্য পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((product) => {
                    const badge = getBadge(product);
                    const inCart = isInCart(product.id);
                    const wishlisted = isWishlisted(product.id);
                    return (
                      <div key={product.id} className="product-card group rounded-2xl overflow-hidden">
                        <Link to={`/product/${product.slug}`} className="block">
                          <div className="relative overflow-hidden aspect-square bg-muted">
                            <img
                              src={product.image_url || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                            {badge && (
                              <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                            {product.discount_percent && (
                              <span className="absolute top-2 right-2 badge-discount z-10">
                                -{product.discount_percent}%
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="p-3">
                          <p className="text-xs text-primary mb-1">{product.categories?.name}</p>
                          <Link to={`/product/${product.slug}`}>
                            <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors mb-2">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-primary font-bold">৳{product.price.toLocaleString()}</span>
                            {product.original_price && (
                              <span className="text-muted-foreground text-xs line-through">৳{product.original_price.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => addToCart({ id: product.id, name: product.name, category: product.categories?.name || '', price: product.price, originalPrice: product.original_price || undefined, image: product.image_url || '' })}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${inCart ? 'bg-primary/20 text-primary border border-primary/40' : 'btn-glow'}`}
                            >
                              <ShoppingCart size={13} />
                              {inCart ? 'কার্টে আছে' : 'কার্টে যোগ'}
                            </button>
                            <button
                              onClick={() => toggleWishlist({ id: product.id, name: product.name, category: product.categories?.name || '', price: product.price, image: product.image_url || '' })}
                              className={`p-2 rounded-lg glass-card transition-all ${wishlisted ? 'text-red-400 border-red-400/40' : 'text-muted-foreground hover:text-red-400'}`}
                            >
                              <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-card p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground">ফিল্টার</h3>
              <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
            </div>
            <FilterPanel
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          </div>
        </div>
      )}

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

const FilterPanel = ({ categories, selectedCategory, setSelectedCategory, priceRange, setPriceRange }: {
  categories: { id: string; name: string }[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  priceRange: [number, number];
  setPriceRange: (r: [number, number]) => void;
}) => (
  <div className="glass-card rounded-2xl p-4 space-y-6 sticky top-36">
    <div>
      <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">ক্যাটাগরি</h4>
      <div className="space-y-1">
        <button onClick={() => setSelectedCategory('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${!selectedCategory ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'}`}>
          সব ক্যাটাগরি
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setSelectedCategory(selectedCategory === c.name ? '' : c.name)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === c.name ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'}`}>
            {c.name}
          </button>
        ))}
      </div>
    </div>
    <div>
      <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">দামের পরিসীমা</h4>
      <div className="space-y-2">
        <input type="range" min={0} max={20000} step={100} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], +e.target.value])} className="w-full accent-primary" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>৳{priceRange[0].toLocaleString()}</span>
          <span>৳{priceRange[1].toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>
);

export default Shop;
