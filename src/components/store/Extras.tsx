import { FloatingSupport } from './FloatingSupport';
import { Zap } from 'lucide-react';

const TICKER_ITEMS = [
  { label: 'Windows 11 Pro',      price: '৳599',   off: '-94%' },
  { label: 'Office 365 Personal', price: '৳1,999', off: '-88%' },
  { label: 'Netflix Premium',     price: '৳499',   off: '-81%' },
  { label: 'Adobe Creative Cloud',price: '৳599',   off: '-70%' },
  { label: 'Spotify Premium',     price: '৳899',   off: '-60%' },
  { label: 'IDM Lifetime',        price: '৳2,625', off: '-75%' },
  { label: 'NordVPN 1 Year',      price: '৳1,299', off: '-80%' },
  { label: 'ElevenLabs AI',       price: '৳4,449', off: '-55%' },
  { label: 'Windows 11 Home',     price: '৳549',   off: '-93%' },
  { label: 'MS 365 Family',       price: '৳4,999', off: '-50%' },
];

const TickerBanner = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="relative overflow-hidden border-y"
      style={{ background: 'hsl(222, 22%, 7%)', borderColor: 'hsla(0,0%,100%,0.07)' }}
    >
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(222,22%,7%) 0%, transparent 100%)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(222,22%,7%) 0%, transparent 100%)' }} />

      {/* LIVE indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 text-[10px] font-bold text-white px-3 py-1.5 rounded-full"
        style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
        <Zap size={9} fill="white" />
        <span>LIVE</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
      </div>

      <div className="ticker-track whitespace-nowrap py-3" style={{ paddingLeft: '110px' }}>
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center flex-shrink-0">
            <span className="inline-flex items-center gap-2 px-5 text-[12px]">
              <span className="font-semibold" style={{ color: 'hsla(0,0%,100%,0.7)' }}>{item.label}</span>
              <span className="font-bold" style={{ color: 'hsl(243,75%,65%)' }}>{item.price}</span>
              <span className="badge-sale">{item.off}</span>
            </span>
            <span style={{ color: 'hsla(0,0%,100%,0.15)' }} className="text-sm">|</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const FloatingButtons = () => <FloatingSupport />;

export { TickerBanner, FloatingButtons };
