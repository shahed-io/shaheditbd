import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  ShoppingCart, MessageCircle, CreditCard, Star, Zap, Shield, Clock,
  CheckCircle2, ChevronLeft, ChevronRight, Heart, Package, Tag,
  Truck, ArrowLeft, Share2, Copy, Check, ChevronDown, AlertCircle,
  ThumbsUp, Send, User
} from 'lucide-react';
import QuickOrderModal from '@/components/store/QuickOrderModal';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { productSchema, breadcrumbSchema, faqSchema } from '@/components/seo/schemas';
import { SITE_URL } from '@/components/seo/SEOHead';

const WA = '8801840099853';
const PLACEHOLDER = 'https://placehold.co/600x600/0d1117/a855f7?text=Product';

interface ProductFull {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  images: string[] | null;
  what_you_get: string[] | null;
  delivery_time: string | null;
  is_featured: boolean | null;
  total_sales: number | null;
  variants: any;
  faq: any;
  category_id: string | null;
  categories: { name: string; slug: string } | null;
  created_at: string;
}

// ── Custom hook: trigger reveal when element enters viewport ──
const useReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRevealed(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, revealed };
};

// ── Custom Option types ──────────────────────────────────────
interface CustomOptionValue {
  id: string;
  label: string;
  price_adjustment: number;
  is_default: boolean;
  sort_order: number;
}

interface CustomOptionGroup {
  id: string;
  name: string;
  display_type: 'button' | 'radio' | 'dropdown';
  is_required: boolean;
  sort_order: number;
  values: CustomOptionValue[];
}

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();

  const [product,      setProduct]      = useState<ProductFull | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [activeImg,    setActiveImg]    = useState(0);
  const [showModal,    setShowModal]    = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [imgLoaded,    setImgLoaded]    = useState(false);
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({});
  const [customGroups, setCustomGroups] = useState<CustomOptionGroup[]>([]);
  const [entered,      setEntered]      = useState(false);
  const [quantity,     setQuantity]     = useState(1);
  // Keep selectedVar for legacy variants
  const [selectedVar,  setSelectedVar]  = useState<Record<string, string>>({});

  // Section reveals
  const descReveal   = useReveal(0.05);
  const faqReveal    = useReveal(0.05);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setEntered(false);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, category:category_id(name, slug)')
          .eq('slug', slug)
          .eq('status', 'active')
          .limit(1);
        if (cancelled) return;
        if (error) { setNotFound(true); setLoading(false); return; }
        const row = data?.[0];
        if (!row) { setNotFound(true); setLoading(false); return; }
        setProduct(row as any);

        // Fetch custom option groups from new system
        const { data: groupData } = await supabase
          .from('product_option_groups' as any)
          .select('*, product_option_values(*)')
          .eq('product_id', row.id)
          .order('sort_order');

        if (!cancelled && groupData && (groupData as any[]).length > 0) {
          const groups: CustomOptionGroup[] = (groupData as any[]).map((g: any) => ({
            id: g.id,
            name: g.name,
            display_type: g.display_type,
            is_required: g.is_required,
            sort_order: g.sort_order,
            values: (g.product_option_values || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((v: any) => ({
                id: v.id,
                label: v.label,
                price_adjustment: Number(v.price_adjustment),
                is_default: v.is_default,
                sort_order: v.sort_order,
              })),
          }));
          setCustomGroups(groups);
          // Initialize default selections
          const defaults: Record<string, string> = {};
          for (const g of groups) {
            const def = g.values.find(v => v.is_default) || g.values[0];
            if (def) defaults[g.id] = def.id;
          }
          setSelectedOpts(defaults);
        }

        setLoading(false);
        setTimeout(() => setEntered(true), 80);
        supabase.from('products').update({ total_views: (row.total_views || 0) + 1 }).eq('id', row.id).then(() => {});
      } catch {
        if (!cancelled) { setNotFound(true); setLoading(false); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Skeleton image */}
          <div className="aspect-square rounded-3xl relative overflow-hidden shimmer" />
          <div className="space-y-4 pt-4">
            {[70, 100, 50, 80, 40, 90, 60].map((w, i) => (
              <div key={i} className="rounded-xl shimmer h-5" style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
            ))}
            <div className="h-14 rounded-2xl shimmer mt-6" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="h-12 rounded-2xl shimmer" />
              <div className="h-12 rounded-2xl shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (notFound || !product) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <div className="text-7xl">😕</div>
        <h2 className="text-2xl font-sora font-bold text-foreground">Product Not Found</h2>
        <p className="text-muted-foreground">This product doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white btn-primary-new">
          <ArrowLeft size={16} /> Back to Store
        </button>
      </div>
    </div>
  );

  const images = [
    product.image_url || PLACEHOLDER,
    ...(product.images || []).filter(img => img !== product.image_url),
  ].filter(Boolean);
  if (images.length === 0) images.push(PLACEHOLDER);

  // Support both new grouped format { name, options: [{label, price}] } and old flat format { name, options: string[] }
  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  // Normalize to grouped format with prices
  interface VariantOption { label: string; price?: number; }
  interface VariantGroup { name: string; options: VariantOption[]; }
  const legacyVariants: VariantGroup[] = rawVariants.map((v: any) => ({
    name: v.name || v.label || 'Options',
    options: Array.isArray(v.options)
      ? v.options.map((o: any) => typeof o === 'string' ? { label: o } : { label: o.label, price: o.price ? parseFloat(o.price) : undefined })
      : [],
  })).filter((v: VariantGroup) => v.options.length > 0);
  const faqs: { q: string; a: string }[] = Array.isArray(product.faq) ? product.faq : [];

  const wishlisted = isWishlisted(product.id);
  const inCart     = isInCart(product.id);

  // Compute displayed price:
  // 1. Check new custom option groups (DB-driven)
  // 2. Fall back to legacy variants (JSONB-driven)
  // 3. Fall back to base price
  const getSelectedPrice = (): number => {
    // New system: custom option groups
    if (customGroups.length > 0) {
      for (const group of customGroups) {
        const selValueId = selectedOpts[group.id];
        const val = selValueId
          ? group.values.find(v => v.id === selValueId)
          : group.values.find(v => v.is_default) || group.values[0];
        if (val && val.price_adjustment > 0) return val.price_adjustment;
      }
    }
    // Legacy variant system
    for (const group of legacyVariants) {
      const selectedLabel = selectedVar[group.name] || group.options[0]?.label;
      const opt = group.options.find(o => o.label === selectedLabel);
      if (opt?.price !== undefined && opt.price > 0) return opt.price;
    }
    return product.price;
  };
  const displayPrice = getSelectedPrice();
  const savings    = product.original_price ? product.original_price - displayPrice : 0;
  const discount   = product.discount_percent || (product.original_price ? Math.round(savings / product.original_price * 100) : 0);

  // Build selected options string for WhatsApp/order
  const selectedOptsStr = customGroups.length > 0
    ? customGroups.map(g => {
        const selId = selectedOpts[g.id];
        const val = selId ? g.values.find(v => v.id === selId) : g.values.find(v => v.is_default) || g.values[0];
        return val ? `${g.name}: ${val.label}` : null;
      }).filter(Boolean).join(', ')
    : Object.entries(selectedVar).map(([k, v]) => `${k}: ${v}`).join(', ');

  const cartItem = {
    id: product.id,
    name: product.name,
    category: product.categories?.name || '',
    price: displayPrice,
    originalPrice: product.original_price || undefined,
    image: product.image_url || PLACEHOLDER,
  };

  const waOrder = () => {
    const msg = encodeURIComponent(`অর্ডার করতে চাই:\n📦 ${product.name}${selectedOptsStr ? `\n⚙️ ${selectedOptsStr}` : ''}\n💰 ৳${displayPrice.toLocaleString()}\n🔗 ${window.location.href}`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prevImg = () => { setImgLoaded(false); setActiveImg(i => (i - 1 + images.length) % images.length); };
  const nextImg = () => { setImgLoaded(false); setActiveImg(i => (i + 1) % images.length); };

  // Build SEO schemas
  const seoSchemas = [
    productSchema({
      name: product.name,
      description: product.short_description || product.description,
      image: product.image_url,
      price: product.price,
      slug: product.slug,
      category: product.categories?.name,
    }),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      ...(product.categories ? [{ name: product.categories.name, url: `/?cat=${product.categories.slug}` }] : []),
      { name: product.name, url: `/product/${product.slug}` },
    ]),
    ...(faqs.length > 0 ? [faqSchema(faqs)] : []),
  ];

  const breadcrumbItems = [
    ...(product.categories ? [{ label: product.categories.name, href: `/?cat=${product.categories.slug}` }] : []),
    { label: product.name },
  ];

  return (
    <>
      <SEOHead
        title={product.name}
        description={product.short_description || product.description || `${product.name} — ৳${product.price.toLocaleString()} | Shahed Store থেকে তাৎক্ষণিক ডেলিভারি`}
        ogImage={product.image_url || undefined}
        ogType="product"
        schema={seoSchemas}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* ── Breadcrumb ── */}
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(-10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* ── Main Content ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">

            {/* ═══ LEFT: Image Gallery ═══ */}
            <div className="space-y-4">
              {/* Main Image with cinematic entrance */}
            <div
                className={`relative rounded-3xl overflow-hidden border aspect-square group${entered ? ' rainbow-glow-border' : ''}`}
                style={{
                  background: 'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.60) 100%)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  borderColor: 'transparent',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateX(-40px) scale(0.95)',
                  transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                {/* Gradient top border */}
                <div className="h-[2px] w-full absolute top-0 left-0 z-10"
                  style={{ background: 'linear-gradient(90deg, hsl(258,78%,55%), hsl(200,90%,45%))' }} />

                {/* Shimmer sweep on load */}
                {entered && <div className="neon-sweep-line" />}

                {!imgLoaded && <div className="absolute inset-0 shimmer" />}
                <img
                  key={images[activeImg]}
                  src={images[activeImg]}
                  alt={product.name}
                  onLoad={() => setImgLoaded(true)}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  style={{ opacity: imgLoaded ? 1 : 0 }}
                />


                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {discount > 0 && (
                    <span className="badge-pop badge-sale" style={{ animationDelay: '0.5s' }}>
                      -{discount}% OFF
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="badge-pop badge-hot-item flex items-center gap-1" style={{ animationDelay: '0.65s' }}>
                      <Zap size={10} fill="white" /> HOT
                    </span>
                  )}
                </div>

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid hsla(258,78%,60%,0.25)', color: 'hsl(258,78%,50%)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px hsla(258,78%,55%,0.15)' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid hsla(258,78%,60%,0.25)', color: 'hsl(258,78%,50%)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px hsla(258,78%,55%,0.15)' }}>
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(cartItem)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 z-10"
                  style={{
                    background: wishlisted ? 'hsla(320,90%,62%,0.15)' : 'rgba(255,255,255,0.80)',
                    border: `1px solid ${wishlisted ? 'hsla(320,90%,62%,0.45)' : 'hsla(258,78%,60%,0.20)'}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 12px hsla(258,78%,55%,0.10)',
                  }}>
                  <Heart size={16} fill={wishlisted ? 'hsl(320,90%,62%)' : 'none'} color={wishlisted ? 'hsl(320,90%,62%)' : 'hsl(var(--muted-foreground))'} />
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div
                  className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s',
                  }}
                >
                  {images.map((img, i) => (
                    <button key={i} onClick={() => { setActiveImg(i); setImgLoaded(false); }}
                      className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${activeImg === i ? 'border-primary shadow-[0_0_16px_hsla(271,91%,65%,0.5)]' : 'border-border hover:border-primary/50'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Shield size={16} />, label: '100% Genuine', sub: 'Verified Product', delay: '0.9s', color: 'hsl(258,78%,55%)', accent: 'hsla(258,78%,55%,0.12)' },
                  { icon: <Truck size={16} />, label: 'Instant Delivery', sub: product.delivery_time || '5–30 min', delay: '1.05s', color: 'hsl(200,90%,45%)', accent: 'hsla(200,90%,45%,0.10)' },
                  { icon: <Clock size={16} />, label: '24/7 Support', sub: 'Always Available', delay: '1.2s', color: 'hsl(158,80%,45%)', accent: 'hsla(158,80%,45%,0.10)' },
                ].map(b => (
                  <div
                    key={b.label}
                    className="rounded-2xl p-3 text-center"
                    style={{
                      background: `linear-gradient(155deg, rgba(255,255,255,0.82) 0%, ${b.accent})`,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: `1px solid ${b.color}22`,
                      boxShadow: `0 4px 16px ${b.color}18, 0 1px 0 rgba(255,255,255,0.9) inset`,
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.9)',
                      transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${b.delay}, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${b.delay}`,
                    }}
                  >
                    <div className="flex justify-center mb-1.5" style={{ color: b.color }}>{b.icon}</div>
                    <div className="text-xs font-bold" style={{ color: 'hsl(226,35%,18%)' }}>{b.label}</div>
                    <div className="text-[10px]" style={{ color: 'hsl(226,25%,52%)' }}>{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ RIGHT: Product Info ═══ */}
            <div className="flex flex-col gap-5">

              {/* ── Glass Info Card: Title + Short Desc + Rating + Price ── */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  background: 'linear-gradient(155deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.68) 100%)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  border: '1px solid hsla(258,78%,60%,0.22)',
                  boxShadow: '0 8px 40px hsla(258,78%,55%,0.12), 0 1px 0 rgba(255,255,255,0.95) inset',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(28px)',
                  transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s',
                }}
              >
                {/* Top shimmer line */}
                <div className="h-[2px] w-full absolute top-0 left-0 z-10"
                  style={{ background: 'linear-gradient(90deg, hsl(258,78%,55%), hsl(185,90%,52%), hsl(258,78%,55%))' }} />

                <div className="px-5 pt-5 pb-4">
                  {/* Category + Share row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-fira font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ color: 'hsl(185,90%,42%)', background: 'hsla(185,90%,52%,0.12)', border: '1px solid hsla(185,90%,52%,0.25)' }}>
                      {product.categories?.name || 'Digital Product'}
                    </span>
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                      style={{ color: copied ? 'hsl(158,80%,45%)' : 'hsl(226,25%,45%)', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid hsla(258,78%,60%,0.18)', boxShadow: '0 2px 8px hsla(258,78%,55%,0.08)' }}>
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Share</>}
                    </button>
                  </div>

                  {/* Title */}
                  <h1 className="font-sora font-black text-2xl sm:text-3xl leading-tight mb-2"
                    style={{ color: 'hsl(226,35%,14%)' }}>
                    {product.name}
                  </h1>

                  {/* Short Description — bullet list */}
                  {product.short_description && (() => {
                    const lines = product.short_description
                      .split('\n')
                      .map(l => l.replace(/^[-•*]\s*/, '').trim())
                      .filter(Boolean);
                    return lines.length > 1 ? (
                      <ul className="mb-3 space-y-1.5">
                        {lines.map((line, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                            <span className="mt-[3px] flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: 'hsla(258,78%,55%,0.12)', border: '1px solid hsla(258,78%,55%,0.28)' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(258,78%,55%)' }} />
                            </span>
                            <span style={{ color: 'hsl(226,25%,38%)' }}>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-relaxed mb-3" style={{ color: 'hsl(226,25%,42%)' }}>
                        {product.short_description}
                      </p>
                    );
                  })()}

                  {/* Thin divider */}
                  <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, hsla(258,78%,60%,0.15), hsla(185,90%,52%,0.15), transparent)' }} />

                  {/* Rating + Sales + Stock */}
                  <div className="flex items-center flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} fill="hsl(38,100%,55%)" color="hsl(38,100%,55%)" />
                      ))}
                      <span className="text-sm font-semibold ml-1" style={{ color: 'hsl(226,35%,18%)' }}>4.9</span>
                    </div>
                    <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(226,25%,75%)' }} />
                    <span className="text-sm" style={{ color: 'hsl(226,25%,48%)' }}>{(product.total_sales || 0) + 50}+ sold</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(226,25%,75%)' }} />
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ color: 'hsl(158,80%,38%)', background: 'hsla(158,80%,48%,0.12)', border: '1px solid hsla(158,80%,48%,0.28)' }}>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> In Stock
                    </span>
                  </div>

                  {/* Price row */}
                  <div className="flex items-end gap-4 py-3 px-4 rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.07) 0%, hsla(185,90%,52%,0.05) 100%)', border: '1px solid hsla(258,78%,60%,0.14)' }}>
                    <span className="text-4xl font-sora font-black" style={{ color: 'hsl(258,78%,42%)' }}>
                      ৳{displayPrice.toLocaleString()}
                    </span>
                    {product.original_price && product.original_price > displayPrice && (
                      <div className="flex flex-col">
                        <div className="text-lg line-through" style={{ color: 'hsl(226,25%,62%)' }}>৳{product.original_price.toLocaleString()}</div>
                        {savings > 0 && (
                          <div className="text-xs font-bold" style={{ color: 'hsl(40,100%,48%)' }}>
                            Save ৳{savings.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                    {discount > 0 && (
                      <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ color: 'hsl(0,85%,55%)', background: 'hsla(0,85%,55%,0.10)', border: '1px solid hsla(0,85%,55%,0.25)' }}>
                        -{discount}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Custom Option Groups (new DB system) ── */}
              {customGroups.map((group, gi) => {
                const selValueId = selectedOpts[group.id];
                const currentVal = selValueId
                  ? group.values.find(v => v.id === selValueId)
                  : group.values.find(v => v.is_default) || group.values[0];

                return (
                  <div
                    key={group.id}
                    style={{
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'translateY(16px)',
                      transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.44 + gi * 0.08}s`,
                    }}
                  >
                    {/* Group label */}
                    <p className="text-sm font-medium text-muted-foreground mb-2.5">
                      {group.name}
                    </p>

                    {/* Dropdown display */}
                    {group.display_type === 'dropdown' && (
                      <select
                        value={selValueId || ''}
                        onChange={e => setSelectedOpts(p => ({ ...p, [group.id]: e.target.value }))}
                        className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        {group.values.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Radio display */}
                    {group.display_type === 'radio' && (
                      <div className="space-y-2">
                        {group.values.map(v => {
                          const isSel = (selValueId || (group.values.find(x => x.is_default) || group.values[0])?.id) === v.id;
                          return (
                            <label
                              key={v.id}
                              className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                              style={{
                                borderColor: isSel ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                                background: isSel ? 'hsla(var(--foreground) / 0.06)' : 'transparent',
                              }}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSel ? 'border-foreground' : 'border-border'}`}>
                                {isSel && <div className="w-2 h-2 rounded-full bg-foreground" />}
                              </div>
                              <input type="radio" className="sr-only" checked={isSel} onChange={() => setSelectedOpts(p => ({ ...p, [group.id]: v.id }))} />
                              <span className="text-sm font-semibold text-foreground flex-1">{v.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Button display (default) — FanFlix style */}
                    {group.display_type === 'button' && (
                      <div className="flex flex-wrap gap-2">
                        {group.values.map(v => {
                          const isSel = (selValueId || (group.values.find(x => x.is_default) || group.values[0])?.id) === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => setSelectedOpts(p => ({ ...p, [group.id]: v.id }))}
                              className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:scale-[1.03] active:scale-95"
                              style={isSel
                                ? { borderColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', background: 'hsl(var(--foreground))' }
                                : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }
                              }
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Legacy Variants (JSONB fallback) — hidden when new system active ── */}
              {customGroups.length === 0 && legacyVariants.map((group, vi) => {
                const selectedLabel = selectedVar[group.name] || group.options[0]?.label;
                return (
                  <div
                    key={group.name + vi}
                    style={{
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'translateY(16px)',
                      transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.44 + vi * 0.08}s`,
                    }}
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-2.5">{group.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedLabel === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setSelectedVar(p => ({ ...p, [group.name]: opt.label }))}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:scale-[1.03] active:scale-95"
                            style={isSelected
                              ? { borderColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', background: 'hsl(var(--foreground))' }
                              : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Quantity selector */}
              <div
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(12px)',
                  transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.52s',
                }}
              >
                <p className="text-sm font-medium text-muted-foreground mb-2.5">Quantity</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center text-lg font-bold text-foreground hover:bg-muted/50 transition-colors"
                    >−</button>
                    <span className="w-12 text-center font-bold text-base text-foreground">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-11 h-11 flex items-center justify-center text-lg font-bold text-foreground hover:bg-muted/50 transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* CTA Buttons — Glassmorphism Card */}
              <div
                className="rounded-3xl p-4 space-y-3"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(28px)',
                  transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.5s',
                  background: 'hsla(0,0%,100%,0.70)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1.5px solid hsla(258,78%,60%,0.20)',
                  boxShadow: '0 8px 40px hsla(258,78%,55%,0.10), inset 0 1px 0 hsla(0,0%,100%,0.85)',
                }}
              >
                {/* Order Now — primary gradient */}
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))',
                    boxShadow: '0 4px 20px hsla(258,78%,55%,0.40), inset 0 1px 0 hsla(0,0%,100%,0.20)',
                  }}
                >
                  <CreditCard size={18} /> Order Now
                </button>

                {/* WhatsApp + Cart — row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <button onClick={waOrder}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, hsla(142,70%,38%,0.85), hsla(158,80%,34%,0.85))',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1.5px solid hsla(142,70%,55%,0.45)',
                      color: 'hsl(0,0%,100%)',
                      boxShadow: '0 2px 14px hsla(142,70%,44%,0.25)',
                    }}>
                    <MessageCircle size={15} /> WhatsApp
                  </button>

                  {/* Cart */}
                  <button
                    onClick={() => addToCart(cartItem)}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={inCart
                      ? {
                          background: 'hsla(258,78%,55%,0.10)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1.5px solid hsla(258,78%,55%,0.40)',
                          color: 'hsl(258,78%,48%)',
                          boxShadow: '0 2px 12px hsla(258,78%,55%,0.12)',
                        }
                      : {
                          background: 'hsla(0,0%,100%,0.60)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1.5px solid hsla(220,20%,75%,0.50)',
                          color: 'hsl(226,35%,30%)',
                          boxShadow: '0 2px 8px hsla(220,20%,50%,0.08)',
                        }
                    }
                  >
                    <ShoppingCart size={15} />
                    {inCart ? '✓ Added' : 'Cart'}
                  </button>
                </div>
              </div>


              {/* What You Get */}
              {product.what_you_get && product.what_you_get.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid hsla(258,78%,75%,0.22)',
                    boxShadow: '0 4px 24px hsla(258,78%,55%,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(20px)',
                    transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.64s',
                  }}
                >
                  <h3 className="font-sora font-bold text-base flex items-center gap-2 mb-4" style={{ color: 'hsl(226,35%,18%)' }}>
                    <Package size={16} style={{ color: 'hsl(258,78%,55%)' }} /> What You'll Get
                  </h3>
                  <ul className="space-y-2.5">
                    {product.what_you_get.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm"
                        style={{
                          color: 'hsl(226,25%,35%)',
                          opacity: entered ? 1 : 0,
                          transform: entered ? 'none' : 'translateX(-12px)',
                          transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.7 + i * 0.07}s`,
                        }}>
                        <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(158,80%,45%)' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom: Description + FAQ ── */}
          <div className="mt-14 grid lg:grid-cols-3 gap-8">

            <div
              className={faqs.length > 0 ? 'lg:col-span-2' : 'col-span-full'}
              ref={descReveal.ref}
              style={{
                opacity: 1,
                transform: 'none',
                transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
                <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
                {product.description ? 'Product Description' : 'Why Choose This Product?'}
              </h2>
              <div
                className="rounded-2xl p-6 text-sm leading-relaxed"
                style={{
                  background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid hsla(258,78%,75%,0.22)',
                  boxShadow: '0 4px 24px hsla(258,78%,55%,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
                  color: 'hsl(226,25%,40%)',
                }}
              >
                {product.description ? (
                  <div className="prose prose-sm max-w-none
                    prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                    prose-h2:text-base prose-h3:text-sm
                    prose-p:text-[hsl(226,25%,40%)] prose-p:mb-2 prose-p:leading-relaxed
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-ul:pl-4 prose-ul:space-y-1
                    prose-li:text-[hsl(226,25%,40%)] prose-li:leading-relaxed
                    prose-a:text-primary">
                    <ReactMarkdown>{product.description}</ReactMarkdown>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {[
                      { icon: '✅', text: '100% Genuine & Original License — directly from official source' },
                      { icon: '⚡', text: 'Instant Digital Delivery — received within 5–30 minutes after payment' },
                      { icon: '🔒', text: 'Lifetime Activation — one-time purchase, no subscription needed' },
                      { icon: '🛡️', text: 'After-sales Support — our team is available 24/7 to help you activate' },
                      { icon: '💳', text: 'Easy Payment — bKash, Nagad, Rocket, Card & more options available' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3"
                        style={{
                          opacity: descReveal.revealed ? 1 : 0,
                          transform: descReveal.revealed ? 'none' : 'translateX(-12px)',
                          transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.08}s`,
                        }}>
                        <span className="text-base">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {faqs.length > 0 && (
              <div
                ref={faqReveal.ref}
                style={{
                  opacity: faqReveal.revealed ? 1 : 0,
                  transform: faqReveal.revealed ? 'none' : 'translateX(30px)',
                  transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s',
                }}
              >
                <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
                  <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
                  FAQ
                </h2>
                <div className="space-y-3">
                  {faqs.map((f, i) => (
                    <FAQItem key={i} q={f.q} a={f.a} delay={i * 0.07} revealed={faqReveal.revealed} />
                  ))}
                </div>
              </div>
            )}
          {/* ── Specifications table from attributes ── */}
          <ProductSpecsTable productId={product.id} />
          </div>
        </div>

        {/* ── Customer Reviews ── */}
        <ProductReviews productId={product.id} productSlug={product.slug} />

        {/* ── Related Products ── */}
        <RelatedProducts categoryId={product.category_id} currentProductId={product.id} />

        <Footer />
      </div>

      {showModal && (
        <QuickOrderModal
          product={{ id: product.id, name: product.name, price: product.price, originalPrice: product.original_price || undefined, image: product.image_url || PLACEHOLDER, category: product.categories?.name || '' }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// ── Related Products ─────────────────────────────────────────
interface RelatedProduct {
  id: string; name: string; slug: string; price: number;
  original_price: number | null; discount_percent: number | null;
  image_url: string | null; is_featured: boolean | null;
  tags: string[] | null;
  categories: { name: string } | null;
}

const ITEMS_PER_PAGE = 4;

const RelatedProducts = ({ categoryId, currentProductId }: { categoryId: string | null; currentProductId: string }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage] = useState(0);
  const sectionReveal = useReveal(0.05);

  useEffect(() => {
    const query = supabase
      .from('products')
      .select('id, name, slug, price, original_price, discount_percent, image_url, is_featured, tags, category:category_id(name)')
      .eq('status', 'active')
      .neq('id', currentProductId)
      .limit(8);

    if (categoryId) {
      query.eq('category_id', categoryId);
    }

    query.then(({ data }) => {
      setProducts((data as any[]) || []);
      setLoading(false);
    });
  }, [categoryId, currentProductId]);

  if (!loading && products.length === 0) return null;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const visible = products.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  return (
    <div
      ref={sectionReveal.ref}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      style={{
        opacity: sectionReveal.revealed ? 1 : 0,
        transform: sectionReveal.revealed ? 'none' : 'translateY(30px)',
        transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Divider */}
      <div className="border-t border-border mb-8" />

      {/* Section Header */}
      <h2 className="font-sora font-bold text-xl text-foreground mb-6">Related products</h2>

      {/* Grid — 4 columns matching reference */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-muted animate-pulse aspect-[3/4]" />
            ))
          : visible.map((p, i) => {
              const discount = p.discount_percent || (p.original_price && p.original_price > p.price ? Math.round((p.original_price - p.price) / p.original_price * 100) : 0);
              // build category tags from categories + some tags
              const categoryLabel = (p.categories as any)?.name || '';
              const extraTags = (p.tags || []).filter(t => !['flash-sale','requires-email'].includes(t)).slice(0, 2);
              const allTags = [categoryLabel, ...extraTags].filter(Boolean);

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.slug}`)}
                  className="group cursor-pointer flex flex-col"
                  style={{
                    opacity: sectionReveal.revealed ? 1 : 0,
                    transform: sectionReveal.revealed ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
                  }}
                >
                  {/* Image Box */}
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 group-hover:border-primary/40 transition-colors">
                    <img
                      src={p.image_url || PLACEHOLDER}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                    {/* Discount badge — orange circle like reference */}
                    {discount > 0 && (
                      <span
                        className="absolute top-2.5 left-2.5 w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white leading-none"
                        style={{ background: 'hsl(30,100%,50%)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
                      >
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="pt-3 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </p>

                    {/* Category / Tag pills */}
                    {allTags.length > 0 && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {allTags.join(', ')}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {p.original_price && p.original_price > p.price ? (
                        <>
                          <span className="text-xs line-through text-muted-foreground">
                            {p.original_price.toLocaleString()}৳
                          </span>
                          <span className="text-sm font-bold" style={{ color: 'hsl(35,100%,45%)' }}>
                            – {p.price.toLocaleString()}৳
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold" style={{ color: 'hsl(35,100%,45%)' }}>
                          {p.price.toLocaleString()}৳
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Dot Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="rounded-full transition-all"
              style={{
                width: i === page ? '24px' : '10px',
                height: '10px',
                background: i === page ? 'hsl(258,78%,55%)' : 'hsl(220,13%,82%)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── FAQ accordion item ──
const FAQItem = ({ q, a, delay = 0, revealed = true }: { q: string; a: string; delay?: number; revealed?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${open ? 'hsla(258,78%,60%,0.35)' : 'hsla(258,78%,75%,0.22)'}`,
        boxShadow: open ? '0 4px 24px hsla(258,78%,55%,0.12)' : '0 2px 12px hsla(258,78%,55%,0.06)',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'none' : 'translateY(16px)',
        transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, border-color 0.3s, box-shadow 0.3s`,
      }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-left gap-3" style={{ color: 'hsl(226,35%,18%)' }}>
        <span>{q}</span>
        <ChevronDown size={16} className="flex-shrink-0 transition-transform duration-300" style={{ color: 'hsl(258,78%,55%)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div className="overflow-hidden transition-all duration-400" style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}>
        <div className="px-5 pb-4 text-sm leading-relaxed border-t" style={{ borderColor: 'hsla(258,78%,75%,0.18)', paddingTop: '12px', color: 'hsl(226,25%,42%)' }}>{a}</div>
      </div>
    </div>
  );
};

// ── Product Specifications Table ──────────────────────────────
const ProductSpecsTable = ({ productId }: { productId: string }) => {
  const [specs, setSpecs] = useState<{ name: string; values: string[] }[]>([]);
  useEffect(() => {
    supabase
      .from('product_attribute_assignments' as any)
      .select('*, global_attributes(name)')
      .eq('product_id', productId)
      .eq('is_visible', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setSpecs((data as any[])
            .filter((a: any) => (a.selected_values || []).length > 0)
            .map((a: any) => ({
              name: a.attribute_type === 'custom' ? a.custom_name : (a.global_attributes?.name || ''),
              values: a.selected_values || [],
            }))
          );
        }
      });
  }, [productId]);
  if (specs.length === 0) return null;
  return (
    <div className="mt-10">
      <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
        <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
        Specifications
      </h2>
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid hsla(258,78%,75%,0.22)',
          boxShadow: '0 4px 24px hsla(258,78%,55%,0.08)',
        }}>
        <table className="w-full text-sm">
          <tbody>
            {specs.map((s, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.40)' : 'transparent' }}>
                <td className="px-5 py-3 font-semibold w-1/3 border-r" style={{ color: 'hsl(226,35%,22%)', borderColor: 'hsla(258,78%,75%,0.18)' }}>{s.name}</td>
                <td className="px-5 py-3" style={{ color: 'hsl(226,25%,42%)' }}>
                  <div className="flex flex-wrap gap-1.5">
                    {s.values.map(v => (
                      <span key={v} className="px-2.5 py-0.5 rounded-full text-xs" style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,75%,0.25)', color: 'hsl(258,78%,45%)' }}>{v}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Customer Reviews Section ──────────────────────────────────
interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
}

const StarRating = ({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          tabIndex={onChange ? 0 : -1}
        >
          <Star
            size={size}
            fill={(hover || value) >= s ? 'hsl(38,100%,55%)' : 'none'}
            color={(hover || value) >= s ? 'hsl(38,100%,55%)' : 'hsl(220,13%,75%)'}
          />
        </button>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId, productSlug }: { productId: string; productSlug: string }) => {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sectionReveal             = useReveal(0.05);

  // Form state
  const [rating, setRating]       = useState(5);
  const [name, setName]           = useState('');
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('product_reviews')
      .select('id, author_name, rating, title, body, is_verified, helpful_count, created_at')
      .eq('product_slug', productSlug)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20);
    setReviews((data as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [productSlug]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviews.filter(r => r.rating === n).length,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim() || rating < 1) return;
    setSubmitting(true);
    await (supabase as any).from('product_reviews').insert({
      product_id: productId,
      product_slug: productSlug,
      author_name: name.trim(),
      title: title.trim() || null,
      body: body.trim(),
      rating,
      status: 'pending',
    });
    setSubmitting(false);
    setSubmitted(true);
    setShowForm(false);
    setName(''); setTitle(''); setBody(''); setRating(5);
  };

  const handleHelpful = async (id: string, current: number) => {
    await (supabase as any).from('product_reviews').update({ helpful_count: current + 1 }).eq('id', id);
    setReviews(p => p.map(r => r.id === id ? { ...r, helpful_count: r.helpful_count + 1 } : r));
  };

  if (loading) return null;

  const glassStyle: React.CSSProperties = {
    background: 'linear-gradient(155deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.68) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid hsla(258,78%,75%,0.22)',
    boxShadow: '0 4px 24px hsla(258,78%,55%,0.08)',
  };

  return (
    <div
      ref={sectionReveal.ref}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      style={{
        opacity: sectionReveal.revealed ? 1 : 0,
        transform: sectionReveal.revealed ? 'none' : 'translateY(30px)',
        transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div className="border-t border-border mb-8" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2">
          <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
          গ্রাহক রিভিউ
          <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>
        </h2>
        {!submitted ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(271,91%,65%))', color: 'white', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}
          >
            <Star size={14} fill="white" color="white" />
            রিভিউ লিখুন
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl" style={{ color: 'hsl(158,80%,38%)', background: 'hsla(158,80%,48%,0.12)', border: '1px solid hsla(158,80%,48%,0.28)' }}>
            <CheckCircle2 size={14} /> রিভিউ পাঠানো হয়েছে!
          </span>
        )}
      </div>

      {/* Summary + Rating Bar */}
      {reviews.length > 0 && (
        <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-6" style={glassStyle}>
          {/* Avg score */}
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <div className="text-5xl font-sora font-black" style={{ color: 'hsl(258,78%,42%)' }}>
              {avgRating.toFixed(1)}
            </div>
            <StarRating value={Math.round(avgRating)} size={16} />
            <div className="text-xs text-muted-foreground mt-1">{reviews.length} রিভিউ</div>
          </div>
          {/* Bars */}
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs w-4 text-right font-semibold" style={{ color: 'hsl(226,35%,25%)' }}>{star}</span>
                <Star size={11} fill="hsl(38,100%,55%)" color="hsl(38,100%,55%)" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsla(258,78%,55%,0.10)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%',
                      background: 'linear-gradient(90deg, hsl(258,78%,55%), hsl(271,91%,65%))',
                    }}
                  />
                </div>
                <span className="text-xs w-5 text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 mb-6 space-y-4" style={glassStyle}>
          <h3 className="font-semibold text-foreground">আপনার রিভিউ লিখুন</h3>

          {/* Rating picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">রেটিং *</label>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">আপনার নাম *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">শিরোনাম (ঐচ্ছিক)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="সংক্ষিপ্ত শিরোনাম"
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">রিভিউ *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              rows={4}
              placeholder="প্রোডাক্টটি সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন..."
              className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !body.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(271,91%,65%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}
            >
              <Send size={14} />
              {submitting ? 'পাঠানো হচ্ছে...' : 'রিভিউ পাঠান'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">* রিভিউ অনুমোদনের পর প্রকাশিত হবে।</p>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={glassStyle}>
          <Star size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'hsl(38,100%,55%)' }} />
          <p className="text-muted-foreground text-sm">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <div
              key={r.id}
              className="rounded-2xl p-5"
              style={{
                ...glassStyle,
                opacity: sectionReveal.revealed ? 1 : 0,
                transform: sectionReveal.revealed ? 'none' : 'translateY(12px)',
                transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: `hsl(${(r.author_name.charCodeAt(0) * 47) % 360},65%,88%)`, color: `hsl(${(r.author_name.charCodeAt(0) * 47) % 360},65%,35%)` }}>
                  {r.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">{r.author_name}</span>
                    {r.is_verified && (
                      <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full font-bold"
                        style={{ color: 'hsl(158,80%,38%)', background: 'hsla(158,80%,48%,0.12)', border: '1px solid hsla(158,80%,48%,0.28)' }}>
                        <CheckCircle2 size={9} /> Verified
                      </span>
                    )}
                    <StarRating value={r.rating} size={12} />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(r.created_at).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                  {r.title && <p className="text-sm font-semibold text-foreground mb-1">{r.title}</p>}
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>{r.body}</p>
                  {/* Helpful */}
                  <button
                    onClick={() => handleHelpful(r.id, r.helpful_count)}
                    className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ThumbsUp size={12} />
                    সহায়ক ({r.helpful_count})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
