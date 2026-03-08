import { useState, useRef, useEffect } from 'react';
import { Heart, ShoppingCart, MessageCircle, CreditCard, Zap, Star, Eye } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import QuickOrderModal from './QuickOrderModal';

interface ProductCardProps {
  product: Product;
  delay?: number;
}

const WA = '8801840099853';

const ProductCard = ({ product, delay = 0 }: ProductCardProps) => {
  const [visible,     setVisible]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered,     setHovered]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const wishlisted = isWishlisted(product.id);
  const inCart     = isInCart(product.id);

  const waMsg = () => {
    const msg = encodeURIComponent(`অর্ডার করতে চাই:\n📦 ${product.name}\n💰 ৳${product.price.toLocaleString()}`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  return (
    <>
      <div
        ref={ref}
        className="group product-card rounded-xl overflow-hidden flex flex-col"
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(40px)',
          transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Image ── */}
        <div className="relative overflow-hidden aspect-square"
          style={{ background: 'hsl(220,15%,10%)' }}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0d1117/00d4ff?text=Product'; }}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{
              opacity:   imageLoaded ? 1 : 0,
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'opacity 0.3s, transform 0.7s cubic-bezier(0.23,1,0.32,1)',
            }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse" style={{ background: 'hsl(220,15%,12%)' }} />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to top, hsl(220,18%,7%) 0%, transparent 50%)',
              opacity: hovered ? 0.6 : 0.3,
            }} />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {product.discount && (
              <span className="badge-hot px-1.5 py-0.5">-{product.discount}%</span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-0.5 text-[9px] font-black px-2 py-0.5 rounded"
                style={{ background: 'var(--cyan)', color: 'hsl(220,20%,4%)', fontFamily: 'JetBrains Mono, monospace' }}>
                <Zap size={7} fill="currentColor" /> HOT
              </span>
            )}
            {product.isNew && (
              <span className="badge-new px-1.5 py-0.5">NEW</span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={e => {
              e.stopPropagation();
              toggleWishlist({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image });
            }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-10"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(-4px)',
              transition: 'all 0.25s',
              background: wishlisted ? 'hsla(320,90%,60%,0.9)' : 'hsla(220,20%,4%,0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${wishlisted ? 'hsl(320,90%,60%)' : 'hsl(var(--border))'}`,
              color: wishlisted ? '#fff' : 'hsl(var(--muted-foreground))',
            }}
          >
            <Heart size={12} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick view */}
          <button
            onClick={() => setShowModal(true)}
            className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-10"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'all 0.25s 0.05s',
              background: 'hsla(185,100%,50%,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--cyan-border)',
              color: 'var(--cyan)',
            }}
          >
            <Eye size={12} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-4 flex flex-col gap-3 flex-1"
          style={{ background: 'hsl(220,18%,7%)' }}>
          {/* Category */}
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
            {product.category}
          </p>

          {/* Name */}
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-200"
            style={{ color: hovered ? 'var(--cyan)' : 'hsl(var(--foreground))', fontFamily: 'Inter, sans-serif' }}>
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={9}
                fill={s <= Math.floor(product.rating) ? 'currentColor' : 'none'}
                style={{ color: s <= Math.floor(product.rating) ? 'hsl(48,100%,55%)' : 'hsl(var(--border))' }} />
            ))}
            <span className="text-[9px] ml-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'JetBrains Mono, monospace' }}>
              ({product.reviews})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-xl font-black gradient-text-cyber" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs line-through" style={{ color: 'hsl(var(--muted-foreground))' }}>
                ৳{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setShowModal(true)}
              className="btn-cyber w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px]">
              <CreditCard size={11} /> অর্ডার করুন
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={waMsg}
                className="flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: 'hsla(120,60%,40%,0.1)',
                  border: '1px solid hsla(120,60%,40%,0.3)',
                  color: 'hsl(120,60%,55%)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsla(120,60%,40%,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'hsla(120,60%,40%,0.1)')}
              >
                <MessageCircle size={10} /> WA
              </button>
              <button
                onClick={() => addToCart({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image })}
                className="flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: inCart ? 'hsla(185,100%,50%,0.15)' : 'hsl(220,15%,12%)',
                  border: `1px solid ${inCart ? 'var(--cyan-border)' : 'hsl(var(--border))'}`,
                  color: inCart ? 'var(--cyan)' : 'hsl(var(--muted-foreground))',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <ShoppingCart size={10} />
                {inCart ? '✓ Added' : 'Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <QuickOrderModal
          product={{ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: product.image, category: product.category }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
