import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, ShoppingCart, MessageCircle, CreditCard, Zap, Star, X, Clock, CheckCircle } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import QuickOrderModal from './QuickOrderModal';
import { useNavigate } from 'react-router-dom';
import { prefetchRoute } from '@/hooks/usePrefetchRoute';

interface ProductCardProps {
  product: Product;
  delay?: number;
  priority?: boolean; // true for first ~4 cards (above fold)
}

const WA = '8801840099853';

// Ripple particle type
type Particle = { id: number; x: number; y: number };

const ProductCard = ({ product, delay = 0, priority = false }: ProductCardProps) => {
  const [visible,     setVisible]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered,   setIsHovered]   = useState(false);
  const [clicked,     setClicked]     = useState(false);
  const [orbitActive, setOrbitActive] = useState(false);
  const [particles,   setParticles]   = useState<Particle[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const { addToCart, isInCart }         = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();

  // Intersection observer for staggered entry — disabled on mobile to prevent scroll jank
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  useEffect(() => {
    if (isMobile) { setVisible(true); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [isMobile]);

  const wishlisted = isWishlisted(String(product.id));
  const inCart     = isInCart(product.id);

  // Detect if product image is missing / invalid → use branded auto-fallback
  const hasValidImage = !!product.image && typeof product.image === 'string' && product.image.trim().length > 0 && product.image !== 'null' && product.image !== 'undefined';

  // Deterministic gradient picker per product so each fallback feels unique
  const gradientPalettes = [
    { from: 'hsl(258, 85%, 70%)', to:   'hsl(195, 90%, 65%)', accent: 'hsl(320, 90%, 72%)' },
    { from: 'hsl(195, 90%, 65%)', to:   'hsl(160, 80%, 60%)', accent: 'hsl(258, 85%, 72%)' },
    { from: 'hsl(320, 88%, 68%)', to:   'hsl(258, 85%, 70%)', accent: 'hsl(40, 100%, 65%)' },
    { from: 'hsl(40, 100%, 65%)', to:   'hsl(20, 95%, 62%)',  accent: 'hsl(320, 88%, 68%)' },
    { from: 'hsl(160, 80%, 55%)', to:   'hsl(195, 90%, 60%)', accent: 'hsl(258, 85%, 70%)' },
    { from: 'hsl(280, 85%, 70%)', to:   'hsl(330, 90%, 70%)', accent: 'hsl(195, 90%, 65%)' },
  ];
  const seed = String(product.id || product.name || '0').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = gradientPalettes[seed % gradientPalettes.length];
  const initials = product.name
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || 'SS';

  const waMsg = () => {
    const msg = encodeURIComponent(`অর্ডার করতে চাই:\n📦 ${product.name}\n💰 ৳${product.price.toLocaleString()}`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  // Click ripple + burst + orbit animation
  const handleCardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spawn burst particles
    const newParticles: Particle[] = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
    }));
    setParticles(p => [...p, ...newParticles]);
    setTimeout(() => setParticles(p => p.filter(pt => !newParticles.find(n => n.id === pt.id))), 700);

    // Card squeeze flash
    setClicked(true);
    setTimeout(() => setClicked(false), 180);

    // Rotating orbit beam
    setOrbitActive(true);
    setTimeout(() => setOrbitActive(false), 1100);

    navigate(`/product/${product.slug || product.id}`);
  }, [navigate, product.slug, product.id]);

  return (
    <>
      {/* ── Quick Preview Modal ── */}
      {showPreview && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: 'hsla(215,28%,4%,0.85)', backdropFilter: 'blur(20px)' }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="quick-preview-enter relative rounded-3xl overflow-hidden max-w-lg w-full border"
            style={{
              background: 'hsl(215,28%,10%)',
              borderColor: 'hsla(271,91%,65%,0.35)',
              boxShadow: '0 0 60px hsla(271,91%,65%,0.25), 0 32px 80px hsla(215,40%,4%,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Neon top border */}
            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />

            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'hsla(271,91%,65%,0.15)', border: '1px solid hsla(271,91%,65%,0.3)', color: 'hsl(271,91%,75%)' }}
            >
              <X size={16} />
            </button>

            <div className="flex gap-0">
              {/* Image */}
              <div className="w-48 flex-shrink-0 relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '280px' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/13131f/a855f7?text=Product'; }}
                />
                {/* Scan line animation */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute left-0 right-0 h-[2px] anim-scan"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(271,91%,65%), transparent)', opacity: 0.7 }} />
                </div>
                {product.discount && (
                  <div className="absolute top-3 left-3 badge-sale text-[11px] px-2.5 py-1">-{product.discount}%</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-6 flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-fira font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ color: 'hsl(185,90%,62%)', background: 'hsla(185,90%,52%,0.12)', border: '1px solid hsla(185,90%,52%,0.2)' }}>
                      {product.category}
                    </span>
                  </div>
                  <h3 className="font-sora font-black text-[17px] leading-snug text-foreground">{product.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={11} fill={s <= Math.floor(product.rating) ? 'hsl(40,100%,58%)' : 'none'} color={s <= Math.floor(product.rating) ? 'hsl(40,100%,58%)' : 'hsl(var(--border))'} />
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-1">({product.reviews})</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-sora font-black text-2xl" style={{ color: 'hsl(271,91%,75%)' }}>৳{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="text-sm line-through text-muted-foreground">৳{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { icon: <Zap size={10} />, text: 'Instant Delivery' },
                    { icon: <CheckCircle size={10} />, text: 'Genuine' },
                    { icon: <Clock size={10} />, text: '24/7 Support' },
                  ].map(f => (
                    <span key={f.text} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'hsla(271,91%,65%,0.1)', border: '1px solid hsla(271,91%,65%,0.2)', color: 'hsl(271,91%,75%)' }}>
                      {f.icon} {f.text}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-2">
                  <button
                    onClick={() => { setShowPreview(false); setShowModal(true); }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))', boxShadow: '0 0 20px hsla(271,91%,65%,0.4)' }}>
                    <CreditCard size={13} className="inline mr-1.5" /> Buy Now
                  </button>
                  <button
                    onClick={() => { setShowPreview(false); navigate(`/product/${product.slug || product.id}`); }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5"
                    style={{ background: 'hsla(271,91%,65%,0.08)', border: '1px solid hsla(271,91%,65%,0.2)', color: 'hsl(271,91%,75%)' }}>
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Card ── */}
      <div
        ref={ref}
        className="group product-card-new flex flex-col cursor-pointer relative"
        onClick={handleCardClick}
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible
            ? clicked
              ? 'translateY(-3px) scale(0.97)'
              : (!isMobile && isHovered) ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)'
            : isMobile ? 'none' : 'translateY(40px)',
          transition: clicked
            ? 'transform 0.1s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.1s ease'
            : (!isMobile && isHovered)
            ? `opacity 0.1s, transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s ease`
            : isMobile
            ? `opacity 0.3s ease ${delay}s, box-shadow 0.3s ease`
            : `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s, box-shadow 0.4s ease`,
          boxShadow: clicked
            ? '0 4px 30px hsla(271,91%,65%,0.25), 0 0 0 2px hsla(185,90%,52%,0.4)'
            : isHovered
            ? '0 8px 32px hsla(271,91%,65%,0.15), 0 0 0 1px hsla(271,91%,65%,0.25)'
            : '0 2px 16px hsla(258,78%,55%,0.08), 0 0 0 1px hsla(258,78%,55%,0.1)',
          borderRadius: 'var(--radius)',
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          // Instant navigation: prefetch detail page chunk on hover
          prefetchRoute(`/product/${product.slug || product.id}`);
        }}
        onTouchStart={() => prefetchRoute(`/product/${product.slug || product.id}`)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ── Rotating orbit light beam on click ── */}
        {orbitActive && (
          <span className="pointer-events-none absolute inset-0 z-[60] rounded-[inherit] overflow-hidden">
            {/* Conic-gradient beam that spins around */}
            <span
              className="absolute"
              style={{
                inset: '-2px',
                borderRadius: 'inherit',
                background: 'conic-gradient(from 0deg, transparent 0deg, hsl(271,91%,75%) 30deg, hsl(185,90%,62%) 60deg, hsl(320,90%,72%) 90deg, transparent 120deg, transparent 360deg)',
                animation: 'orbit-spin 1.1s cubic-bezier(0.22,1,0.36,1) forwards',
              }}
            />
            {/* Inner mask to show only the border */}
            <span
              className="absolute rounded-[inherit]"
              style={{
                inset: '2px',
                background: 'hsl(215,28%,11%)',
              }}
            />
            {/* Glow overlay */}
            <span
              className="absolute inset-0 rounded-[inherit]"
              style={{
                boxShadow: 'inset 0 0 0 2px hsla(271,91%,65%,0.8), 0 0 20px hsla(271,91%,65%,0.6), 0 0 50px hsla(185,90%,52%,0.3)',
                animation: 'orbit-glow 1.1s ease-out forwards',
              }}
            />
          </span>
        )}

        {/* ── Ripple burst particles ── */}
        {particles.map(pt => (
          <span
            key={pt.id}
            className="pointer-events-none absolute z-[100]"
            style={{ left: pt.x, top: pt.y }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * 360;
              const dist = 38 + Math.random() * 28;
              const dx = Math.cos((angle * Math.PI) / 180) * dist;
              const dy = Math.sin((angle * Math.PI) / 180) * dist;
              const size = 4 + Math.random() * 5;
              const colors = ['hsl(271,91%,75%)', 'hsl(185,90%,62%)', 'hsl(320,90%,72%)', 'hsl(40,100%,65%)'];
              const color = colors[i % colors.length];
              return (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    transform: 'translate(-50%, -50%)',
                    animation: `card-burst 0.6s ease-out forwards`,
                    animationDelay: `${i * 0.02}s`,
                    '--dx': `${dx}px`,
                    '--dy': `${dy}px`,
                  } as React.CSSProperties}
                />
              );
            })}
          </span>
        ))}

        {/* Click ripple wave */}
        {clicked && (
          <span
            className="pointer-events-none absolute inset-0 z-50 rounded-[inherit]"
            style={{
              background: 'radial-gradient(circle at center, hsla(185,90%,52%,0.18) 0%, transparent 70%)',
              animation: 'card-ripple-wave 0.35s ease-out forwards',
            }}
          />
        )}

        {/* ── Image ── */}
        <div className="card-image-wrap relative overflow-hidden aspect-square bg-muted">
          {/* Scan line on hover */}
          <div className="card-scan-line" />

          {/* Shimmer placeholder — always visible until image loads */}
          {!imageLoaded && <div className="absolute inset-0 shimmer" />}

          <img
            src={product.image}
            alt={`${product.name} - Buy at ৳${product.price.toLocaleString()} in Bangladesh`}
            title={`${product.name} - Shahed Store Bangladesh`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'low'}
            onLoad={() => setImageLoaded(true)}
            onError={e => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/f5f3ff/7c3aed?text=Product';
              setImageLoaded(true);
            }}
            className="w-full h-full object-cover"
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
              position: 'relative',
              zIndex: 1,
            }}
          />


          {/* Light shimmer overlay on hover — replaces dark shadow */}
          <div className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)' }} />
          {/* Bottom light glow — soft upward light */}
          <div className="absolute bottom-0 left-0 right-0 h-24 transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{ background: 'linear-gradient(to top, hsla(271,91%,75%,0.18) 0%, hsla(185,90%,62%,0.08) 50%, transparent 100%)' }} />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {product.discount && (
              <span className="badge-sale">-{product.discount}%</span>
            )}
            {product.isBestseller && (
              <span className="badge-hot-item flex items-center gap-0.5"><Zap size={8} fill="white" /> HOT</span>
            )}
            {product.isNew && <span className="badge-new-item">NEW</span>}
          </div>

          {/* Wishlist btn */}
          <button
            onClick={e => {
              e.stopPropagation();
              toggleWishlist({ id: String(product.id), name: product.name, price: product.price, image: product.image });
            }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.8)',
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              background: wishlisted ? 'hsla(320,90%,62%,0.2)' : 'hsla(215,28%,14%,0.9)',
              border: `1px solid ${wishlisted ? 'hsla(320,90%,62%,0.5)' : 'hsla(271,91%,65%,0.2)'}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Heart size={13} fill={wishlisted ? 'hsl(320,90%,62%)' : 'none'} color={wishlisted ? 'hsl(320,90%,62%)' : 'hsl(var(--muted-foreground))'} />
          </button>

          {/* Bottom hover label */}
          <div className="absolute bottom-2.5 left-2.5 z-10 transition-all duration-300"
            style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(6px)' }}>
            <span className="text-[10px] font-fira font-bold px-2 py-1 rounded-lg"
              style={{ background: 'hsla(215,28%,8%,0.9)', color: 'hsl(185,90%,62%)', border: '1px solid hsla(185,90%,52%,0.3)', backdropFilter: 'blur(8px)' }}>
              ⚡ Instant Delivery
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4 flex flex-col gap-2.5 flex-1 relative z-10">
          <h3
            className="text-sm font-semibold leading-snug line-clamp-2 text-foreground transition-colors duration-200"
            onMouseEnter={e => (e.currentTarget.style.color = 'hsl(271,91%,75%)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}
          >
            {product.name}
          </h3>

          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={10}
                fill={s <= Math.floor(product.rating) ? 'hsl(40,100%,58%)' : 'none'}
                color={s <= Math.floor(product.rating) ? 'hsl(40,100%,58%)' : 'hsl(var(--border))'}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">({product.reviews})</span>
          </div>

          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-xl font-sora font-black" style={{ color: 'hsl(271,91%,75%)' }}>
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs line-through text-muted-foreground">৳{product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={e => { e.stopPropagation(); setShowModal(true); }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))',
                boxShadow: '0 4px 16px hsla(271,91%,65%,0.35)',
              }}>
              <CreditCard size={12} /> Buy Now
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={e => { e.stopPropagation(); waMsg(); }}
                className="flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: 'hsla(158,80%,48%,0.1)',
                  border: '1px solid hsla(158,80%,48%,0.25)',
                  color: 'hsl(158,80%,58%)',
                }}>
                <MessageCircle size={11} /> WhatsApp
              </button>
              <button
                onClick={e => { e.stopPropagation(); addToCart({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image }); }}
                className="flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all hover:scale-[1.02]"
                style={inCart
                  ? { background: 'hsla(271,91%,65%,0.15)', border: '1px solid hsla(271,91%,65%,0.4)', color: 'hsl(271,91%,75%)' }
                  : { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
                }>
                <ShoppingCart size={11} />
                {inCart ? '✓ Added' : 'Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <QuickOrderModal
          product={{ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: product.image, category: product.category, customFields: product.customFields }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
