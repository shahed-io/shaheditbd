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
    <div className="py-2 overflow-hidden relative bg-card/50 border-y border-border/30">
      <div className="flex gap-12 animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="text-xs font-medium text-muted-foreground flex-shrink-0">
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
