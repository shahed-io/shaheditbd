import { FloatingSupport } from './FloatingSupport';
import { Zap } from 'lucide-react';

const TICKER_ITEMS = [
  { label: 'Windows 11 Pro', price: '৳599',   off: '-94%' },
  { label: 'Office 365 Personal', price: '৳1,999', off: '-88%' },
  { label: 'Netflix Premium', price: '৳499',  off: '-81%' },
  { label: 'Adobe Creative Cloud', price: '৳599', off: '-70%' },
  { label: 'Spotify Premium', price: '৳899',  off: '-60%' },
  { label: 'IDM Lifetime', price: '৳2,625',   off: '-75%' },
  { label: 'NordVPN 1 Year', price: '৳1,299', off: '-80%' },
  { label: 'ElevenLabs AI', price: '৳4,449',  off: '-55%' },
  { label: 'Windows 11 Home', price: '৳549',  off: '-93%' },
  { label: 'MS 365 Family', price: '৳4,999',  off: '-50%' },
];

const TickerBanner = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="ticker-wrap relative overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, hsl(220,18%,7%) 0%, hsl(220,15%,10%) 50%, hsl(220,18%,7%) 100%)',
        borderTop: '1px solid hsla(185,100%,50%,0.15)',
        borderBottom: '1px solid hsla(185,100%,50%,0.15)',
      }}>

      {/* Glow line top */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), var(--purple), var(--cyan), transparent)' }} />

      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(220,18%,7%), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(220,18%,7%), transparent)' }} />

      {/* Left indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 text-[9px]"
        style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)' }}>
        <Zap size={8} fill="currentColor" />
        <span>LIVE DEALS</span>
      </div>

      <div className="flex anim-ticker whitespace-nowrap py-2.5" style={{ paddingLeft: '120px' }}>
        {items.map((item, i) => (
          <span key={i} className="flex items-center flex-shrink-0">
            <span className="flex items-center gap-2 px-4 text-[11px]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <span className="text-foreground font-medium">{item.label}</span>
              <span className="font-bold" style={{ color: 'var(--cyan)' }}>{item.price}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ background: 'hsla(185,100%,50%,0.1)', color: 'var(--cyan)', border: '1px solid var(--cyan-border)' }}>
                {item.off}
              </span>
            </span>
            <span style={{ color: 'hsla(185,100%,50%,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>◈</span>
          </span>
        ))}
      </div>

      {/* Glow line bottom */}
      <div className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--purple), var(--cyan), var(--purple), transparent)' }} />
    </div>
  );
};

const FloatingButtons = () => <FloatingSupport />;

export { TickerBanner, FloatingButtons };
