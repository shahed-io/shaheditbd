import { FloatingSupport } from './FloatingSupport';

const tickerItems = [
  '🔥 Windows 11 Pro - ৳599 (94% OFF)',
  '⚡ Office 365 Personal - ৳1,999 (88% OFF)',
  '🎬 Netflix Subscription - ৳499 (81% OFF)',
  '🎨 Adobe Creative Cloud - ৳599 (70% OFF)',
  '🎵 Spotify Premium - ৳899 (85% OFF)',
  '💻 IDM Lifetime - ৳2,625 (20% OFF)',
  '🤖 ElevenLabs AI - ৳4,449 (63% OFF)',
  '🪟 Windows 11 Home - ৳549 (93% OFF)',
];

const TickerBanner = () => {
  const items = [...tickerItems, ...tickerItems];

  return (
    <div className="border-b border-primary/30 py-1 overflow-hidden relative" style={{ background: 'hsla(199,100%,10%,0.6)' }}>
      <div className="flex gap-10 animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="text-[11px] font-medium text-foreground/70 flex-shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const FloatingButtons = () => {
  return <FloatingSupport />;
};

export { TickerBanner, FloatingButtons };
