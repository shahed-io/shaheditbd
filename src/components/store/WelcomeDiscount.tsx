import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Gift, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VISITOR_KEY = 'ss_visitor_id';
const WELCOME_SHOWN_KEY = 'ss_welcome_shown';

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export default function WelcomeDiscount() {
  const [show, setShow] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const fetchCoupon = useCallback(async () => {
    // Already shown this session or previously claimed
    if (sessionStorage.getItem(WELCOME_SHOWN_KEY)) return;
    if (localStorage.getItem(WELCOME_SHOWN_KEY)) return;

    const visitorId = getOrCreateVisitorId();

    try {
      const { data, error } = await supabase.functions.invoke('generate-welcome-coupon', {
        body: { visitorId },
      });

      if (error || !data || data.alreadyClaimed || data.error) return;

      setCoupon({
        code: data.code,
        discount: data.discount,
        expiresAt: data.expiresAt,
      });
      setShow(true);
      sessionStorage.setItem(WELCOME_SHOWN_KEY, '1');
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchCoupon, 3000);
    return () => clearTimeout(timer);
  }, [fetchCoupon]);

  // Countdown timer
  useEffect(() => {
    if (!coupon) return;

    const update = () => {
      const diff = new Date(coupon.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('মেয়াদ শেষ');
        setShow(false);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [coupon]);

  const handleCopy = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('কুপন কোড কপি হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('কপি করা যায়নি');
    }
  };

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, '1');
  };

  if (!show || !coupon) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        {/* Gradient top */}
        <div className="bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.85)] to-[hsl(270,70%,50%)] p-6 pb-8 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-white text-xl font-bold mb-1">🎉 স্বাগতম!</h2>
          <p className="text-white/90 text-sm">আপনার জন্য বিশেষ ডিসকাউন্ট</p>
        </div>

        {/* Content */}
        <div className="bg-background p-6 -mt-4 rounded-t-3xl relative">
          {/* Discount badge */}
          <div className="text-center mb-4">
            <span className="text-5xl font-extrabold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(270,70%,50%)] bg-clip-text text-transparent">
              {coupon.discount}%
            </span>
            <p className="text-muted-foreground text-sm mt-1">ডিসকাউন্ট যেকোনো প্রোডাক্টে</p>
          </div>

          {/* Coupon code */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.05)] hover:bg-[hsl(var(--primary)/0.1)] transition-colors group"
          >
            <span className="font-mono text-lg font-bold tracking-wider text-foreground">
              {coupon.code}
            </span>
            {copied ? (
              <Check className="w-5 h-5 text-green-500 shrink-0" />
            ) : (
              <Copy className="w-5 h-5 text-muted-foreground group-hover:text-[hsl(var(--primary))] shrink-0 transition-colors" />
            )}
          </button>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            <Clock className="w-4 h-4 text-red-500" />
            <span className="text-muted-foreground">মেয়াদ শেষ হবে:</span>
            <span className="font-mono font-bold text-red-500">{timeLeft}</span>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            চেকআউটে কুপন কোড ব্যবহার করুন
          </p>
        </div>
      </div>
    </div>
  );
}
