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
        <div className="relative overflow-hidden aspect-square bg-surface-light">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/f8f9ff/6366f1?text=Product'; }}
            className="w-full h-full object-cover"
            style={{
              opacity: imageLoaded ? 1 : 0,
              transform: hovered ? 'scale(1.07)' : 'scale(1)',
              transition: 'opacity 0.3s, transform 0.6s cubic-bezier(0.23,1,0.32,1)',
            }}
          />
          {!imageLoaded && <div className="absolute inset-0 shimmer" />}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {product.discount && <span className="badge-sale">-{product.discount}%</span>}
            {product.isBestseller && <span className="badge-hot-item flex items-center gap-0.5"><Zap size={8} fill="white" /> HOT</span>}
            {product.isNew && <span className="badge-new-item">NEW</span>}
          </div>

          {/* Wishlist */}
          <button
            onClick={e => { e.stopPropagation(); toggleWishlist({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image }); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10 bg-white shadow-soft border border-border"
            style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(-4px)', transition: 'all 0.25s' }}
          >
            <Heart size={13} fill={wishlisted ? 'hsl(15,100%,60%)' : 'none'} color={wishlisted ? 'hsl(15,100%,60%)' : 'hsl(var(--muted-foreground))'} />
          </button>

          {/* Quick view */}
          <button
            onClick={() => setShowModal(true)}
            className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10 bg-white shadow-soft border border-border text-brand-indigo"
            style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(4px)', transition: 'all 0.25s 0.05s' }}
          >
            <Eye size={13} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-4 flex flex-col gap-2.5 flex-1 bg-white">
          <p className="text-[10px] font-fira font-bold uppercase tracking-widest text-brand-indigo">{product.category}</p>

          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-brand-indigo transition-colors duration-200">
            {product.name}
          </h3>

          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={10} fill={s <= Math.floor(product.rating) ? 'hsl(38,100%,55%)' : 'none'} color={s <= Math.floor(product.rating) ? 'hsl(38,100%,55%)' : 'hsl(var(--border))'} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">({product.reviews})</span>
          </div>

          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-xl font-sora font-black text-brand-indigo">৳{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-xs line-through text-muted-foreground">৳{product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          <div className="space-y-2">
            <button onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all hover:scale-[1.02] shadow-indigo"
              style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
              <CreditCard size={12} /> Order Now
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={waMsg}
                className="flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors">
                <MessageCircle size={11} /> WhatsApp
              </button>
              <button onClick={() => addToCart({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image })}
                className={`flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-colors ${inCart ? 'bg-indigo-50 border border-indigo-200 text-brand-indigo' : 'bg-muted border border-border text-muted-foreground hover:bg-surface-soft'}`}>
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
