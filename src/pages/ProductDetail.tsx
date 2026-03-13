import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  ShoppingCart, MessageCircle, CreditCard, Star, Zap, Shield, Clock,
  CheckCircle2, ChevronLeft, ChevronRight, Heart, Package, Tag,
  Truck, ArrowLeft, Share2, Copy, Check
} from 'lucide-react';
import QuickOrderModal from '@/components/store/QuickOrderModal';

const WA = '8801840099853';
const PLACEHOLDER = 'https://placehold.co/600x600/f8f9ff/6366f1?text=Product';

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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, category:category_id(name, slug)')
          .eq('slug', slug)
          .eq('status', 'active')
          .limit(1);
        if (cancelled) return;
        if (error) { console.error('Product fetch error:', error); setNotFound(true); setLoading(false); return; }
        const row = data?.[0];
        if (!row) { setNotFound(true); setLoading(false); return; }
        setProduct(row as any);
        setLoading(false);
        // Increment view count (fire and forget)
        supabase.from('products').update({ total_views: (row.total_views || 0) + 1 }).eq('id', row.id).then(() => {});
      } catch (e) {
        console.error('Product load exception:', e);
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
          <div className="aspect-square rounded-3xl shimmer" />
          <div className="space-y-4">
            {[80, 50, 30, 60, 40, 60, 40].map((w, i) => (
              <div key={i} className="rounded-xl shimmer h-6" style={{ width: `${w}%` }} />
            ))}
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
        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
          <ArrowLeft size={16} /> Back to Store
        </button>
      </div>
    </div>
  );

  // Build image list
  const images = [
    product.image_url || PLACEHOLDER,
    ...(product.images || []).filter(img => img !== product.image_url),
  ].filter(Boolean);
  if (images.length === 0) images.push(PLACEHOLDER);

  // Variants
  const variants: { name: string; options: string[] }[] = Array.isArray(product.variants) ? product.variants : [];

  // FAQ
  const faqs: { q: string; a: string }[] = Array.isArray(product.faq) ? product.faq : [];

  const wishlisted = isWishlisted(product.id);
  const inCart     = isInCart(product.id);
  const savings    = product.original_price ? product.original_price - product.price : 0;

  const cartItem = {
    id: product.id,
    name: product.name,
    category: product.categories?.name || '',
    price: product.price,
    originalPrice: product.original_price || undefined,
    image: product.image_url || PLACEHOLDER,
  };

  const waOrder = () => {
    const varStr = Object.entries(selectedVar).map(([k, v]) => `${k}: ${v}`).join(', ');
    const msg = encodeURIComponent(
      `অর্ডার করতে চাই:\n📦 ${product.name}${varStr ? `\n⚙️ ${varStr}` : ''}\n💰 ৳${product.price.toLocaleString()}\n🔗 ${window.location.href}`
    );
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg(i => (i + 1) % images.length);

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate('/')} className="hover:text-brand-indigo transition-colors">Home</button>
            <span>/</span>
            {product.categories && (
              <>
                <button onClick={() => navigate(`/?cat=${product.categories!.slug}`)} className="hover:text-brand-indigo transition-colors capitalize">
                  {product.categories.name}
                </button>
                <span>/</span>
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">

            {/* ── LEFT: Image Gallery ── */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden bg-surface-light border border-border aspect-square group">
                {!imgLoaded && <div className="absolute inset-0 shimmer" />}
                <img
                  key={images[activeImg]}
                  src={images[activeImg]}
                  alt={product.name}
                  onLoad={() => setImgLoaded(true)}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  className="w-full h-full object-cover transition-all duration-500"
                  style={{ opacity: imgLoaded ? 1 : 0 }}
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.discount_percent && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))' }}>
                      -{product.discount_percent}% OFF
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
                      style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                      <Zap size={10} fill="white" /> HOT
                    </span>
                  )}
                </div>
                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-card/90 shadow-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-card text-foreground">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-card/90 shadow-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-card text-foreground">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(cartItem)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-card shadow-medium flex items-center justify-center transition-all hover:scale-110">
                  <Heart size={16} fill={wishlisted ? 'hsl(15,100%,60%)' : 'none'} color={wishlisted ? 'hsl(15,100%,60%)' : 'hsl(var(--muted-foreground))'} />
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => { setActiveImg(i); setImgLoaded(false); }}
                      className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-brand-indigo shadow-indigo' : 'border-border hover:border-brand-indigo/50'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Shield size={16} />, label: '100% Genuine', sub: 'Verified Product' },
                  { icon: <Truck size={16} />, label: 'Instant Delivery', sub: product.delivery_time || '5–30 min' },
                  { icon: <Clock size={16} />, label: '24/7 Support', sub: 'Always Available' },
                ].map(b => (
                  <div key={b.label} className="bg-surface-light border border-border rounded-2xl p-3 text-center">
                    <div className="flex justify-center text-brand-indigo mb-1">{b.icon}</div>
                    <div className="text-xs font-bold text-foreground">{b.label}</div>
                    <div className="text-[10px] text-muted-foreground">{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Info ── */}
            <div className="flex flex-col gap-6">
              {/* Category + Share */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-fira font-bold uppercase tracking-widest text-brand-indigo bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                  {product.categories?.name || 'Digital Product'}
                </span>
                <div className="flex gap-2">
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-brand-indigo px-3 py-1.5 rounded-xl bg-surface-light border border-border transition-all">
                    {copied ? <><Check size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Share</>}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="font-sora font-black text-2xl sm:text-3xl text-foreground leading-tight">{product.name}</h1>
                {product.short_description && (
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{product.short_description}</p>
                )}
              </div>

              {/* Rating + Sales */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} fill={s <= 5 ? 'hsl(38,100%,55%)' : 'none'} color="hsl(38,100%,55%)" />
                  ))}
                  <span className="text-sm font-semibold text-foreground ml-1">4.9</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-sm text-muted-foreground">{(product.total_sales || 0) + 50}+ sold</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> In Stock
                </span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-4 py-4 border-y border-border">
                <span className="text-4xl font-sora font-black text-brand-indigo">৳{product.price.toLocaleString()}</span>
                {product.original_price && (
                  <div>
                    <div className="text-lg text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</div>
                    <div className="text-sm font-bold text-orange-600">You save ৳{savings.toLocaleString()}</div>
                  </div>
                )}
              </div>

              {/* Variants */}
              {variants.map((v: any) => (
                <div key={v.name}>
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Tag size={12} className="text-brand-indigo" /> {v.name}:
                    <span className="text-brand-indigo">{selectedVar[v.name] || v.options?.[0]}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {v.options?.map((opt: string) => (
                      <button key={opt}
                        onClick={() => setSelectedVar(p => ({ ...p, [v.name]: opt }))}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          (selectedVar[v.name] || v.options?.[0]) === opt
                            ? 'border-brand-indigo text-brand-indigo bg-indigo-50'
                            : 'border-border text-muted-foreground hover:border-brand-indigo/40'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white hover:scale-[1.02] transition-transform shadow-indigo"
                  style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                  <CreditCard size={18} /> Order Now — ৳{product.price.toLocaleString()}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={waOrder}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white transition-all hover:scale-[1.02] shadow-sm">
                    <MessageCircle size={16} /> WhatsApp Order
                  </button>
                  <button onClick={() => addToCart(cartItem)}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:scale-[1.02] ${
                      inCart
                        ? 'bg-indigo-50 border-brand-indigo text-brand-indigo'
                        : 'bg-card border-border text-foreground hover:border-brand-indigo/50'
                    }`}>
                    <ShoppingCart size={16} />
                    {inCart ? '✓ In Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>

              {/* Delivery Time */}
              {product.delivery_time && (
                <div className="flex items-center gap-3 bg-emerald/10 border border-emerald/20 rounded-2xl px-4 py-3">
                  <Clock size={18} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-foreground">Delivery Time</div>
                    <div className="text-xs text-muted-foreground">{product.delivery_time}</div>
                  </div>
                </div>
              )}

              {/* What You Get */}
              {product.what_you_get && product.what_you_get.length > 0 && (
                <div className="bg-surface-light border border-border rounded-2xl p-5">
                  <h3 className="font-sora font-bold text-base text-foreground flex items-center gap-2 mb-4">
                    <Package size={16} className="text-brand-indigo" /> What You'll Get
                  </h3>
                  <ul className="space-y-2.5">
                    {product.what_you_get.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                        <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
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

            {/* Description */}
            {product.description && (
              <div className="lg:col-span-2">
                <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
                  <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(243,75%,59%), hsl(263,70%,58%))' }} />
                  Product Description
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed bg-surface-light border border-border rounded-2xl p-6">
                  {product.description.split('\n').map((line, i) =>
                    line.trim() ? <p key={i} className="mb-3 last:mb-0">{line}</p> : null
                  )}
                </div>
              </div>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className={product.description ? '' : 'lg:col-span-3'}>
                <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
                  <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(243,75%,59%), hsl(263,70%,58%))' }} />
                  FAQ
                </h2>
                <div className="space-y-3">
                  {faqs.map((f, i) => (
                    <FAQItem key={i} q={f.q} a={f.a} />
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
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-surface-light border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground text-left">
        {q}
        <ChevronRight size={14} className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {a}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
