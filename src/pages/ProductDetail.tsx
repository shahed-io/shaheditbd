import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  ShoppingCart, MessageCircle, CreditCard, Star, Zap, Shield, Clock,
  CheckCircle2, ChevronLeft, ChevronRight, Heart, Package, Tag,
  Truck, ArrowLeft, Share2, Copy, Check, ChevronDown, Info
} from 'lucide-react';
import QuickOrderModal from '@/components/store/QuickOrderModal';

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
  warranty_note: string | null;
  refund_note: string | null;
  brand: string | null;
}

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

// ── Variant option with optional price ──
interface VariantOption {
  label: string;
  price?: number;
}

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();

  const [product,     setProduct]     = useState<ProductFull | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [activeImg,   setActiveImg]   = useState(0);
  const [showModal,   setShowModal]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [selectedVar, setSelectedVar] = useState<Record<string, string>>({});
  const [entered,     setEntered]     = useState(false);
  const [openDesc,    setOpenDesc]    = useState(true);
  const [openWarranty,setOpenWarranty]= useState(false);
  const [openRefund,  setOpenRefund]  = useState(false);
  const [openFaq,     setOpenFaq]     = useState(false);

  const descReveal = useReveal(0.05);
  const faqReveal  = useReveal(0.05);

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
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl relative overflow-hidden shimmer" />
          <div className="space-y-4 pt-4">
            {[70, 100, 50, 80, 40, 90, 60].map((w, i) => (
              <div key={i} className="rounded-xl shimmer h-5" style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
            ))}
            <div className="h-14 rounded-2xl shimmer mt-6" />
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

  const variants: { name: string; options: (string | VariantOption)[] }[] = Array.isArray(product.variants) ? product.variants : [];
  const faqs: { q: string; a: string }[] = Array.isArray(product.faq) ? product.faq : [];

  // Compute selected variant price offset
  const getVariantPrice = (): number => {
    for (const v of variants) {
      const sel = selectedVar[v.name] || (typeof v.options?.[0] === 'string' ? v.options[0] : (v.options?.[0] as VariantOption)?.label);
      for (const opt of v.options || []) {
        const label = typeof opt === 'string' ? opt : opt.label;
        const price = typeof opt === 'string' ? null : opt.price;
        if (label === sel && price != null) return price;
      }
    }
    return product.price;
  };

  const displayPrice = getVariantPrice();

  const wishlisted = isWishlisted(product.id);
  const inCart     = isInCart(product.id);
  const savings    = product.original_price ? product.original_price - displayPrice : 0;
  const discount   = product.discount_percent || (product.original_price ? Math.round(savings / product.original_price * 100) : 0);

  const cartItem = {
    id: product.id,
    name: product.name,
    category: product.categories?.name || '',
    price: displayPrice,
    originalPrice: product.original_price || undefined,
    image: product.image_url || PLACEHOLDER,
  };

  const waOrder = () => {
    const varStr = Object.entries(selectedVar).map(([k, v]) => `${k}: ${v}`).join(', ');
    const msg = encodeURIComponent(`অর্ডার করতে চাই:\n📦 ${product.name}${varStr ? `\n⚙️ ${varStr}` : ''}\n💰 ৳${displayPrice.toLocaleString()}\n🔗 ${window.location.href}`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prevImg = () => { setImgLoaded(false); setActiveImg(i => (i - 1 + images.length) % images.length); };
  const nextImg = () => { setImgLoaded(false); setActiveImg(i => (i + 1) % images.length); };

  const getOptionLabel = (opt: string | VariantOption) => typeof opt === 'string' ? opt : opt.label;
  const getOptionPrice = (opt: string | VariantOption) => typeof opt === 'string' ? null : opt.price ?? null;

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Breadcrumb */}
        <div
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(-10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Home</button>
            <span>/</span>
            {product.categories && (
              <>
                <button onClick={() => navigate(`/?cat=${product.categories!.slug}`)} className="hover:text-primary transition-colors capitalize">
                  {product.categories.name}
                </button>
                <span>/</span>
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-[220px]">{product.name}</span>
          </nav>
        </div>

        {/* ── Main Grid ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-14">

            {/* ═══ LEFT: Image Gallery ═══ */}
            <div className="space-y-3">
              {/* Main Image */}
              <div
                className="relative rounded-2xl overflow-hidden border group"
                style={{
                  background: 'hsl(215,28%,10%)',
                  borderColor: entered ? 'hsla(271,91%,65%,0.3)' : 'transparent',
                  boxShadow: entered ? '0 0 50px hsla(271,91%,65%,0.1), 0 24px 60px hsla(215,40%,4%,0.5)' : 'none',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateX(-30px) scale(0.97)',
                  transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
                  aspectRatio: '1/1',
                }}
              >
                <div className="h-[2px] w-full absolute top-0 left-0 z-10"
                  style={{ background: 'linear-gradient(90deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />

                {!imgLoaded && <div className="absolute inset-0 shimmer" />}
                <img
                  key={images[activeImg]}
                  src={images[activeImg]}
                  alt={product.name}
                  onLoad={() => setImgLoaded(true)}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  style={{ opacity: imgLoaded ? 1 : 0 }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent 55%, hsla(215,28%,6%,0.65) 100%)' }} />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {discount > 0 && <span className="badge-pop badge-sale">-{discount}% OFF</span>}
                  {product.is_featured && <span className="badge-pop badge-hot-item flex items-center gap-1"><Zap size={10} fill="white" /> HOT</span>}
                </div>

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      style={{ background: 'hsla(215,28%,8%,0.9)', border: '1px solid hsla(271,91%,65%,0.3)', color: 'hsl(271,91%,75%)', backdropFilter: 'blur(8px)' }}>
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      style={{ background: 'hsla(215,28%,8%,0.9)', border: '1px solid hsla(271,91%,65%,0.3)', color: 'hsl(271,91%,75%)', backdropFilter: 'blur(8px)' }}>
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(cartItem)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 z-10"
                  style={{
                    background: wishlisted ? 'hsla(320,90%,62%,0.2)' : 'hsla(215,28%,10%,0.85)',
                    border: `1px solid ${wishlisted ? 'hsla(320,90%,62%,0.5)' : 'hsla(271,91%,65%,0.25)'}`,
                    backdropFilter: 'blur(8px)',
                  }}>
                  <Heart size={15} fill={wishlisted ? 'hsl(320,90%,62%)' : 'none'} color={wishlisted ? 'hsl(320,90%,62%)' : 'hsl(var(--muted-foreground))'} />
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1"
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s',
                  }}>
                  {images.map((img, i) => (
                    <button key={i} onClick={() => { setActiveImg(i); setImgLoaded(false); }}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${activeImg === i ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div
                className="grid grid-cols-3 gap-2"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(20px)',
                  transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.5s',
                }}
              >
                {[
                  { icon: <Shield size={15} />, label: '100% Genuine', sub: 'Verified', color: 'hsl(271,91%,65%)' },
                  { icon: <Truck size={15} />, label: 'Instant Delivery', sub: product.delivery_time || '5–30 min', color: 'hsl(185,90%,52%)' },
                  { icon: <Clock size={15} />, label: '24/7 Support', sub: 'Always Here', color: 'hsl(158,80%,48%)' },
                ].map(b => (
                  <div key={b.label} className="rounded-xl p-2.5 text-center border"
                    style={{ background: 'hsla(215,28%,10%,0.8)', borderColor: `${b.color}22` }}>
                    <div className="flex justify-center mb-1" style={{ color: b.color }}>{b.icon}</div>
                    <div className="text-[11px] font-bold text-foreground leading-tight">{b.label}</div>
                    <div className="text-[10px] text-muted-foreground">{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ RIGHT: Product Info ═══ */}
            <div className="flex flex-col gap-4">

              {/* Category + Share */}
              <div
                className="flex items-center justify-between"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(16px)',
                  transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.12s',
                }}
              >
                <span className="text-xs font-fira font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ color: 'hsl(185,90%,62%)', background: 'hsla(185,90%,52%,0.12)', border: '1px solid hsla(185,90%,52%,0.25)' }}>
                  {product.categories?.name || 'Digital Product'}
                </span>
                <div className="flex items-center gap-2">
                  {product.brand && (
                    <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-lg border border-border">{product.brand}</span>
                  )}
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                    style={{ color: copied ? 'hsl(158,80%,55%)' : 'hsl(var(--muted-foreground))', background: 'hsla(215,28%,14%,0.8)', border: '1px solid hsl(var(--border))' }}>
                    {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Share</>}
                  </button>
                </div>
              </div>

              {/* Title + Short Desc */}
              <div
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(20px)',
                  filter: entered ? 'none' : 'blur(2px)',
                  transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s',
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
                className="flex items-center gap-3"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(12px)',
                  transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.28s',
                }}
              >
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="hsl(38,100%,55%)" color="hsl(38,100%,55%)" />)}
                  <span className="text-sm font-semibold text-foreground ml-1.5">4.9</span>
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
                className="flex items-end gap-4 py-3 border-y"
                style={{
                  borderColor: 'hsla(271,91%,65%,0.18)',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'scale(0.92) translateX(-14px)',
                  transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.35s',
                }}
              >
                <span className="text-4xl font-sora font-black" style={{ color: 'hsl(271,91%,75%)', textShadow: '0 0 28px hsla(271,91%,65%,0.4)' }}>
                  ৳{displayPrice.toLocaleString()}
                </span>
                {product.original_price && product.original_price > displayPrice && (
                  <div>
                    <div className="text-base text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</div>
                    <div className="text-xs font-bold" style={{ color: 'hsl(40,100%,58%)' }}>
                      সাশ্রয় ৳{(product.original_price - displayPrice).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── VARIANTS (Duration / Plan / Region etc.) ─── */}
              {variants.length > 0 && (
                <div
                  className="space-y-4"
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(16px)',
                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.42s',
                  }}
                >
                  {variants.map((v: any) => {
                    const selectedOpt = selectedVar[v.name] || getOptionLabel(v.options?.[0]);
                    return (
                      <div key={v.name}>
                        <p className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-1.5">
                          <Tag size={12} style={{ color: 'hsl(185,90%,52%)' }} />
                          {v.name}:
                          <span style={{ color: 'hsl(271,91%,75%)' }}>{selectedOpt}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {v.options?.map((opt: string | VariantOption) => {
                            const label = getOptionLabel(opt);
                            const optPrice = getOptionPrice(opt);
                            const isSelected = selectedOpt === label;
                            return (
                              <button
                                key={label}
                                onClick={() => setSelectedVar(p => ({ ...p, [v.name]: label }))}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:scale-105 flex flex-col items-center gap-0.5 min-w-[80px]"
                                style={isSelected
                                  ? { borderColor: 'hsl(271,91%,65%)', color: 'hsl(271,91%,80%)', background: 'hsla(271,91%,65%,0.14)', boxShadow: '0 0 16px hsla(271,91%,65%,0.25)' }
                                  : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'hsla(215,28%,12%,0.5)' }
                                }
                              >
                                <span>{label}</span>
                                {optPrice != null && (
                                  <span className="text-[11px] font-bold" style={{ color: isSelected ? 'hsl(185,90%,62%)' : 'hsl(var(--muted-foreground))' }}>
                                    ৳{optPrice.toLocaleString()}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CTA Buttons */}
              <div
                className="space-y-3 pt-1"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(24px)',
                  transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.5s',
                }}
              >
                <button onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_hsla(271,91%,65%,0.5)] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))', boxShadow: '0 4px 24px hsla(271,91%,65%,0.35)' }}>
                  <CreditCard size={17} /> এখনই অর্ডার করুন — ৳{displayPrice.toLocaleString()}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={waOrder}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, hsl(142,70%,40%), hsl(158,80%,38%))', boxShadow: '0 4px 16px hsla(142,70%,40%,0.3)' }}>
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                  <button onClick={() => addToCart(cartItem)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:scale-[1.02]"
                    style={inCart
                      ? { borderColor: 'hsl(271,91%,65%)', color: 'hsl(271,91%,75%)', background: 'hsla(271,91%,65%,0.1)' }
                      : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }
                    }>
                    <ShoppingCart size={15} />
                    {inCart ? '✓ Cart-এ আছে' : 'Cart-এ যোগ করুন'}
                  </button>
                </div>
              </div>

              {/* Delivery info strip */}
              {product.delivery_time && (
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
                  style={{
                    background: 'hsla(158,80%,48%,0.07)',
                    border: '1px solid hsla(158,80%,48%,0.18)',
                    opacity: entered ? 1 : 0,
                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.58s',
                  }}
                >
                  <Clock size={14} style={{ color: 'hsl(158,80%,55%)' }} className="flex-shrink-0" />
                  <span className="text-sm text-foreground font-semibold">ডেলিভারি:</span>
                  <span className="text-sm text-muted-foreground">{product.delivery_time}</span>
                </div>
              )}

              {/* What You Get */}
              {product.what_you_get && product.what_you_get.length > 0 && (
                <div
                  className="rounded-2xl p-4 border"
                  style={{
                    background: 'hsla(215,28%,10%,0.7)',
                    borderColor: 'hsla(271,91%,65%,0.15)',
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(16px)',
                    transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.62s',
                  }}
                >
                  <h3 className="font-sora font-bold text-sm text-foreground flex items-center gap-2 mb-3">
                    <Package size={14} style={{ color: 'hsl(271,91%,65%)' }} /> আপনি যা পাবেন
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.what_you_get.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(158,80%,55%)' }} />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom: Description Accordions ── */}
          <div
            className="mt-10"
            ref={descReveal.ref}
            style={{
              opacity: descReveal.revealed ? 1 : 0,
              transform: descReveal.revealed ? 'none' : 'translateY(30px)',
              transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div className="space-y-3">

              {/* Product Description */}
              <AccordionBlock
                title="📋 Product Description"
                open={openDesc}
                onToggle={() => setOpenDesc(!openDesc)}
              >
                {product.description ? (
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                    {product.description.split('\n').map((line, i) =>
                      line.trim() ? <p key={i}>{line}</p> : null
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {[
                      { icon: '✅', text: '১০০% অরিজিনাল ও জেনুইন লাইসেন্স — সরাসরি অফিশিয়াল সোর্স থেকে' },
                      { icon: '⚡', text: 'তাৎক্ষণিক ডিজিটাল ডেলিভারি — পেমেন্টের ৫–৩০ মিনিটের মধ্যে' },
                      { icon: '🔒', text: 'নিরাপদ একটিভেশন — একবার কিনলে লম্বা মেয়াদে ব্যবহার করুন' },
                      { icon: '🛡️', text: 'বিক্রয়োত্তর সহায়তা — আমাদের টিম ২৪/৭ আপনার পাশে আছে' },
                      { icon: '💳', text: 'সহজ পেমেন্ট — bKash, Nagad, Rocket সহ আরও অপশন' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </AccordionBlock>

              {/* Warranty */}
              {product.warranty_note && (
                <AccordionBlock
                  title="🛡️ Warranty & Guarantee"
                  open={openWarranty}
                  onToggle={() => setOpenWarranty(!openWarranty)}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.warranty_note}</p>
                </AccordionBlock>
              )}

              {/* Refund Policy */}
              {product.refund_note && (
                <AccordionBlock
                  title="🔄 Refund Policy"
                  open={openRefund}
                  onToggle={() => setOpenRefund(!openRefund)}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.refund_note}</p>
                </AccordionBlock>
              )}

              {/* FAQ */}
              {faqs.length > 0 && (
                <AccordionBlock
                  title="❓ Frequently Asked Questions"
                  open={openFaq}
                  onToggle={() => setOpenFaq(!openFaq)}
                >
                  <div className="space-y-2" ref={faqReveal.ref}>
                    {faqs.map((f, i) => (
                      <FAQItem key={i} q={f.q} a={f.a} delay={i * 0.06} revealed={faqReveal.revealed} />
                    ))}
                  </div>
                </AccordionBlock>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showModal && (
        <QuickOrderModal
          product={{ id: product.id, name: product.name, price: displayPrice, originalPrice: product.original_price || undefined, image: product.image_url || PLACEHOLDER, category: product.categories?.name || '' }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// ── Reusable accordion block ──
const AccordionBlock = ({
  title, open, onToggle, children
}: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) => (
  <div
    className="rounded-2xl overflow-hidden border transition-all duration-300"
    style={{
      background: 'hsla(215,28%,10%,0.7)',
      borderColor: open ? 'hsla(271,91%,65%,0.28)' : 'hsla(271,91%,65%,0.1)',
      boxShadow: open ? '0 0 20px hsla(271,91%,65%,0.06)' : 'none',
    }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-foreground text-left gap-3"
    >
      <span>{title}</span>
      <ChevronDown
        size={16}
        className="flex-shrink-0 transition-transform duration-300"
        style={{ color: 'hsl(271,91%,65%)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </button>
    <div
      className="overflow-hidden transition-all duration-400"
      style={{ maxHeight: open ? '800px' : '0', opacity: open ? 1 : 0 }}
    >
      <div className="px-5 pb-5 border-t" style={{ borderColor: 'hsla(271,91%,65%,0.1)', paddingTop: '14px' }}>
        {children}
      </div>
    </div>
  </div>
);

// ── FAQ item ──
const FAQItem = ({ q, a, delay = 0, revealed = true }: { q: string; a: string; delay?: number; revealed?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden border transition-all"
      style={{
        background: 'hsla(215,28%,13%,0.6)',
        borderColor: open ? 'hsla(271,91%,65%,0.25)' : 'hsla(271,91%,65%,0.08)',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'none' : 'translateY(12px)',
        transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, border-color 0.3s`,
      }}
    >
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground text-left gap-3">
        <span>{q}</span>
        <ChevronDown size={14} className="flex-shrink-0 transition-transform duration-300"
          style={{ color: 'hsl(271,91%,65%)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}>
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t"
          style={{ borderColor: 'hsla(271,91%,65%,0.08)', paddingTop: '10px' }}>
          {a}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
