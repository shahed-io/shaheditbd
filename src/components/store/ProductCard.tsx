import { useState, useRef, useEffect } from 'react';
import { Star, Heart, ShoppingCart, MessageCircle, CreditCard } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import QuickOrderModal from './QuickOrderModal';

interface ProductCardProps {
  product: Product;
  delay?: number;
}

const WHATSAPP_NUMBER = '8801840099853'; // configurable

const ProductCard = ({ product, delay = 0 }: ProductCardProps) => {
  const [visible, setVisible] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const wishlisted = isWishlisted(product.id);
  const inCart = isInCart(product.id);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `আমি এই প্রোডাক্টটি অর্ডার করতে চাই:\n\n📦 ${product.name}\n💰 মূল্য: ৳${product.price.toLocaleString()}\n\nঅনুগ্রহ করে আমাকে সাহায্য করুন।`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
    });
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
    });
  };

  return (
    <>
      <div
        ref={ref}
        className="product-card group"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s`,
        }}
      >
        {/* Image area */}
        <div className="relative overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0a1628/00b4d8?text=Product'; }}
          />

          {/* Overlay wishlist */}
          <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-start justify-end p-2">
            <button
              onClick={handleWishlist}
              className={`p-2.5 rounded-full glass-card transition-all hover:scale-110 ${wishlisted ? 'text-red-400' : 'text-foreground'}`}
            >
              <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount && (
              <span className="badge-discount animate-pulse">-{product.discount}%</span>
            )}
            {product.isNew && (
              <span className="bg-accent text-background text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
            )}
            {product.isBestseller && (
              <span className="bg-primary text-background text-[10px] font-bold px-2 py-0.5 rounded-full">BEST</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 relative z-10">
          <div>
            <span className="text-xs text-primary font-medium">{product.category}</span>
            <h3 className="text-sm font-semibold text-foreground mt-0.5 line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-primary font-bold text-lg">৳{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-muted-foreground text-xs line-through ml-2">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="space-y-2 pt-1">
            {/* Primary: Quick Payment Order */}
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full btn-glow py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <CreditCard size={14} />
              এখনই অর্ডার করুন
            </button>

            {/* Secondary row: WhatsApp + Cart */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleWhatsApp}
                className="py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
              >
                <MessageCircle size={13} />
                WhatsApp
              </button>
              <button
                onClick={handleAdd}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  inCart
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                <ShoppingCart size={13} />
                {inCart ? 'In Cart' : 'কার্টে যোগ'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Order Modal */}
      {showOrderModal && (
        <QuickOrderModal
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            category: product.category,
          }}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
