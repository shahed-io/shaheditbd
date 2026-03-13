import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image?: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  toggleWishlist: (item: { id: string; name: string; price: number; image?: string }) => void;
  isWishlisted: (productId: string) => boolean;
  wishlistCount: number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load from localStorage initially
  const getLocalWishlist = (): WishlistItem[] => {
    try { return JSON.parse(localStorage.getItem('wishlist_v2') || '[]'); }
    catch { return []; }
  };

  const saveLocalWishlist = (items: WishlistItem[]) => {
    localStorage.setItem('wishlist_v2', JSON.stringify(items));
  };

  // Sync local wishlist to DB when user logs in
  const syncToDb = async (userId: string, localItems: WishlistItem[]) => {
    if (!localItems.length) return;
    const rows = localItems.map(item => ({
      user_id: userId,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      product_image: item.product_image,
    }));
    await supabase.from('wishlists').upsert(rows, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
  };

  // Fetch from DB
  const fetchFromDb = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('wishlists')
      .select('id, product_id, product_name, product_price, product_image')
      .eq('user_id', userId);
    const items = (data || []) as WishlistItem[];
    setWishlistItems(items);
    saveLocalWishlist(items);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      const local = getLocalWishlist();
      syncToDb(user.id, local).then(() => fetchFromDb(user.id));
    } else {
      setWishlistItems(getLocalWishlist());
    }
  }, [user]);

  const toggleWishlist = async (item: { id: string; name: string; price: number; image?: string }) => {
    const productId = String(item.id);
    const exists = wishlistItems.some(w => w.product_id === productId);

    if (exists) {
      // Remove
      const updated = wishlistItems.filter(w => w.product_id !== productId);
      setWishlistItems(updated);
      saveLocalWishlist(updated);
      if (user) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
      }
      toast.success('উইশলিস্ট থেকে সরানো হয়েছে');
    } else {
      // Add
      const newItem: WishlistItem = {
        id: '',
        product_id: productId,
        product_name: item.name,
        product_price: item.price,
        product_image: item.image,
      };
      const updated = [...wishlistItems, newItem];
      setWishlistItems(updated);
      saveLocalWishlist(updated);
      if (user) {
        const { data } = await supabase
          .from('wishlists')
          .upsert({
            user_id: user.id,
            product_id: productId,
            product_name: item.name,
            product_price: item.price,
            product_image: item.image,
          }, { onConflict: 'user_id,product_id' })
          .select('id')
          .single();
        if (data) {
          setWishlistItems(prev => prev.map(w => w.product_id === productId ? { ...w, id: data.id } : w));
        }
      }
      toast.success('উইশলিস্টে যোগ করা হয়েছে ❤️');
    }
  };

  const isWishlisted = (productId: string) => wishlistItems.some(w => w.product_id === String(productId));

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isWishlisted, wishlistCount: wishlistItems.length, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
