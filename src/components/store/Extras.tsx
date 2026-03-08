import { FloatingSupport } from './FloatingSupport';

const tickerItems = [
  '🔥 Windows 11 Pro — ৳599 (94% OFF)',
  '⚡ Office 365 Personal — ৳1,999 (88% OFF)',
  '🎬 Netflix Subscription — ৳499 (81% OFF)',
  '🎨 Adobe Creative Cloud — ৳599 (70% OFF)',
  '🎵 Spotify Premium — ৳899 (85% OFF)',
  '💻 IDM Lifetime — ৳2,625 (20% OFF)',
  '🤖 ElevenLabs AI — ৳4,449 (63% OFF)',
  '🪟 Windows 11 Home — ৳549 (93% OFF)',
  '🔒 NordVPN 1 Year — ৳1,299 (72% OFF)',
  '📊 Microsoft 365 — ৳2,499 (84% OFF)',
];

const TickerBanner = () => {
  const items = [...tickerItems, ...tickerItems];

  return (
    <div
      className="py-2.5 overflow-hidden relative"
      style={{
        background: 'hsla(180,100%,42%,0.05)',
        borderTop: '1px solid hsla(180,100%,42%,0.1)',
        borderBottom: '1px solid hsla(180,100%,42%,0.1)',
      }}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(230,30%,5%), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(230,30%,5%), transparent)' }} />

      <div className="flex gap-14 animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="text-xs font-medium flex-shrink-0 flex items-center gap-2"
            style={{ color: 'hsl(var(--muted-foreground))' }}>
            {item}
            {i < items.length - 1 && <span style={{ color: 'hsla(180,100%,42%,0.4)' }}>◆</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

const FloatingButtons = () => <FloatingSupport />;

export { TickerBanner, FloatingButtons };
