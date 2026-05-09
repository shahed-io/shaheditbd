import { FloatingSupport } from './FloatingSupport';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

type TickerItem = { label: string; price: string; off: string; slug?: string };

type AnnouncementSettings = {
  enabled: boolean;
  useLiveProducts: boolean;
  speedSeconds: number;
  bgFrom: string;
  bgTo: string;
  textColor: string;
  accentColor: string;
  liveLabel: string;
  items: { label: string; price: string; off: string }[];
};

const DEFAULT_SETTINGS: AnnouncementSettings = {
  enabled: true,
  useLiveProducts: true,
  speedSeconds: 60,
  bgFrom: 'hsl(220,20%,97%)',
  bgTo: 'hsl(258,40%,96%)',
  textColor: 'hsl(226,35%,18%)',
  accentColor: 'hsl(258,78%,55%)',
  liveLabel: 'LIVE',
  items: [
    { label: 'Windows 11 Pro', price: '৳599', off: '-94%' },
    { label: 'Office 365 Personal', price: '৳1,999', off: '-88%' },
    { label: 'Netflix Premium', price: '৳499', off: '-81%' },
    { label: 'Adobe Creative Cloud', price: '৳599', off: '-70%' },
    { label: 'Spotify Premium', price: '৳899', off: '-60%' },
  ],
};

const formatBDT = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;

const useAnnouncementSettings = () =>
  useQuery({
    queryKey: ['announcement-bar-settings'],
    queryFn: async (): Promise<AnnouncementSettings> => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'announcement_bar').maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_SETTINGS, ...JSON.parse(data.value) }; } catch {}
      }
      return DEFAULT_SETTINGS;
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

const useTickerProducts = (enabled: boolean) =>
  useQuery({
    enabled,
    queryKey: ['ticker-banner-products'],
    queryFn: async (): Promise<TickerItem[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('name, price, original_price, discount_percent, slug, status, total_sales')
        .eq('status', 'active')
        .order('total_sales', { ascending: false })
        .limit(40);

      if (error || !data) return [];

      return data
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
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

const TickerBanner = () => {
  const { data: settings = DEFAULT_SETTINGS } = useAnnouncementSettings();
  const { data: liveProducts } = useTickerProducts(settings.useLiveProducts);

  const source: TickerItem[] = useMemo(() => {
    if (settings.useLiveProducts && liveProducts && liveProducts.length >= 4) return liveProducts;
    return settings.items;
  }, [settings, liveProducts]);

  const items = useMemo(() => [...source, ...source], [source]);

  if (!settings.enabled || source.length === 0) return null;

  const speed = Math.max(20, Math.min(300, settings.speedSeconds || 60));

  return (
    <div className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${settings.bgFrom} 0%, ${settings.bgTo} 50%, ${settings.bgFrom} 100%)`,
        borderTop: `1px solid ${settings.accentColor}26`,
        borderBottom: `1px solid ${settings.accentColor}26`,
        boxShadow: `0 2px 12px ${settings.accentColor}14`,
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `radial-gradient(ellipse at 50% 0%, ${settings.accentColor}0d 0%, transparent 65%)` }} />

      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${settings.bgFrom} 0%, transparent 100%)` }} />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to left, ${settings.bgFrom} 0%, transparent 100%)` }} />

      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full"
        style={{
          background: settings.accentColor,
          color: 'white',
          boxShadow: `0 2px 10px ${settings.accentColor}59`,
        }}>
        <Zap size={9} fill="white" />
        <span>{settings.liveLabel}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      </div>

      <div
        className="ticker-track whitespace-nowrap py-3"
        style={{ paddingLeft: '110px', animationDuration: `${speed}s` }}
      >
        {items.map((item, i) => {
          const inner = (
            <span className="inline-flex items-center gap-2 px-5 text-[12.5px] hover:opacity-80 transition-opacity">
              <span className="font-semibold" style={{ color: settings.textColor }}>{item.label}</span>
              <span className="font-bold" style={{ color: settings.accentColor }}>{item.price}</span>
              {item.off && (
                <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-full"
                  style={{ background: settings.accentColor, color: 'white' }}>{item.off}</span>
              )}
            </span>
          );
          return (
            <span key={i} className="inline-flex items-center flex-shrink-0">
              {item.slug ? <Link to={`/product/${item.slug}`}>{inner}</Link> : inner}
              <span className="text-[18px]" style={{ color: `${settings.accentColor}33` }}>|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

// FloatingSupport is now mounted globally in App.tsx, so this is a no-op to avoid duplicates.
const FloatingButtons = () => null;

export { TickerBanner, FloatingButtons };
