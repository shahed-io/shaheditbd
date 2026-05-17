import { useState, useEffect } from 'react';
import BrandLoader from '@/components/store/BrandLoader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { itemListSchema, breadcrumbSchema } from '@/components/seo/schemas';
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
  const [didYouMean, setDidYouMean] = useState<string>('');
  const [aiAssisted, setAiAssisted] = useState(false);

  const activeCatSlug = searchParams.get('category') || '';

  const [imgVersion, setImgVersion] = useState(() => Date.now());

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, updated_at')
      .eq('is_active', true)
      .order('sort_order');
    if (data) {
      setCategories(data as Category[]);
      setImgVersion(Date.now()); // force re-render with fresh cache key
    }
  };

  useEffect(() => {
    loadCategories();

    // Real-time: reload when categories change (e.g. image update)
    const channel = supabase
      .channel('shop-categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      let productIds: string[] | null = null;

      // If a category is selected, find product IDs via junction table (supports multi-category)
      if (activeCatSlug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', activeCatSlug).maybeSingle();
        if (cat) {
          const { data: pcRows } = await supabase
            .from('product_categories' as any)
            .select('product_id')
            .eq('category_id', cat.id);
          productIds = (pcRows as any[] || []).map((r: any) => r.product_id);
          if (productIds.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
          }
        }
      }

      let query = supabase.from('products')
        .select('id, name, slug, price, original_price, discount_percent, image_url, badge, is_featured, status, category_id, short_description')
        .eq('status', 'active');

      if (productIds !== null) query = query.in('id', productIds);
      if (search) {
        const tokens = search.split(/\s+/).map(t => t.replace(/[%,()]/g, '')).filter(t => t.length >= 2).slice(0, 5);
        const orParts = [`name.ilike.%${search}%`, `short_description.ilike.%${search}%`];
        tokens.forEach(t => { orParts.push(`name.ilike.%${t}%`); orParts.push(`short_description.ilike.%${t}%`); });
        query = query.or(orParts.join(','));
      }

      switch (sort) {
        case 'price_asc':  query = query.order('price', { ascending: true }); break;
        case 'price_desc': query = query.order('price', { ascending: false }); break;
        case 'discount':   query = query.order('discount_percent', { ascending: false, nullsFirst: false }); break;
        case 'popular':    query = query.order('total_sales', { ascending: false, nullsFirst: false }); break;
        default:           query = query.order('created_at', { ascending: false }); break;
      }

      const { data } = await query.limit(60);
      let results = (data as Product[]) || [];
      let usedAi = false;
      let dym = '';

      // AI fuzzy fallback when normal search yields sparse results (typos, shortcuts, mixed lang).
      // IMPORTANT: respects active category + sort so suggestions stay inside the user's filter scope.
      if (search && results.length < 4) {
        try {
          let catalogQuery = supabase.from('products')
            .select('id, name, category_id').eq('status', 'active');
          // Restrict the AI's candidate pool to the active category (multi-category aware)
          if (productIds !== null) catalogQuery = catalogQuery.in('id', productIds);
          const { data: catalog } = await catalogQuery.limit(600);
          if (catalog && catalog.length > 0) {
            const { data: ai } = await supabase.functions.invoke('ai-search-match', {
              body: { query: search, products: catalog },
            });
            const ids: string[] = ai?.matchedIds || [];
            dym = typeof ai?.didYouMean === 'string' ? ai.didYouMean : '';
            if (ids.length > 0) {
              let prodQuery = supabase.from('products')
                .select('id, name, slug, price, original_price, discount_percent, image_url, badge, is_featured, status, category_id, short_description, total_sales, created_at')
                .in('id', ids)
                .eq('status', 'active');
              // Re-apply category filter as a defence in depth (catalog may have been cached)
              if (productIds !== null) prodQuery = prodQuery.in('id', productIds);
              const { data: prods } = await prodQuery;
              // Order by AI relevance first
              const relevance = new Map(ids.map((id, i) => [id, i]));
              let aiResults = ((prods as Product[]) || []).sort(
                (a, b) => (relevance.get(a.id) ?? 99) - (relevance.get(b.id) ?? 99),
              );
              const existing = new Set(results.map(p => p.id));
              let merged = [...results, ...aiResults.filter(p => !existing.has(p.id))];
              // Re-apply the user's sort on the merged list so AI suggestions obey
              // the active sort (price_asc / price_desc / discount / popular).
              const sortFns: Record<string, (a: Product, b: Product) => number> = {
                price_asc:  (a, b) => a.price - b.price,
                price_desc: (a, b) => b.price - a.price,
                discount:   (a, b) => (b.discount_percent ?? -1) - (a.discount_percent ?? -1),
                popular:    (a, b) => ((b as any).total_sales ?? -1) - ((a as any).total_sales ?? -1),
              };
              if (sortFns[sort]) merged = [...merged].sort(sortFns[sort]);
              if (results.length === 0 && merged.length > 0) usedAi = true;
              results = merged;
            }
          }
        } catch (e) {
          console.warn('AI search fallback failed:', e);
        }
      }

      setDidYouMean(dym && dym.toLowerCase() !== search.toLowerCase().trim() ? dym : '');
      setAiAssisted(usedAi);
      setProducts(results);
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
          ? `${activeCategory.name} কিনুন বাংলাদেশ | Best Price – Shahed Store`
          : 'Buy Digital Software, License Keys & Subscriptions – Best Price in Bangladesh'}
        description={activeCategory
          ? `Buy original ${activeCategory.name} at the best price in Bangladesh. ১০০% genuine license key. Instant delivery. Shahed Store – Bangladesh's most trusted digital software shop.`
          : 'Shop Windows 11, Office 365, Adobe CC, Netflix, Spotify, Antivirus, VPN & all digital software at the lowest price in Bangladesh. ১০০% genuine. Instant delivery. BKash/Nagad payment.'}
        canonical={activeCatSlug ? `https://shahedstore.com.bd/shop?category=${activeCatSlug}` : 'https://shahedstore.com.bd/shop'}
        keywords={activeCategory
          ? `${activeCategory.name} price in bangladesh, ${activeCategory.name} কিনুন, buy ${activeCategory.name} bangladesh, ${activeCategory.name} bd, shahed store`
          : 'digital software bangladesh, license key bangladesh, windows 11 key, office 365 bangladesh, adobe bangladesh, netflix subscription bd, shahed store'}
        schema={[
          ...(products.length > 0 ? [itemListSchema(products.map(p => ({ name: p.name, slug: p.slug, image: p.image_url, price: p.price })))] : []),
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Shop', url: '/shop' },
            ...(activeCategory ? [{ name: activeCategory.name, url: `/shop?category=${activeCatSlug}` }] : []),
          ]),
        ]}
      />
      <Navbar />

      <div className="container-fluid py-10">
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

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar — horizontal scroll on tablet, vertical on desktop */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="relative rounded-3xl p-4 lg:p-5 lg:sticky lg:top-24 overflow-hidden"
              style={{
                background: 'linear-gradient(140deg, hsla(0,0%,100%,0.78), hsla(258,60%,98%,0.65))',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                border: '1px solid hsla(0,0%,100%,0.7)',
                boxShadow: '0 12px 40px hsla(258,60%,40%,0.10), inset 0 1px 0 hsla(0,0%,100%,0.9)',
              }}>
              {/* Ambient blobs */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsla(258,90%,66%,0.18), transparent 70%)', filter: 'blur(40px)' }} />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsla(199,89%,60%,0.15), transparent 70%)', filter: 'blur(40px)' }} />

              <div className="relative">
                <div className="hidden lg:flex items-center gap-2 mb-4 px-1">
                  <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(258,90%,66%), hsl(199,89%,60%))' }} />
                  <div className="font-bold text-[11px] text-foreground uppercase tracking-[0.18em]">ক্যাটাগরি</div>
                </div>

                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide -mx-1 px-1 lg:mx-0 lg:px-0">
                  <button onClick={() => setCategory('')}
                    className="group relative flex-shrink-0 lg:flex-shrink flex items-center gap-2.5 px-3 py-2.5 lg:py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-left whitespace-nowrap hover:-translate-y-0.5 overflow-hidden"
                    style={{
                      background: !activeCatSlug
                        ? 'linear-gradient(135deg, hsla(258,90%,66%,0.18), hsla(199,89%,60%,0.14))'
                        : 'hsla(0,0%,100%,0.55)',
                      color: !activeCatSlug ? 'hsl(258,78%,42%)' : 'hsl(var(--foreground))',
                      border: !activeCatSlug
                        ? '1.5px solid hsla(258,90%,66%,0.45)'
                        : '1px solid hsla(258,40%,80%,0.25)',
                      boxShadow: !activeCatSlug
                        ? '0 6px 18px hsla(258,90%,66%,0.20), inset 0 1px 0 hsla(0,0%,100%,0.7)'
                        : '0 2px 8px hsla(258,40%,40%,0.04)',
                    }}>
                    {!activeCatSlug && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                        style={{ background: 'linear-gradient(180deg, hsl(258,90%,66%), hsl(199,89%,60%))' }} />
                    )}
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{
                        background: !activeCatSlug
                          ? 'linear-gradient(135deg, hsl(258,90%,66%), hsl(199,89%,60%))'
                          : 'hsla(258,30%,90%,0.6)',
                        boxShadow: !activeCatSlug ? '0 4px 12px hsla(258,90%,66%,0.35)' : 'none',
                      }}>
                      <span style={{ filter: !activeCatSlug ? 'grayscale(0)' : 'none' }}>🛒</span>
                    </span>
                    <span>সব</span>
                  </button>

                  {categories.map(cat => {
                    const meta = CAT_META[cat.name] || CAT_META.default;
                    const isActive = activeCatSlug === cat.slug;
                    const imgSrc = cat.image_url
                      ? `${cat.image_url.split('?')[0]}?v=${imgVersion}`
                      : null;
                    return (
                      <button key={cat.id} onClick={() => setCategory(cat.slug)}
                        className="group relative flex-shrink-0 lg:flex-shrink w-auto lg:w-full flex items-center gap-2.5 px-3 py-2.5 lg:py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-left whitespace-nowrap hover:-translate-y-0.5 overflow-hidden"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${meta.accent}28, ${meta.accent}10)`
                            : 'hsla(0,0%,100%,0.55)',
                          color: isActive ? meta.accent : 'hsl(var(--foreground))',
                          border: isActive
                            ? `1.5px solid ${meta.accent}55`
                            : '1px solid hsla(258,40%,80%,0.25)',
                          boxShadow: isActive
                            ? `0 6px 18px ${meta.accent}30, inset 0 1px 0 hsla(0,0%,100%,0.7)`
                            : '0 2px 8px hsla(258,40%,40%,0.04)',
                        }}>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                            style={{ background: meta.accent }} />
                        )}
                        <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden text-base transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: isActive
                              ? `linear-gradient(135deg, ${meta.accent}, ${meta.accent}cc)`
                              : 'hsla(258,30%,94%,0.7)',
                            boxShadow: isActive ? `0 4px 12px ${meta.accent}45` : 'none',
                          }}>
                          {imgSrc
                            ? <img
                                key={imgSrc}
                                src={imgSrc}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.display = 'none';
                                  const parent = img.parentElement;
                                  if (parent) parent.textContent = meta.icon;
                                }}
                              />
                            : meta.icon
                          }
                        </span>
                        <span className="flex-1 truncate">{cat.name}</span>
                        {isActive && (
                          <span className="hidden lg:block w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
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

            {/* Did-you-mean / AI-assisted banner */}
            {!loading && search && (didYouMean || aiAssisted) && (
              <div className="mb-4 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2 text-sm flex-wrap">
                <span className="text-base">✨</span>
                {didYouMean ? (
                  <span className="text-foreground">
                    আপনি কি খুঁজছিলেন{' '}
                    <button
                      onClick={() => { setSearch(didYouMean); setSearchParams({ q: didYouMean }); }}
                      className="font-bold text-primary hover:underline"
                    >
                      {didYouMean}
                    </button>
                    {' '}? &nbsp;
                  </span>
                ) : null}
                {aiAssisted && (
                  <span className="text-muted-foreground">
                    &ldquo;<span className="font-semibold text-foreground">{search}</span>&rdquo; এর জন্য সরাসরি ফলাফল নেই — AI দ্বারা সম্পর্কিত প্রোডাক্ট দেখানো হচ্ছে।
                  </span>
                )}
              </div>
            )}

            {/* Products */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <BrandLoader size="md" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <div className="text-5xl mb-4">🔍</div>
                <div className="font-semibold text-lg">কোনো প্রোডাক্ট পাওয়া যায়নি</div>
                {search && (
                  <div className="text-sm mt-2">&ldquo;{search}&rdquo; এর জন্য কোনো মিল পাওয়া যায়নি</div>
                )}
                <button onClick={() => { setSearch(''); setCategory(''); setSearchParams({}); }}
                  className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'hsl(258,78%,55%)' }}>
                  সব দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-3 md:gap-4">
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
