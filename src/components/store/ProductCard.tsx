import { useState, useRef, useEffect } from 'react';
import { Star, Heart, ShoppingCart, Eye, Zap } from 'lucide-react';
import { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
  delay?: number;
}

const ProductCard = ({ product, delay = 0 }: ProductCardProps) => {
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      ref={ref}
      className="product-card"
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
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0a1628/00b4d8?text=Product';
          }}
        />

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-background/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={() => setWishlisted(!wishlisted)}
            className={`p-3 rounded-full glass-card transition-all hover:scale-110 ${wishlisted ? 'text-red-400' : 'text-foreground'}`}
          >
            <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <button className="p-3 rounded-full glass-card transition-all hover:scale-110 text-foreground">
            <Eye size={16} />
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
            <span className="bg-primary text-background text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap size={8} />BEST
            </span>
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
              size={12}
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

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            added
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'btn-glow'
          }`}
        >
          <ShoppingCart size={15} />
          {added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
