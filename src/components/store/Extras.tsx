import { FloatingSupport } from './FloatingSupport';

const TICKER_ITEMS = [
  'Windows 11 Pro — ৳599',
  'Office 365 Personal — ৳1,999',
  'Netflix Premium — ৳499',
  'Adobe Creative Cloud — ৳599',
  'Spotify Premium — ৳899',
  'IDM Lifetime — ৳2,625',
  'NordVPN 1 Year — ৳1,299',
  'ElevenLabs AI — ৳4,449',
  'Windows 11 Home — ৳549',
  'Microsoft 365 Family — ৳4,999',
];

const TickerBanner = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="ticker-wrap py-2.5 overflow-hidden relative" style={{ backgroundColor: 'var(--gold)' }}>
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--gold), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--gold), transparent)' }} />

      <div className="flex gap-0 anim-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center flex-shrink-0 text-xs font-bold"
            style={{ color: 'hsl(0,0%,5%)', fontFamily: 'Syne, sans-serif' }}>
            <span className="px-6">{item}</span>
            <span className="opacity-40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const FloatingButtons = () => <FloatingSupport />;

export { TickerBanner, FloatingButtons };
