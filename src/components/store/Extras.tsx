import { useState } from 'react';
import { MessageCircle, Ticket } from 'lucide-react';
import { AIChatWidget } from './AIChatWidget';
import { SupportTicketModal } from './SupportTicketModal';

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
    <div className="bg-primary/10 border-y border-primary/20 py-3 overflow-hidden relative">
      <div className="flex gap-12 animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="text-sm font-medium text-foreground flex-shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const FloatingButtons = () => {
  const [ticketOpen, setTicketOpen] = useState(false);

  return (
    <>
      {/* WhatsApp */}
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

      {/* Support Ticket Button */}
      <button
        onClick={() => setTicketOpen(true)}
        className="fixed bottom-6 right-48 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 bg-secondary border border-border"
        title="সাপোর্ট টিকেট"
      >
        <Ticket size={22} className="text-foreground" />
      </button>

      {/* AI Chat */}
      <AIChatWidget />

      {/* Support Ticket Modal */}
      <SupportTicketModal open={ticketOpen} onClose={() => setTicketOpen(false)} />
    </>
  );
};

// Keep backward compat
const WhatsAppButton = () => null;

export { TickerBanner, WhatsAppButton, FloatingButtons };
