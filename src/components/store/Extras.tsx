import { MessageCircle, Zap } from 'lucide-react';

const tickerItems = [
  'Windows 11 Pro — ৳599',
  'Office 365 Personal — ৳1,999',
  'Netflix Subscription — ৳499',
  'Adobe Creative Cloud — ৳599',
  'Spotify Premium — ৳899',
  'IDM Lifetime — ৳2,625',
  'ElevenLabs AI — ৳4,449',
  'Windows 11 Home — ৳549',
];

const TickerBanner = () => {
  const items = [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div className="relative overflow-hidden" style={{ height: '28px' }}>
      {/* Gradient bg strip */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(90deg, hsl(var(--primary)/0.08) 0%, hsl(var(--primary)/0.15) 50%, hsl(var(--primary)/0.08) 100%)',
        borderTop: '1px solid hsl(var(--primary)/0.2)',
        borderBottom: '1px solid hsl(var(--primary)/0.2)',
      }} />

      {/* Edge fades */}
      <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(var(--background)) 0%, transparent 100%)' }} />
      <div className="absolute right-0 top-0 h-full w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%)' }} />

      {/* Live badge */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[9px] font-bold text-primary tracking-widest uppercase">LIVE</span>
      </div>

      {/* Scrolling content */}
      <div className="absolute inset-0 flex items-center pl-16">
        <div
          style={{
            display: 'flex',
            width: 'max-content',
            animation: 'ticker-seamless 45s linear infinite',
            willChange: 'transform',
          }}
        >
          {items.map((item, i) => (
            <span key={i} className="flex items-center" style={{ paddingRight: '2.5rem' }}>
              <Zap size={9} className="text-primary mr-1.5 flex-shrink-0" style={{ opacity: 0.7 }} />
              <span className="text-[11px] font-medium whitespace-nowrap"
                style={{ color: 'hsl(var(--foreground)/0.75)', letterSpacing: '0.02em' }}>
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const WhatsAppButton = () => (
  <a
    href="https://wa.me/8801840099853"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 animate-pulse-glow"
    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
    title="Chat on WhatsApp"
  >
    <MessageCircle size={26} className="text-white" />
  </a>
);

export { TickerBanner, WhatsAppButton };
