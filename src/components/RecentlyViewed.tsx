import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PLACEHOLDER = '/placeholder.svg';
const LS_KEY = 'ss_recently_viewed';
const MAX_ITEMS = 12;

export interface RecentItem {
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string | null;
  product_slug: string | null;
  viewed_at: string;
}

const readLocal = (): RecentItem[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const writeLocal = (items: RecentItem[]) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS))); } catch {}
};

/** Call from product detail page to record a view. */
export const trackRecentlyViewed = async (
  item: Omit<RecentItem, 'viewed_at'>,
  userId?: string | null
) => {
  if (!item.product_id || !item.product_name) return;
  const now = new Date().toISOString();
  const entry: RecentItem = { ...item, viewed_at: now };

  // Local storage (always)
  const existing = readLocal().filter(x => x.product_id !== item.product_id);
  writeLocal([entry, ...existing]);

  // Supabase (logged-in only)
  if (userId) {
    try {
      await supabase.from('recently_viewed').upsert(
        {
          user_id: userId,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          product_image: item.product_image,
          product_slug: item.product_slug,
          viewed_at: now,
        },
        { onConflict: 'user_id,product_id' }
      );
    } catch {/* ignore */}
  }
};

interface Props {
  currentProductId?: string;
}

export const RecentlyViewed = ({ currentProductId }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let list: RecentItem[] = readLocal();

      if (user?.id) {
        try {
          const { data } = await supabase
            .from('recently_viewed')
            .select('product_id, product_name, product_price, product_image, product_slug, viewed_at')
            .eq('user_id', user.id)
            .order('viewed_at', { ascending: false })
            .limit(MAX_ITEMS);
          if (data && data.length) {
            // merge: prefer db record (most recent)
            const map = new Map<string, RecentItem>();
            (data as RecentItem[]).forEach(i => map.set(i.product_id, i));
            list.forEach(i => { if (!map.has(i.product_id)) map.set(i.product_id, i); });
            list = Array.from(map.values()).sort(
              (a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
            );
          }
        } catch {/* ignore */}
      }

      if (currentProductId) list = list.filter(i => i.product_id !== currentProductId);
      if (!cancelled) {
        setItems(list.slice(0, 8));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id, currentProductId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="container-fluid pt-2 pb-8">
      <div className="border-t border-border mb-8" />
      <h2 className="font-sora font-bold text-xl text-foreground mb-6">
        Recently Viewed
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-muted animate-pulse aspect-[3/4]" />
            ))
          : items.map((p) => (
              <div
                key={p.product_id}
                onClick={() => p.product_slug && navigate(`/product/${p.product_slug}`)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 group-hover:border-primary/40 transition-colors">
                  <img
                    src={p.product_image || PLACEHOLDER}
                    alt={p.product_name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                </div>
                <div className="pt-3 flex flex-col gap-1.5">
                  <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {p.product_name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-sm font-bold" style={{ color: 'hsl(35,100%,45%)' }}>
                      {Number(p.product_price).toLocaleString()}৳
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
