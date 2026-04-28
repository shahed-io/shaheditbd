import { FloatingSupport } from './FloatingSupport';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

type TickerItem = { label: string; price: string; off: string; slug: string };

const FALLBACK_ITEMS: TickerItem[] = [
  { label: 'Windows 11 Pro',       price: '৳599',   off: '-94%', slug: 'windows-11-pro' },
  { label: 'Office 365 Personal',  price: '৳1,999', off: '-88%', slug: 'office-365-personal' },
  { label: 'Netflix Premium',      price: '৳499',   off: '-81%', slug: 'netflix-premium' },
  { label: 'Adobe Creative Cloud', price: '৳599',   off: '-70%', slug: 'adobe-creative-cloud' },
  { label: 'Spotify Premium',      price: '৳899',   off: '-60%', slug: 'spotify-premium' },
];

const formatBDT = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;

const useTickerProducts = () =>
  useQuery({
    queryKey: ['ticker-banner-products'],
    queryFn: async (): Promise<TickerItem[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('name, price, original_price, discount_percent, slug, status, total_sales')
        .eq('status', 'active')
        .order('total_sales', { ascending: false })
        .limit(40);

      if (error || !data) return FALLBACK_ITEMS;

      const items: TickerItem[] = data
        .map((p: any) => {
          const price = Number(p.price) || 0;
          const original = Number(p.original_price) || 0;
          let off = 0;
          if (p.discount_percent && p.discount_percent > 0) off = p.discount_percent;
          else if (original > price && price > 0) off = Math.round(((original - price) / original) * 100);
          return {
            label: p.name as string,
            price: formatBDT(price),
            off: off > 0 ? `-${off}%` : '',
            slug: p.slug as string,
          };
        })
        .filter((i) => i.off !== '' && i.label && i.slug)
        .sort((a, b) => parseInt(b.off.replace(/[^0-9]/g, '')) - parseInt(a.off.replace(/[^0-9]/g, '')))
        .slice(0, 12);

      return items.length >= 4 ? items : FALLBACK_ITEMS;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

const TickerBanner = () => {
  const { data } = useTickerProducts();
  const source = data && data.length > 0 ? data : FALLBACK_ITEMS;
  const items = useMemo(() => [...source, ...source], [source]);

  return (
    <div className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(220,20%,97%) 0%, hsl(258,40%,96%) 50%, hsl(220,20%,97%) 100%)',
        borderTop: '1px solid hsla(258,78%,55%,0.15)',
        borderBottom: '1px solid hsla(258,78%,55%,0.15)',
        boxShadow: '0 2px 12px hsla(258,78%,55%,0.08)',
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, hsla(258,78%,55%,0.05) 0%, transparent 65%)' }} />

      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(220,20%,97%) 0%, transparent 100%)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(220,20%,97%) 0%, transparent 100%)' }} />

      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full"
        style={{
          background: 'hsl(258,78%,55%)',
          color: 'white',
          boxShadow: '0 2px 10px hsla(258,78%,55%,0.35)',
        }}>
        <Zap size={9} fill="white" />
        <span>LIVE</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      </div>

      <div className="ticker-track whitespace-nowrap py-3" style={{ paddingLeft: '110px' }}>
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center flex-shrink-0">
            <Link
              to={`/product/${item.slug}`}
              className="inline-flex items-center gap-2 px-5 text-[12.5px] hover:opacity-80 transition-opacity"
            >
              <span className="font-semibold" style={{ color: 'hsl(226,35%,18%)' }}>{item.label}</span>
              <span className="font-bold" style={{ color: 'hsl(258,78%,50%)' }}>{item.price}</span>
              {item.off && (
                <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-full"
                  style={{ background: 'hsl(258,78%,55%)', color: 'white' }}>{item.off}</span>
              )}
            </Link>
            <span className="text-[18px]" style={{ color: 'hsla(258,78%,55%,0.2)' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const FloatingButtons = () => <FloatingSupport />;

export { TickerBanner, FloatingButtons };
