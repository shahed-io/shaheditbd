import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
  addedAt?: string; // ISO timestamp – used to expire forgotten cart items
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

// Unique key for an item (id + variant)
const itemKey = (i: { id: number | string; variant?: string }) =>
  `${i.id}__${i.variant || ''}`;

// Guard against phantom / corrupt cart entries that occasionally sneak in from
// stale localStorage or leftover DB rows (e.g. old test data). We only trust
// items with real id, name, positive price and a sane quantity (1-99).
const isValidCartItem = (i: any): i is CartItem => {
  if (!i || typeof i !== 'object') return false;
  if (i.id === undefined || i.id === null || i.id === '') return false;
  if (typeof i.name !== 'string' || !i.name.trim()) return false;
  const price = Number(i.price);
  if (!Number.isFinite(price) || price <= 0) return false;
  const qty = Number(i.quantity);
  if (!Number.isFinite(qty) || qty < 1 || qty > 99) return false;
  return true;
};

const sanitizeItems = (arr: any): CartItem[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: CartItem[] = [];
  for (const raw of arr) {
    if (!isValidCartItem(raw)) continue;
    const k = itemKey(raw);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...raw, quantity: Math.min(99, Math.max(1, Math.floor(Number(raw.quantity)))) });
  }
  return out;
};

// Local cart items expire after this long — a cart the user forgot about weeks
// ago must not silently re-appear (and re-sync to the server) on a later visit.
const CART_LOCAL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CART_RESET_FLAG = 'cart_reset_v2'; // one-time cleanup of pre-TTL carts

const stamp = (i: CartItem): CartItem => ({ ...i, addedAt: i.addedAt || new Date().toISOString() });

const isFresh = (i: CartItem) => {
  const t = new Date(i.addedAt || 0).getTime();
  return Number.isFinite(t) && t > 0 && Date.now() - t <= CART_LOCAL_TTL_MS;
};

// Drop items that have no timestamp (legacy rows) or that expired.
const pruneStale = (arr: CartItem[]): CartItem[] => arr.filter(isFresh);

interface CartContextType {
  items: CartItem[];
  wishlist: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  buyNow: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (id: number | string, variant?: string) => void;
  updateQuantity: (id: number | string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  removeItems: (keys: string[]) => void; // remove a batch (after payment)
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
  // Selection (multi-select checkout)
  selectedKeys: string[];
  toggleSelected: (key: string) => void;
  selectAll: () => void;
  clearSelected: () => void;
  isSelected: (key: string) => boolean;
  selectedItems: CartItem[];
  itemKey: (i: { id: number | string; variant?: string }) => string;
  // Coupon
  coupon: CouponState;
  setCoupon: (c: CouponState) => void;
  resetCoupon: () => void;
  // Pricing breakdown (based on SELECTED items if any, else all)
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

const CART_KEY = 'cart';
const CART_BACKUP_KEY = 'cart_backup'; // { items, savedAt } — recovers cart if primary storage is wiped mid-checkout
const CART_BACKUP_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// Server-side cart rows older than this are considered abandoned and are purged
// on login instead of being restored (prevents old products silently re-appearing).
const CART_DB_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const readBackup = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return [];
    if (parsed.savedAt && Date.now() - new Date(parsed.savedAt).getTime() > CART_BACKUP_TTL_MS) return [];
    return sanitizeItems(parsed.items);
  } catch { return []; }
};

const writeBackup = (items: CartItem[]) => {
  try {
    if (!items.length) return; // never overwrite backup with empty (that's the whole point)
    localStorage.setItem(CART_BACKUP_KEY, JSON.stringify({ items, savedAt: new Date().toISOString() }));
  } catch { /* ignore */ }
};

// One-time cleanup: carts saved before the TTL system existed have no
// timestamps and were the reason old products kept re-appearing by themselves.
const needsOneTimeReset = (): boolean => {
  try {
    if (localStorage.getItem(CART_RESET_FLAG)) return false;
    localStorage.setItem(CART_RESET_FLAG, new Date().toISOString());
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_BACKUP_KEY);
    return true;
  } catch { return false; }
};

const loadInitialItems = (): CartItem[] => {
  try {
    if (needsOneTimeReset()) return [];
    const rawPrimary = localStorage.getItem(CART_KEY);
    const primary = pruneStale(sanitizeItems(JSON.parse(rawPrimary || '[]')));
    if (primary.length > 0) return primary;
    // Only fall back to backup when the primary cart key has never been written
    // (storage was wiped mid-checkout). If the user intentionally emptied their
    // cart, CART_KEY exists as '[]' and we must respect that empty state.
    if (rawPrimary === null) return pruneStale(readBackup());
    return [];
  } catch { return []; }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [items, setItems] = useState<CartItem[]>(() => loadInitialItems());
  const [wishlist, setWishlist] = useState<CartItem[]>(() => {
    try { return sanitizeItems(JSON.parse(localStorage.getItem('wishlist') || '[]')); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [coupon, setCouponState] = useState<CouponState>(() => {
    try { return JSON.parse(localStorage.getItem('cart_coupon') || 'null') || EMPTY_COUPON; } catch { return EMPTY_COUPON; }
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serviceFee] = useState(DEFAULT_SERVICE_FEE);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    loadInitialItems().map(i => `${i.id}__${i.variant || ''}`)
  );

  // Track which user we've synced for, to avoid duplicate syncs
  const syncedUserRef = useRef<string | null>(null);

  // Persist locally + keep a rolling backup so an abandoned checkout can be resumed later.
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (items.length > 0) {
      writeBackup(items);
    } else {
      // Cart intentionally empty — drop the backup so removed items don't
      // resurrect on next visit.
      try { localStorage.removeItem(CART_BACKUP_KEY); } catch { /* ignore */ }
    }
  }, [items]);
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('cart_coupon', JSON.stringify(coupon)); }, [coupon]);


  // === DB sync helpers ===
  const dbUpsertItem = useCallback(async (uid: string, item: CartItem) => {
    try {
      const { error } = await supabase.from('user_cart_items').upsert({
        user_id: uid,
        product_id: String(item.id),
        name: item.name,
        category: item.category || null,
        image: item.image || null,
        variant: item.variant || '',
        price: item.price,
        original_price: item.originalPrice ?? null,
        quantity: item.quantity,
      }, { onConflict: 'user_id,product_id,variant' });
      if (error) console.warn('[cart] upsert error:', error.message);
    } catch (e) { console.warn('[cart] upsert ex:', e); }
  }, []);

  const dbDeleteItems = useCallback(async (uid: string, productKeys: { product_id: string; variant: string | null }[]) => {
    try {
      for (const k of productKeys) {
        await supabase.from('user_cart_items')
          .delete()
          .eq('user_id', uid)
          .eq('product_id', k.product_id)
          .eq('variant', k.variant || '');
      }
    } catch { /* silent */ }
  }, []);

  // === Login sync: merge local cart into DB, then load DB ===
  useEffect(() => {
    if (!userId) {
      syncedUserRef.current = null;
      return;
    }
    if (syncedUserRef.current === userId) return;
    syncedUserRef.current = userId;

    (async () => {
      try {
        // One-time server-side cleanup for carts saved before the TTL system.
        try {
          if (!localStorage.getItem('cart_db_reset_v2')) {
            localStorage.setItem('cart_db_reset_v2', new Date().toISOString());
            await supabase.from('user_cart_items').delete().eq('user_id', userId);
          }
        } catch { /* ignore */ }

        const local = pruneStale(items);
        if (local.length > 0) {
          const { error: upErr } = await supabase.from('user_cart_items').upsert(
            local.map(it => ({
              user_id: userId,
              product_id: String(it.id),
              name: it.name,
              category: it.category || null,
              image: it.image || null,
              variant: it.variant || '',
              price: it.price,
              original_price: it.originalPrice ?? null,
              quantity: it.quantity,
            })),
            { onConflict: 'user_id,product_id,variant' }
          );
          if (upErr) console.warn('[cart] merge upsert error:', upErr.message);
        }
        const { data, error } = await supabase
          .from('user_cart_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (error) { console.warn('[cart] fetch error:', error.message); return; }
        if (!data) return;
        const rawDbItems = data.map((r: any) => ({
          id: r.product_id,
          name: r.name,
          category: r.category || '',
          image: r.image || '',
          variant: r.variant || undefined,
          price: Number(r.price) || 0,
          originalPrice: r.original_price != null ? Number(r.original_price) : undefined,
          quantity: r.quantity || 1,
          // Age is measured from creation, not from updated_at: a login merge
          // refreshes updated_at and would keep ancient rows alive forever.
          addedAt: r.created_at,
          _touchedAt: r.created_at,
        }));

        // Rows the user never touched recently are considered stale — they are the
        // reason old products kept "re-appearing" in the cart after login.
        const staleRows = rawDbItems.filter((it: any) => {
          const t = new Date(it._touchedAt || 0).getTime();
          return !Number.isFinite(t) || Date.now() - t > CART_DB_TTL_MS;
        });
        const invalidRows = rawDbItems.filter((it: any) => !isValidCartItem(it));

        // Drop rows whose product no longer exists / is not purchasable.
        const freshRows = rawDbItems.filter(
          (it: any) => !staleRows.includes(it) && isValidCartItem(it)
        );
        let missingRows: any[] = [];
        if (freshRows.length > 0) {
          const ids = Array.from(new Set(freshRows.map((r: any) => String(r.id))))
            .filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
          if (ids.length > 0) {
            const { data: prods } = await supabase
              .from('products')
              .select('id')
              .in('id', ids);
            const alive = new Set((prods || []).map((p: any) => String(p.id)));
            missingRows = freshRows.filter((r: any) => !alive.has(String(r.id)));
          }
        }

        const dropRows = [...new Set([...staleRows, ...invalidRows, ...missingRows])];
        if (dropRows.length > 0) {
          await dbDeleteItems(userId, dropRows.map((r: any) => ({
            product_id: String(r.id), variant: r.variant || '',
          })));
        }

        const dbItems = sanitizeItems(
          freshRows.filter((r: any) => !missingRows.includes(r)).map(({ _touchedAt, ...rest }: any) => rest)
        );

        // DB is the source of truth. Only merge local items when the user was
        // a guest (DB empty) — otherwise stale local entries would re-appear
        // as phantom cart items after login on another device.
        const finalItems = dbItems.length > 0 ? dbItems : sanitizeItems(local);
        setItems(finalItems);
        setSelectedKeys(finalItems.map(itemKey));
      } catch (e) { console.warn('[cart] sync ex:', e); }
    })();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps


  // Abandoned cart (unchanged)
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

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty: number = 1) => {
    let nextItem: CartItem | null = null;
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.variant === item.variant);
      let next: CartItem[];
      if (existing) {
        next = prev.map(i => (i.id === item.id && i.variant === item.variant) ? { ...i, quantity: i.quantity + qty } : i);
      } else {
        next = [...prev, stamp({ ...item, quantity: qty })];
      }
      nextItem = next.find(i => i.id === item.id && i.variant === item.variant) || null;
      return next;
    });
    // Auto-select newly added item
    setSelectedKeys(prev => {
      const k = itemKey({ id: item.id, variant: item.variant });
      return prev.includes(k) ? prev : [...prev, k];
    });
    setCartOpen(true);
    // DB upsert
    if (userId && nextItem) dbUpsertItem(userId, nextItem);
    // Tracking
    import('@/components/store/GoogleTracking').then(({ gTrackAddToCart }) => {
      gTrackAddToCart({
        value: item.price * qty,
        items: [{ item_id: String(item.id), item_name: item.name, price: item.price, quantity: qty }],
      }).catch(() => { });
    }).catch(() => { });
    import('@/components/store/MarketingPixels').then(({ mTrackAddToCart, loadMarketingPixels }) => {
      loadMarketingPixels().then(() => {
        mTrackAddToCart({
          content_id: String(item.id),
          content_name: item.name,
          value: item.price * qty,
        });
      }).catch(() => { });
    }).catch(() => { });
  };

  // Buy now: clear cart, add single item, go to checkout
  const buyNow = (item: Omit<CartItem, 'quantity'>, qty: number = 1) => {
    const single: CartItem = { ...item, quantity: qty };
    const previous = items;
    setItems([single]);
    setSelectedKeys([itemKey(single)]);
    if (userId) {
      // Remove the replaced rows from the server too, otherwise they come back
      // on the next login and look like items the user never added.
      const stale = previous.filter(i => itemKey(i) !== itemKey(single));
      if (stale.length) {
        dbDeleteItems(userId, stale.map(i => ({ product_id: String(i.id), variant: i.variant || null })));
      }
      dbUpsertItem(userId, single);
    }
  };


  const removeFromCart = (id: number | string, variant?: string) => {
    setItems(prev => prev.filter(i => !(i.id === id && (i.variant || '') === (variant || ''))));
    setSelectedKeys(prev => prev.filter(k => k !== itemKey({ id, variant })));
    if (userId) dbDeleteItems(userId, [{ product_id: String(id), variant: variant || null }]);
  };

  const updateQuantity = (id: number | string, quantity: number, variant?: string) => {
    if (quantity <= 0) { removeFromCart(id, variant); return; }
    let updated: CartItem | null = null;
    setItems(prev => prev.map(i => {
      if (i.id === id && (i.variant || '') === (variant || '')) {
        updated = { ...i, quantity };
        return updated;
      }
      return i;
    }));
    if (userId && updated) dbUpsertItem(userId, updated);
  };

  const clearCart = () => {
    setItems([]);
    setSelectedKeys([]);
    setCouponState(EMPTY_COUPON);
    setOrderNotes('');
    setTermsAccepted(false);
    localStorage.removeItem('cart_coupon');
    // Order placed successfully — drop the abandoned-cart backup so the finished
    // cart doesn't get "restored" on the next visit.
    try { localStorage.removeItem(CART_BACKUP_KEY); } catch {}
    if (userId) {
      supabase.from('user_cart_items').delete().eq('user_id', userId).then(() => {});
    }
  };

  // Remove a batch of items by their composite keys (used after successful payment)
  const removeItems = (keys: string[]) => {
    if (!keys.length) return;
    const keySet = new Set(keys);
    const toDelete = items.filter(i => keySet.has(itemKey(i)));
    setItems(prev => prev.filter(i => !keySet.has(itemKey(i))));
    setSelectedKeys(prev => prev.filter(k => !keySet.has(k)));
    if (userId && toDelete.length) {
      dbDeleteItems(userId, toDelete.map(i => ({ product_id: String(i.id), variant: i.variant || null })));
    }
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

  // Selection helpers
  const toggleSelected = (key: string) =>
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const selectAll = () => setSelectedKeys(items.map(itemKey));
  const clearSelected = () => setSelectedKeys([]);
  const isSelected = (key: string) => selectedKeys.includes(key);

  // Auto-prune selectedKeys when items change
  useEffect(() => {
    const validKeys = new Set(items.map(itemKey));
    setSelectedKeys(prev => {
      const filtered = prev.filter(k => validKeys.has(k));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [items]);

  // ===== Pricing: based on SELECTED items (if any selection exists); else all items =====
  const effectiveItems: CartItem[] = selectedKeys.length > 0
    ? items.filter(i => selectedKeys.includes(itemKey(i)))
    : items;
  const selectedItems: CartItem[] = items.filter(i => selectedKeys.includes(itemKey(i)));

  const subtotal = effectiveItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = coupon.isApplied
    ? coupon.type === 'percentage'
      ? Math.round((subtotal * coupon.discount) / 100)
      : Math.min(coupon.discount, subtotal)
    : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * TAX_RATE);
  const finalTotal = afterDiscount + taxAmount + serviceFee;

  const cartTotal = subtotal;
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider value={{
      items, wishlist, addToCart, buyNow, removeFromCart, updateQuantity, clearCart, removeItems,
      toggleWishlist, isWishlisted, isInCart,
      cartTotal, cartCount, wishlistCount,
      cartOpen, setCartOpen, wishlistOpen, setWishlistOpen,
      selectedKeys, toggleSelected, selectAll, clearSelected, isSelected, selectedItems, itemKey,
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
