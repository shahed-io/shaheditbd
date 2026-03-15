import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  ShoppingCart, MessageCircle, CreditCard, Star, Zap, Shield, Clock,
  CheckCircle2, ChevronLeft, ChevronRight, Heart, Package, Tag,
  Truck, ArrowLeft, Share2, Copy, Check, ChevronDown, AlertCircle
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
                className="relative rounded-3xl overflow-hidden border aspect-square group"
                style={{
                  background: 'hsl(215,28%,10%)',
                  borderColor: entered ? 'hsla(271,91%,65%,0.35)' : 'transparent',
                  boxShadow: entered ? '0 0 60px hsla(271,91%,65%,0.12), 0 32px 80px hsla(215,40%,4%,0.6)' : 'none',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateX(-40px) scale(0.95)',
                  transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                {/* Neon top border */}
                <div className="h-[2px] w-full absolute top-0 left-0 z-10"
                  style={{ background: 'linear-gradient(90deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />

                {/* Neon sweep effect on load */}
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

                {/* Gradient overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent 50%, hsla(215,28%,6%,0.7) 100%)' }} />

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
                      style={{ background: 'hsla(215,28%,8%,0.9)', border: '1px solid hsla(271,91%,65%,0.3)', color: 'hsl(271,91%,75%)', backdropFilter: 'blur(8px)' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      style={{ background: 'hsla(215,28%,8%,0.9)', border: '1px solid hsla(271,91%,65%,0.3)', color: 'hsl(271,91%,75%)', backdropFilter: 'blur(8px)' }}>
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(cartItem)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 z-10"
                  style={{
                    background: wishlisted ? 'hsla(320,90%,62%,0.2)' : 'hsla(215,28%,10%,0.85)',
                    border: `1px solid ${wishlisted ? 'hsla(320,90%,62%,0.5)' : 'hsla(271,91%,65%,0.25)'}`,
                    backdropFilter: 'blur(8px)',
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
                  { icon: <Shield size={16} />, label: '100% Genuine', sub: 'Verified Product', delay: '0.9s', color: 'hsl(271,91%,65%)' },
                  { icon: <Truck size={16} />, label: 'Instant Delivery', sub: product.delivery_time || '5–30 min', delay: '1.05s', color: 'hsl(185,90%,52%)' },
                  { icon: <Clock size={16} />, label: '24/7 Support', sub: 'Always Available', delay: '1.2s', color: 'hsl(158,80%,48%)' },
                ].map(b => (
                  <div
                    key={b.label}
                    className="rounded-2xl p-3 text-center border"
                    style={{
                      background: 'hsla(215,28%,10%,0.8)',
                      borderColor: `${b.color}25`,
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.9)',
                      transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${b.delay}, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${b.delay}`,
                    }}
                  >
                    <div className="flex justify-center mb-1.5" style={{ color: b.color }}>{b.icon}</div>
                    <div className="text-xs font-bold text-foreground">{b.label}</div>
                    <div className="text-[10px] text-muted-foreground">{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ RIGHT: Product Info ═══ */}
            <div className="flex flex-col gap-5">

              {/* Category + Share */}
              <div
                className="flex items-center justify-between"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(20px)',
                  transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s',
                }}
              >
                <span className="text-xs font-fira font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ color: 'hsl(185,90%,62%)', background: 'hsla(185,90%,52%,0.12)', border: '1px solid hsla(185,90%,52%,0.25)' }}>
                  {product.categories?.name || 'Digital Product'}
                </span>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                  style={{ color: copied ? 'hsl(158,80%,55%)' : 'hsl(var(--muted-foreground))', background: 'hsla(215,28%,14%,0.8)', border: '1px solid hsl(var(--border))' }}>
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Share</>}
                </button>
              </div>

              {/* Title */}
              <div
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(24px)',
                  filter: entered ? 'none' : 'blur(3px)',
                  transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.22s',
                }}
              >
                <h1 className="font-sora font-black text-2xl sm:text-3xl text-foreground leading-tight">
                  {product.name}
                </h1>
                {product.short_description && (
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{product.short_description}</p>
                )}
              </div>

              {/* Rating + Sales */}
              <div
                className="flex items-center gap-4"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(16px)',
                  transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s',
                }}
              >
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} fill="hsl(38,100%,55%)" color="hsl(38,100%,55%)" />
                  ))}
                  <span className="text-sm font-semibold text-foreground ml-1">4.9</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-sm text-muted-foreground">{(product.total_sales || 0) + 50}+ sold</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ color: 'hsl(158,80%,55%)', background: 'hsla(158,80%,48%,0.12)', border: '1px solid hsla(158,80%,48%,0.25)' }}>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> In Stock
                </span>
              </div>

              {/* Price */}
              <div
                className="flex items-end gap-4 py-4 border-y"
                style={{
                  borderColor: 'hsla(271,91%,65%,0.2)',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'scale(0.9) translateX(-16px)',
                  transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.38s',
                }}
              >
                <span className="text-4xl font-sora font-black" style={{ color: 'hsl(271,91%,75%)', textShadow: '0 0 30px hsla(271,91%,65%,0.4)' }}>
                  ৳{displayPrice.toLocaleString()}
                </span>
                {product.original_price && (
                  <div>
                    <div className="text-lg text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</div>
                    <div className="text-sm font-bold" style={{ color: 'hsl(40,100%,58%)' }}>
                      আপনি বাঁচালেন ৳{savings.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Variants */}
              {variants.map((group, vi) => {
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
                    <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                      <Tag size={12} style={{ color: 'hsl(185,90%,52%)' }} />
                      {group.name}:
                      <span style={{ color: 'hsl(271,91%,75%)' }}>{selectedLabel}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedLabel === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setSelectedVar(p => ({ ...p, [group.name]: opt.label }))}
                            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all hover:scale-105 flex flex-col items-center"
                            style={isSelected
                              ? { borderColor: 'hsl(271,91%,65%)', color: 'hsl(271,91%,75%)', background: 'hsla(271,91%,65%,0.12)' }
                              : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'transparent' }
                            }
                          >
                            <span>{opt.label}</span>
                            {opt.price !== undefined && opt.price > 0 && (
                              <span className="text-xs font-bold mt-0.5" style={{ color: isSelected ? 'hsl(271,91%,80%)' : 'hsl(var(--muted-foreground))' }}>
                                ৳{opt.price.toLocaleString()}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* CTA Buttons */}
              <div
                className="space-y-3"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(28px)',
                  transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.5s',
                }}
              >
                <button onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_hsla(271,91%,65%,0.5)]"
                  style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))', boxShadow: '0 4px 24px hsla(271,91%,65%,0.35)' }}>
                  <CreditCard size={18} /> Order Now — ৳{displayPrice.toLocaleString()}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={waOrder}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, hsl(142,70%,40%), hsl(158,80%,38%))', boxShadow: '0 4px 16px hsla(142,70%,40%,0.3)' }}>
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                  <button onClick={() => addToCart(cartItem)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:scale-[1.02]"
                    style={inCart
                      ? { borderColor: 'hsl(271,91%,65%)', color: 'hsl(271,91%,75%)', background: 'hsla(271,91%,65%,0.1)' }
                      : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }
                    }>
                    <ShoppingCart size={16} />
                    {inCart ? '✓ In Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>

              {/* Delivery Time */}
              {product.delivery_time && (
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: 'hsla(158,80%,48%,0.08)',
                    border: '1px solid hsla(158,80%,48%,0.2)',
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(16px)',
                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.58s',
                  }}
                >
                  <Clock size={18} style={{ color: 'hsl(158,80%,55%)' }} className="flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-foreground">Delivery Time</div>
                    <div className="text-xs text-muted-foreground">{product.delivery_time}</div>
                  </div>
                </div>
              )}

              {/* What You Get */}
              {product.what_you_get && product.what_you_get.length > 0 && (
                <div
                  className="rounded-2xl p-5 border"
                  style={{
                    background: 'hsla(215,28%,10%,0.7)',
                    borderColor: 'hsla(271,91%,65%,0.15)',
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(20px)',
                    transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.64s',
                  }}
                >
                  <h3 className="font-sora font-bold text-base text-foreground flex items-center gap-2 mb-4">
                    <Package size={16} style={{ color: 'hsl(271,91%,65%)' }} /> What You'll Get
                  </h3>
                  <ul className="space-y-2.5">
                    {product.what_you_get.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground"
                        style={{
                          opacity: entered ? 1 : 0,
                          transform: entered ? 'none' : 'translateX(-12px)',
                          transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.7 + i * 0.07}s`,
                        }}>
                        <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(158,80%,55%)' }} />
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
              className={faqs.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}
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
                className="rounded-2xl p-6 text-sm text-muted-foreground leading-relaxed border"
                style={{ background: 'hsla(215,28%,10%,0.7)', borderColor: 'hsla(271,91%,65%,0.1)' }}
              >
                {product.description ? (
                  product.description.split('\n').map((line, i) =>
                    line.trim() ? <p key={i} className="mb-3 last:mb-0">{line}</p> : null
                  )
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
          </div>
        </div>

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

// ── FAQ accordion item ──
const FAQItem = ({ q, a, delay = 0, revealed = true }: { q: string; a: string; delay?: number; revealed?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden border transition-all"
      style={{
        background: 'hsla(215,28%,10%,0.7)',
        borderColor: open ? 'hsla(271,91%,65%,0.3)' : 'hsla(271,91%,65%,0.1)',
        boxShadow: open ? '0 0 24px hsla(271,91%,65%,0.08)' : 'none',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'none' : 'translateY(16px)',
        transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, border-color 0.3s, box-shadow 0.3s`,
      }}
    >
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground text-left gap-3">
        <span>{q}</span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 transition-transform duration-300"
          style={{ color: 'hsl(271,91%,65%)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-400"
        style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}
      >
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t"
          style={{ borderColor: 'hsla(271,91%,65%,0.1)', paddingTop: '12px' }}>
          {a}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
