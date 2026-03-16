import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock } from 'lucide-react';

interface RecentItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string | null;
  product_slug: string | null;
  viewed_at: string;
}

const RecentlyViewed = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('recently_viewed')
      .select('*')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setItems(data || []));
  }, [user]);

  if (!user || items.length === 0) return null;

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
          <Clock size={16} className="text-white" />
        </div>
        <div>
          <h2 className="font-sora font-bold text-xl text-foreground">সম্প্রতি দেখেছেন</h2>
          <p className="text-xs text-muted-foreground">আপনার সাম্প্রতিক ব্রাউজিং ইতিহাস</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {items.map(item => (
          <a key={item.id} href={item.product_slug ? `/product/${item.product_slug}` : '/shop'}
            className="group rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid hsla(258,78%,75%,0.18)',
              boxShadow: '0 2px 12px hsla(258,78%,55%,0.06)',
            }}>
            <div className="aspect-square overflow-hidden bg-muted/10">
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.10), hsla(200,90%,45%,0.08))' }}>
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-semibold line-clamp-2 leading-tight mb-1" style={{ color: 'hsl(226,35%,18%)' }}>{item.product_name}</p>
              <p className="text-[11px] font-bold" style={{ color: 'hsl(258,78%,50%)' }}>৳{item.product_price.toLocaleString()}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
