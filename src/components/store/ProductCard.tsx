import { useState, useRef, useEffect } from 'react';
import { Heart, ShoppingCart, MessageCircle, CreditCard, Zap, Star } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import QuickOrderModal from './QuickOrderModal';

interface ProductCardProps {
  product: Product;
  delay?: number;
}

const WA = '8801840099853';

const ProductCard = ({ product, delay = 0 }: ProductCardProps) => {
  const [visible,        setVisible]        = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [imageLoaded,    setImageLoaded]    = useState(false);
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

  const waMessage = () => {
    const msg = encodeURIComponent(`অর্ডার করতে চাই:\n📦 ${product.name}\n💰 ৳${product.price.toLocaleString()}`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  return (
    <>
      <div
        ref={ref}
        className="group relative rounded-lg overflow-hidden product-hover-line flex flex-col"
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid hsl(var(--border))',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(32px)',
          transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s, border-color 0.25s, box-shadow 0.25s`,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'var(--gold)';
          el.style.boxShadow = '0 0 0 1px var(--gold), 0 16px 40px hsla(38,90%,52%,0.12)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'hsl(var(--border))';
          el.style.boxShadow = 'none';
        }}
      >
        {/* Image wrapper */}
        <div className="relative overflow-hidden aspect-square"
          style={{ backgroundColor: 'var(--surface-2)' }}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/111/D97706?text=Product'; }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
          )}

          {/* Badges top-left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {product.discount && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--crimson)', color: '#fff' }}>
                -{product.discount}%
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-0.5 text-[9px] font-black px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--gold)', color: 'hsl(0,0%,5%)' }}>
                <Zap size={8} fill="currentColor" /> HOT
              </span>
            )}
            {product.isNew && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded"
                style={{ backgroundColor: 'hsla(142,70%,40%,0.9)', color: '#fff' }}>
                NEW
              </span>
            )}
          </div>

          {/* Wishlist top-right */}
          <button
            onClick={e => { e.stopPropagation(); toggleWishlist({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image }); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            style={{
              backgroundColor: wishlisted ? 'hsla(358,72%,52%,0.9)' : 'hsla(0,0%,5%,0.75)',
              backdropFilter: 'blur(8px)',
              color: wishlisted ? '#fff' : 'hsl(var(--muted-foreground))',
            }}
          >
            <Heart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}>
              {product.category}
            </p>
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-[var(--gold)] transition-colors duration-200"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {product.name}
            </h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={10} fill={s <= Math.floor(product.rating) ? 'currentColor' : 'none'}
                style={{ color: s <= Math.floor(product.rating) ? '#FBBF24' : 'hsl(var(--border))' }} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--gold)' }}>
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs line-through text-muted-foreground">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setShowModal(true)}
              className="btn-gold w-full flex items-center justify-center gap-1.5 py-2.5 rounded text-xs">
              <CreditCard size={12} /> এখনই অর্ডার করুন
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={waMessage}
                className="flex items-center justify-center gap-1 py-2 rounded text-[11px] font-semibold transition-all"
                style={{
                  backgroundColor: 'hsla(142,60%,40%,0.1)',
                  border: '1px solid hsla(142,60%,40%,0.2)',
                  color: 'hsl(142,60%,50%)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'hsla(142,60%,40%,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'hsla(142,60%,40%,0.1)'; }}
              >
                <MessageCircle size={11} /> WhatsApp
              </button>
              <button
                onClick={() => addToCart({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image })}
                className="flex items-center justify-center gap-1 py-2 rounded text-[11px] font-semibold transition-all"
                style={{
                  backgroundColor: inCart ? 'hsla(38,90%,52%,0.12)' : 'var(--surface-2)',
                  border: `1px solid ${inCart ? 'hsla(38,90%,52%,0.4)' : 'hsl(var(--border))'}`,
                  color: inCart ? 'var(--gold)' : 'hsl(var(--muted-foreground))',
                }}
              >
                <ShoppingCart size={11} />
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
