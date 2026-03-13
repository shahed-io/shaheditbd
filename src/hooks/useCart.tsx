import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CartItem {
  id: number | string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  variant?: string; // selected variant label
}

export interface CouponState {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  isApplied: boolean;
}

// Tax rate 0% (digital goods – adjust if needed)
export const TAX_RATE = 0;
// Service fee (flat ৳0 default – admin can set in site_settings)
export const DEFAULT_SERVICE_FEE = 0;

interface CartContextType {
  items: CartItem[];
  wishlist: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  buyNow: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (item: Omit<CartItem, 'quantity'>) => void;
  isWishlisted: (id: number | string) => boolean;
  isInCart: (id: number | string) => boolean;
  cartTotal: number;
  cartCount: number;
  wishlistCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  wishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  // Coupon
  coupon: CouponState;
  setCoupon: (c: CouponState) => void;
  resetCoupon: () => void;
  // Pricing breakdown
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceFee: number;
  finalTotal: number;
  // Notes
  orderNotes: string;
  setOrderNotes: (n: string) => void;
  // Terms
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  // Abandoned cart
  saveAbandonedCart: (email: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const EMPTY_COUPON: CouponState = { code: '', discount: 0, type: 'percentage', isApplied: false };

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [coupon, setCouponState] = useState<CouponState>(() => {
    try { return JSON.parse(localStorage.getItem('cart_coupon') || 'null') || EMPTY_COUPON; } catch { return EMPTY_COUPON; }
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serviceFee] = useState(DEFAULT_SERVICE_FEE);

  // Persist cart & coupon
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('cart_coupon', JSON.stringify(coupon)); }, [coupon]);

  // Abandoned cart: auto-save to DB after 2min of inactivity if cart has items
  const saveAbandonedCart = useCallback(async (email: string) => {
    if (!items.length || !email) return;
    try {
      await supabase.from('site_settings').upsert({
        key: `abandoned_cart_${email.replace(/[^a-z0-9]/gi, '_')}`,
        value: JSON.stringify({ items, email, savedAt: new Date().toISOString() }),
        category: 'abandoned_carts',
      }, { onConflict: 'key' });
    } catch { /* silent */ }
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.variant === item.variant);
      if (existing) return prev.map(i => (i.id === item.id && i.variant === item.variant) ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
    setCartOpen(true);
  };

  // Buy now: clear cart, add single item, go to checkout
  const buyNow = (item: Omit<CartItem, 'quantity'>) => {
    setItems([{ ...item, quantity: 1 }]);
    // Navigation handled by caller
  };

  const removeFromCart = (id: number | string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    setCouponState(EMPTY_COUPON);
    setOrderNotes('');
    setTermsAccepted(false);
    localStorage.removeItem('cart_coupon');
  };

  const setCoupon = (c: CouponState) => setCouponState(c);
  const resetCoupon = () => { setCouponState(EMPTY_COUPON); localStorage.removeItem('cart_coupon'); };

  const toggleWishlist = (item: Omit<CartItem, 'quantity'>) => {
    setWishlist(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const isWishlisted = (id: number | string) => wishlist.some(i => i.id === id);
  const isInCart = (id: number | string) => items.some(i => i.id === id);

  // Pricing calculation
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = coupon.isApplied
    ? coupon.type === 'percentage'
      ? Math.round((subtotal * coupon.discount) / 100)
      : Math.min(coupon.discount, subtotal)
    : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * TAX_RATE);
  const finalTotal = afterDiscount + taxAmount + serviceFee;

  // Legacy cartTotal = subtotal (for backwards compat)
  const cartTotal = subtotal;
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider value={{
      items, wishlist, addToCart, buyNow, removeFromCart, updateQuantity, clearCart,
      toggleWishlist, isWishlisted, isInCart,
      cartTotal, cartCount, wishlistCount,
      cartOpen, setCartOpen, wishlistOpen, setWishlistOpen,
      coupon, setCoupon, resetCoupon,
      subtotal, discountAmount, taxAmount, serviceFee, finalTotal,
      orderNotes, setOrderNotes,
      termsAccepted, setTermsAccepted,
      saveAbandonedCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
