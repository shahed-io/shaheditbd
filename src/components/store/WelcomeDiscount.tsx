import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Gift, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VISITOR_KEY = 'ss_visitor_id';
const WELCOME_SHOWN_KEY = 'ss_welcome_shown';
const PRODUCT_VISIT_KEY = 'ss_product_visited';

interface WelcomeSettings {
  enabled: boolean;
  delay_seconds: number;
  popup_title: string;
  popup_subtitle: string;
}

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
  const [popupTitle, setPopupTitle] = useState('🎉 স্বাগতম!');
  const [popupSubtitle, setPopupSubtitle] = useState('আপনার জন্য বিশেষ ডিসকাউন্ট');
  const [ready, setReady] = useState(false);

  const fetchCoupon = useCallback(async () => {
    if (sessionStorage.getItem(WELCOME_SHOWN_KEY)) return;
    if (localStorage.getItem(WELCOME_SHOWN_KEY)) return;

    try {
      const { data: settingsRow } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'welcome_discount_config')
        .single();

      if (settingsRow?.value) {
        const cfg: WelcomeSettings = JSON.parse(settingsRow.value);
        if (!cfg.enabled) return;
        if (cfg.popup_title) setPopupTitle(cfg.popup_title);
        if (cfg.popup_subtitle) setPopupSubtitle(cfg.popup_subtitle);
      }
    } catch {
      // Use defaults
    }

    const visitorId = getOrCreateVisitorId();

    try {
      const { data, error } = await supabase.functions.invoke('generate-welcome-coupon', {
        body: { visitorId },
      });

      if (error || !data || data.alreadyClaimed || data.error || data.disabled) return;

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

  // Trigger: random 10-20s delay OR product page visit (whichever comes first)
  useEffect(() => {
    if (sessionStorage.getItem(WELCOME_SHOWN_KEY) || localStorage.getItem(WELCOME_SHOWN_KEY)) return;

    // If user already visited a product page, show with short delay
    if (sessionStorage.getItem(PRODUCT_VISIT_KEY)) {
      const t = setTimeout(fetchCoupon, 3000);
      return () => clearTimeout(t);
    }

    // Random delay between 12-20 seconds to avoid competing with initial loads
    const randomDelay = (Math.floor(Math.random() * 9) + 12) * 1000;
    const timer = setTimeout(fetchCoupon, randomDelay);

    // Also listen for product visit event
    const handler = () => {
      clearTimeout(timer);
      setTimeout(fetchCoupon, 2000);
    };
    window.addEventListener('ss:product-visited', handler, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('ss:product-visited', handler);
    };
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose} />

      {/* Main Card */}
      <div className="relative w-full max-w-[340px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Outer glow */}
        <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))] opacity-50 blur-xl animate-pulse" />
        
        {/* Card body */}
        <div className="relative rounded-[24px] overflow-hidden border border-white/20 shadow-2xl">
          
          {/* ═══ Top Gradient Section ═══ */}
          <div className="relative px-5 pt-6 pb-9 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(258,78%,45%)] to-[hsl(var(--accent))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
            
            {/* Floating particles */}
            <div className="absolute top-4 left-8 w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
            <div className="absolute top-10 right-10 w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
            <div className="absolute bottom-6 left-14 w-1 h-1 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-all duration-300 hover:scale-110 hover:rotate-90 z-10"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Gift icon with glow */}
            <div className="relative w-14 h-14 mx-auto mb-3">
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-lg animate-pulse" />
              <div className="relative w-full h-full rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                <Gift className="w-7 h-7 text-white drop-shadow-lg" />
                <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[hsl(var(--accent))] animate-pulse" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-white text-lg font-bold text-center mb-0.5 drop-shadow-md">
              {popupTitle}
            </h2>
            <p className="text-white/80 text-xs text-center font-medium">
              {popupSubtitle}
            </p>
          </div>

          {/* ═══ Bottom Glass Section ═══ */}
          <div className="relative -mt-4 rounded-t-[20px] overflow-hidden">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.03)] to-transparent" />
            
            <div className="relative px-5 pt-6 pb-5">
              {/* Discount badge */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent)/0.12)] border border-[hsl(var(--accent)/0.2)] mb-2">
                  <Sparkles className="w-3 h-3 text-[hsl(var(--accent))]" />
                  <span className="text-[10px] font-bold text-[hsl(var(--accent))] uppercase tracking-wide">সীমিত অফার</span>
                </div>
                <div className="relative">
                  <span className="text-5xl font-black bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(258,78%,50%)] to-[hsl(var(--accent))] bg-clip-text text-transparent leading-none">
                    {coupon.discount}%
                  </span>
                  <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.08)] blur-2xl rounded-full -z-10" />
                </div>
                <p className="text-muted-foreground text-xs mt-1.5 font-medium">ডিসকাউন্ট যেকোনো প্রোডাক্টে</p>
              </div>

              {/* Coupon code card — single line */}
              <button
                onClick={handleCopy}
                className="w-full group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(var(--primary)/0.35)] via-[hsl(var(--accent)/0.35)] to-[hsl(var(--primary)/0.35)] p-[1.5px]">
                  <div className="w-full h-full rounded-[10.5px] bg-background" />
                </div>
                
                <div className="relative flex items-center justify-between gap-2 px-4 py-3">
                  <div className="absolute inset-0 bg-[hsl(var(--primary)/0.02)]" />
                  {/* Ticket cutouts */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-background border border-border" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-background border border-border" />
                  
                  <span className="relative font-mono text-[15px] font-bold tracking-[0.12em] text-foreground whitespace-nowrap">
                    {coupon.code}
                  </span>
                  <div className={`relative flex items-center gap-1 px-2.5 py-1 rounded-md transition-all duration-300 shrink-0 ${
                    copied 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary)/0.15)]'
                  }`}>
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">কপি!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">কপি</span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              {/* Timer */}
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/8 border border-destructive/15">
                  <Clock className="w-3.5 h-3.5 text-destructive animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium">মেয়াদ শেষ হবে:</span>
                  <span className="font-mono font-bold text-destructive text-xs tabular-nums">{timeLeft}</span>
                </div>
              </div>

              {/* Footer hint */}
              <p className="text-center text-[10px] text-muted-foreground/60 mt-3 font-medium">
                ✨ চেকআউটে কুপন কোড ব্যবহার করুন
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
