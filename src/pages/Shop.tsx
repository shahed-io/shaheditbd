import { useState, useEffect } from 'react';
import BrandLoader from '@/components/store/BrandLoader';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { itemListSchema, breadcrumbSchema } from '@/components/seo/schemas';
import { Search, X, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useCurrency } from '@/hooks/useCurrency';
import { useHideOrphans } from '@/hooks/useHideOrphans';


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
  stock_quantity?: number | null;
}

const SHOP_WA = '8801820060046';

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
  const { format: fmtPrice } = useCurrency();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const outOfStock = product.status === 'out_of_stock' || (typeof product.stock_quantity === 'number' && product.stock_quantity <= 0);
  const discount = product.discount_percent ?? (
    product.original_price && product.original_price > product.price
      ? Math.round(100 - (product.price / product.original_price) * 100)
      : null
  );

  const handlePreOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = encodeURIComponent(`প্রি-অর্ডার করতে চাই (Stock Out):\n📦 ${product.name}\n💰 ৳${product.price.toLocaleString()}\n\nকখন আবার stock আসবে জানাবেন please।`);
    window.open(`https://wa.me/${SHOP_WA}?text=${msg}`, '_blank');
  };

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
          ? <img src={product.image_url} alt={`${product.name} — Buy Online in Bangladesh at Shahed IT`} title={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>🛒</div>
        }
        {outOfStock && (
          <>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, hsla(0,0%,0%,0.35), hsla(0,0%,0%,0.05))' }} />
            <span className="absolute top-2 left-2 text-[10px] font-black tracking-wider text-white px-2 py-1 rounded-full"
              style={{ background: 'linear-gradient(135deg, hsl(0,80%,55%), hsl(15,90%,55%))' }}>STOCK OUT</span>
          </>
        )}
        {!outOfStock && discount && (
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
            <div className="font-black text-base text-foreground">{fmtPrice(product.price)}</div>
            {product.original_price && product.original_price > product.price && (
              <div className="text-xs text-muted-foreground line-through">{fmtPrice(product.original_price)}</div>
            )}
          </div>
          {outOfStock ? (
            <button
              onClick={handlePreOrder}
              aria-label={`Pre-order ${product.name} via WhatsApp`}
              title="Pre-order via WhatsApp"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(0,80%,55%), hsl(15,90%,55%))' }}>
              <MessageCircle size={14} />
            </button>
          ) : (
            <button
              onClick={e => {
                e.stopPropagation();
                addToCart({ id: product.id, name: product.name, price: product.price, category: '', image: product.image_url || '' });
              }}
              aria-label={`Add ${product.name} to cart`}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
              <ShoppingCart size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState(searchParams.get('q') || '');
  const [sort, setSort]             = useState('newest');
  const [didYouMean, setDidYouMean] = useState<string>('');
  const [aiAssisted, setAiAssisted] = useState(false);
  const hideOrphans = useHideOrphans();


  const activeCatSlug = searchParams.get('category') || '';
  const urlQ = searchParams.get('q') || '';

  // Sync `search` state with URL ?q= so navigating from navbar search updates results
  useEffect(() => {
    setSearch(urlQ);
  }, [urlQ]);

  useEffect(() => {
    // Force a re-render when the currency changes to ensure conversion logic is fresh
    // The key here is that the format/convert functions in useCurrency depend on the active currency state.
  }, [location.key]);

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
        .select('id, name, slug, price, original_price, discount_percent, image_url, badge, is_featured, status, category_id, short_description, stock_quantity')
        .in('status', ['active', 'out_of_stock']);

      if (productIds !== null) query = query.in('id', productIds);
      if (search) {
        const phrase = search.trim().replace(/[%,()]/g, '');
        const tokens = phrase.split(/\s+/).filter(t => t.length >= 2).slice(0, 5);
        if (tokens.length <= 1) {
          // Single word / phrase — match against name or short_description
          query = query.or(`name.ilike.%${phrase}%,short_description.ilike.%${phrase}%`);
        } else {
          // Multi-word — require EVERY token to be present (AND), each across name OR short_description.
          // Prevents partial matches like "windows 11 Pro" returning every product containing only "Pro".
          tokens.forEach(t => {
            query = query.or(`name.ilike.%${t}%,short_description.ilike.%${t}%`);
          });
        }
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

      // AI fuzzy fallback ONLY when DB returned zero matches (typo/synonym recovery).
      // If even a single DB match exists, trust it — don't pollute with AI guesses.
      if (search && results.length === 0) {
        try {
          let catalogQuery = supabase.from('products')
            .select('id, name, category_id').eq('status', 'active');
          if (productIds !== null) catalogQuery = catalogQuery.in('id', productIds);
          const { data: catalog } = await catalogQuery.limit(600);
          if (catalog && catalog.length > 0) {
            const { data: ai } = await supabase.functions.invoke('ai-search-match', {
              body: { query: search, products: catalog, strict: true },
            });
            const ids: string[] = ai?.matchedIds || [];
            dym = typeof ai?.didYouMean === 'string' ? ai.didYouMean : '';
            // Cap AI suggestions to top 6 most-relevant so users see focused matches, not a dump.
            const topIds = ids.slice(0, 6);
            if (topIds.length > 0) {
              let prodQuery = supabase.from('products')
                .select('id, name, slug, price, original_price, discount_percent, image_url, badge, is_featured, status, category_id, short_description, stock_quantity, total_sales, created_at')
                .in('id', topIds)
                .in('status', ['active', 'out_of_stock']);
              if (productIds !== null) prodQuery = prodQuery.in('id', productIds);
              const { data: prods } = await prodQuery;
              const relevance = new Map(topIds.map((id, i) => [id, i]));
              const aiResults = ((prods as Product[]) || []).sort(
                (a, b) => (relevance.get(a.id) ?? 99) - (relevance.get(b.id) ?? 99),
              );
              if (aiResults.length > 0) {
                usedAi = true;
                results = aiResults;
              }
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

  // Per-category SEO copy targeting "buy {category} in Bangladesh"
  const CATEGORY_SEO: Record<string, { title: string; desc: string; keywords: string }> = {
    'windows': {
      title: 'Buy Windows 10 & 11 License Keys in Bangladesh | Shahed IT',
      desc: 'Buy genuine Windows 10 & Windows 11 Pro/Home license keys in Bangladesh at the lowest price. 100% original activation, instant email delivery, bKash accepted.',
      keywords: 'buy windows in bangladesh, windows 11 pro key bd, windows 10 license bangladesh, windows key price bd, shahed it',
    },
    'microsoft-office': {
      title: 'Buy Microsoft Office 365 in Bangladesh | Genuine License',
      desc: 'Buy Microsoft Office 365 and Office 2021 in Bangladesh at best price. Original license, 1 to 5 users, instant activation, lifetime plans available. Shahed IT BD.',
      keywords: 'buy microsoft office in bangladesh, office 365 bd price, ms office 2021 bangladesh, office 365 subscription bd, shahed it',
    },
    'office': {
      title: 'Buy Microsoft Office 365 in Bangladesh | Genuine License',
      desc: 'Buy Microsoft Office 365 and Office 2021 in Bangladesh at best price. Original license, 1 to 5 users, instant activation, lifetime plans available. Shahed IT BD.',
      keywords: 'buy microsoft office in bangladesh, office 365 bd price, ms office 2021 bangladesh, office 365 subscription bd, shahed it',
    },
    'adobe': {
      title: 'Buy Adobe Creative Cloud in Bangladesh | All Apps',
      desc: 'Buy Adobe Creative Cloud, Photoshop, Illustrator, Premiere Pro in Bangladesh at cheapest price. Genuine subscription, monthly/yearly plans, instant delivery.',
      keywords: 'buy adobe in bangladesh, adobe creative cloud bd, photoshop subscription bangladesh, adobe cc price bd, shahed it',
    },
    'antivirus': {
      title: 'Buy Antivirus Software in Bangladesh | ESET, Bitdefender, Kaspersky',
      desc: 'Buy genuine antivirus software in Bangladesh — ESET, Bitdefender, Kaspersky, Norton at the lowest price. 1-3 year licenses, instant activation, 100% original.',
      keywords: 'buy antivirus in bangladesh, eset bd price, bitdefender bangladesh, kaspersky bd, antivirus cheap bd, shahed it',
    },
    'vpn': {
      title: 'Buy VPN in Bangladesh | NordVPN, ExpressVPN, Surfshark',
      desc: 'Buy premium VPN subscriptions in Bangladesh — NordVPN, ExpressVPN, Surfshark at the best price. Fast servers, secure browsing, instant delivery. Shahed IT.',
      keywords: 'buy vpn in bangladesh, nordvpn bd price, expressvpn bangladesh, surfshark bd, vpn subscription bangladesh, shahed it',
    },
    'streaming': {
      title: 'Buy Streaming Subscriptions in Bangladesh | Netflix, Spotify, YouTube',
      desc: 'Buy Netflix Premium, Spotify Premium, YouTube Premium and Disney+ subscriptions in Bangladesh at cheapest price. Instant delivery, verified accounts.',
      keywords: 'buy streaming in bangladesh, netflix bd price, spotify premium bd, youtube premium bangladesh, shahed it',
    },
    'ai-tools': {
      title: 'Buy AI Tools in Bangladesh | ChatGPT Plus, Claude, Midjourney',
      desc: 'Buy premium AI tool subscriptions in Bangladesh — ChatGPT Plus, Claude Pro, Midjourney, Perplexity at the lowest price. Instant activation, genuine access.',
      keywords: 'buy ai tools in bangladesh, chatgpt plus bd, claude pro bangladesh, midjourney bd, ai subscription bangladesh, shahed it',
    },
  };
  const catSeo = activeCategory ? CATEGORY_SEO[activeCategory.slug] : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={catSeo?.title
          ?? (activeCategory
            ? `Buy ${activeCategory.name} in Bangladesh | Best Price – Shahed IT`
            : 'Buy Digital Software, License Keys & Subscriptions – Best Price in Bangladesh')}
        description={catSeo?.desc
          ?? (activeCategory
            ? `Buy original ${activeCategory.name} at the best price in Bangladesh. 100% genuine license, instant email delivery, bKash/Nagad accepted. Shahed IT BD.`
            : 'Shop Windows 11, Office 365, Adobe CC, Netflix, Spotify, Antivirus, VPN & all digital software at the lowest price in Bangladesh. 100% genuine, instant delivery.')}
        canonical={activeCatSlug ? `https://shahedit.com/shop?category=${activeCatSlug}` : 'https://shahedit.com/shop'}
        keywords={catSeo?.keywords
          ?? (activeCategory
            ? `buy ${activeCategory.name} in bangladesh, ${activeCategory.name} price bd, ${activeCategory.name} bangladesh, shahed it`
            : 'digital software bangladesh, license key bangladesh, windows 11 key, office 365 bangladesh, adobe bangladesh, netflix subscription bd, shahed it')}
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
                                alt={`${cat.name} Category — Digital Software & Licenses in Bangladesh`}
                                title={cat.name}
                                loading="lazy"
                                decoding="async"
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
            <h2 className="sr-only">
              {activeCategory ? `Browse ${activeCategory.name} in Bangladesh` : 'Browse Digital Software in Bangladesh'}
            </h2>
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => {
                    const v = e.target.value;
                    setSearch(v);
                    const params: Record<string, string> = {};
                    if (activeCatSlug) params.category = activeCatSlug;
                    if (v) params.q = v;
                    setSearchParams(params);
                  }}
                  placeholder="প্রোডাক্ট খুঁজুন..."
                  className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ borderColor: 'hsl(var(--border))' }}
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch('');
                      const params: Record<string, string> = {};
                      if (activeCatSlug) params.category = activeCatSlug;
                      setSearchParams(params);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                    aria-label="Clear search"
                  >
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
                  <button onClick={() => setCategory('')} className="ml-0.5 hover:opacity-70" aria-label="Clear selected category"><X size={11} /></button>
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
              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-3 md:gap-4 ${hideOrphans ? 'grid-fill-rows-shop' : ''}`}>
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
