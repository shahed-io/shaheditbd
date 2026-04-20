import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Copy, Check, Clock, Sparkles, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VISITOR_KEY = 'ss_visitor_id';
const WELCOME_SHOWN_KEY = 'ss_welcome_shown';
const PRODUCT_VISIT_KEY = 'ss_product_visited';

interface SpinPrize {
  id: string;
  label: string;
  type: 'percent' | 'fixed' | 'none';
  value: number;
  weight: number;
  color?: string;
}

interface SpinSettings {
  enabled: boolean;
  popup_title: string;
  popup_subtitle: string;
  spin_button_text: string;
  prizes: SpinPrize[];
}

interface WonCoupon {
  code: string;
  prizeLabel: string;
  discountType: 'percent' | 'fixed' | 'none';
  discountValue: number;
  expiresAt: string;
}

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

const FALLBACK_PRIZES: SpinPrize[] = [
  { id: '1', label: '5% OFF',   type: 'percent', value: 5,   weight: 1, color: '262 80% 60%' },
  { id: '2', label: '৳50 OFF',  type: 'fixed',   value: 50,  weight: 1, color: '24 95% 55%' },
  { id: '3', label: '10% OFF',  type: 'percent', value: 10,  weight: 1, color: '198 90% 55%' },
  { id: '4', label: '৳100 OFF', type: 'fixed',   value: 100, weight: 1, color: '142 75% 45%' },
  { id: '5', label: '15% OFF',  type: 'percent', value: 15,  weight: 1, color: '340 85% 60%' },
  { id: '6', label: '৳150 OFF', type: 'fixed',   value: 150, weight: 1, color: '47 95% 55%' },
  { id: '7', label: '20% OFF',  type: 'percent', value: 20,  weight: 1, color: '280 85% 55%' },
  { id: '8', label: 'Try Again',type: 'none',    value: 0,   weight: 1, color: '0 0% 60%' },
];

export default function WelcomeDiscount() {
  const [show, setShow] = useState(false);
  const [settings, setSettings] = useState<SpinSettings | null>(null);
  const [coupon, setCoupon] = useState<WonCoupon | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [noPrize, setNoPrize] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Load settings + check existing coupon
  const loadInitial = useCallback(async () => {
    if (sessionStorage.getItem(WELCOME_SHOWN_KEY) || localStorage.getItem(WELCOME_SHOWN_KEY)) return;

    const visitorId = getOrCreateVisitorId();
    try {
      const { data, error } = await supabase.functions.invoke('generate-welcome-coupon', {
        body: { visitorId, action: 'check' },
      });
      if (error || !data || data.disabled || data.error) return;

      // Already has unused coupon → show won-screen directly
      if (data.alreadyHas) {
        setCoupon({
          code: data.code,
          prizeLabel: data.prizeLabel || `${data.discount}% OFF`,
          discountType: data.discountType || 'percent',
          discountValue: data.discountType === 'fixed' ? data.discountAmount : data.discount,
          expiresAt: data.expiresAt,
        });
        setHasSpun(true);
        setShow(true);
        sessionStorage.setItem(WELCOME_SHOWN_KEY, '1');
        return;
      }

      // Already claimed (used/expired) → don't show
      if (data.alreadyClaimed) return;

      if (data.canSpin && data.settings) {
        const s: SpinSettings = {
          ...data.settings,
          prizes: Array.isArray(data.settings.prizes) && data.settings.prizes.length > 0
            ? data.settings.prizes
            : FALLBACK_PRIZES,
        };
        setSettings(s);
        setShow(true);
        sessionStorage.setItem(WELCOME_SHOWN_KEY, '1');
      }
    } catch { /* silent */ }
  }, []);

  // Trigger: random delay OR product page visit
  useEffect(() => {
    if (sessionStorage.getItem(WELCOME_SHOWN_KEY) || localStorage.getItem(WELCOME_SHOWN_KEY)) return;

    if (sessionStorage.getItem(PRODUCT_VISIT_KEY)) {
      const t = setTimeout(loadInitial, 3000);
      return () => clearTimeout(t);
    }

    const randomDelay = (Math.floor(Math.random() * 9) + 12) * 1000;
    const timer = setTimeout(loadInitial, randomDelay);
    const handler = () => {
      clearTimeout(timer);
      setTimeout(loadInitial, 2000);
    };
    window.addEventListener('ss:product-visited', handler, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('ss:product-visited', handler);
    };
  }, [loadInitial]);

  // Countdown timer
  useEffect(() => {
    if (!coupon) return;
    const update = () => {
      const diff = new Date(coupon.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('মেয়াদ শেষ');
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

  const handleSpin = async () => {
    if (spinning || hasSpun || !settings) return;
    setSpinning(true);

    const visitorId = getOrCreateVisitorId();
    try {
      const { data, error } = await supabase.functions.invoke('generate-welcome-coupon', {
        body: { visitorId, action: 'spin' },
      });

      if (error || !data || data.error) {
        toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন');
        setSpinning(false);
        return;
      }

      if (data.alreadyHas) {
        setCoupon({
          code: data.code,
          prizeLabel: data.prizeLabel || `${data.discount}% OFF`,
          discountType: data.discountType || 'percent',
          discountValue: data.discountType === 'fixed' ? data.discountAmount : data.discount,
          expiresAt: data.expiresAt,
        });
        setHasSpun(true);
        setSpinning(false);
        return;
      }

      const prizes = settings.prizes;
      const sliceAngle = 360 / prizes.length;
      const prizeIndex = Math.max(0, data.prizeIndex ?? 0);
      // Wheel rotation: align selected slice to TOP pointer (12 o'clock)
      // Each slice center sits at: prizeIndex * sliceAngle + sliceAngle/2 (measured CW from 0°/right)
      // We want that center to land at 270° (top). So rotate by: 270 - (center) + N*360 spins
      const sliceCenter = prizeIndex * sliceAngle + sliceAngle / 2;
      const targetRotation = 360 * 6 + (270 - sliceCenter);

      setRotation(targetRotation);

      // After animation, show result
      setTimeout(() => {
        setSpinning(false);
        setHasSpun(true);
        if (data.noCoupon) {
          setNoPrize(true);
        } else if (data.code) {
          setCoupon({
            code: data.code,
            prizeLabel: data.prizeLabel || data.prize?.label || 'OFF',
            discountType: data.discountType || 'percent',
            discountValue: data.discountType === 'fixed' ? data.discountAmount : data.discount,
            expiresAt: data.expiresAt,
          });
        }
      }, 4500);
    } catch {
      setSpinning(false);
      toast.error('সমস্যা হয়েছে');
    }
  };

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

  if (!show) return null;
  // Need either settings (to spin) or coupon (already won)
  if (!settings && !coupon) return null;

  const prizes = settings?.prizes || FALLBACK_PRIZES;
  const sliceAngle = 360 / prizes.length;
  const popupTitle = settings?.popup_title || '🎡 Lucky Spin!';
  const popupSubtitle = settings?.popup_subtitle || 'হুইল ঘুরিয়ে বিশেষ ছাড় জিতে নিন';
  const spinButtonText = settings?.spin_button_text || 'SPIN';

  // Build conic-gradient for wheel slices
  const conicStops = prizes.map((p, i) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    const color = `hsl(${p.color || '262 80% 60%'})`;
    return `${color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

      <div className="relative w-full max-w-[360px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Outer glow */}
        <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))] opacity-50 blur-xl animate-pulse" />

        <div className="relative rounded-[24px] overflow-hidden border border-white/20 shadow-2xl bg-background">
          {/* Top gradient header */}
          <div className="relative px-5 pt-5 pb-3 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(258,78%,45%)] to-[hsl(var(--accent))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />

            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-all hover:scale-110 hover:rotate-90 z-10"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>

            <h2 className="relative text-white text-lg font-bold text-center drop-shadow-md">
              {hasSpun && coupon ? '🎉 অভিনন্দন!' : hasSpun && noPrize ? '😅 দুঃখিত!' : popupTitle}
            </h2>
            <p className="relative text-white/85 text-xs text-center font-medium mt-0.5">
              {hasSpun && coupon ? 'আপনি জিতেছেন একটি বিশেষ কুপন' : hasSpun && noPrize ? 'এবার ভাগ্য সাথ দেয়নি' : popupSubtitle}
            </p>
          </div>

          {/* Wheel section (only before spinning OR while spinning) */}
          {!hasSpun && (
            <div className="relative px-5 pt-6 pb-5 bg-gradient-to-b from-[hsl(var(--primary)/0.05)] to-transparent">
              {/* Wheel */}
              <div className="relative mx-auto w-[260px] h-[260px]">
                {/* Pointer (top) */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[hsl(var(--destructive))] drop-shadow-lg" />
                </div>

                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-[6px] shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                  <div className="relative w-full h-full rounded-full bg-background p-[3px] overflow-hidden">
                    {/* Spinning wheel */}
                    <div
                      ref={wheelRef}
                      className="relative w-full h-full rounded-full overflow-hidden"
                      style={{
                        background: `conic-gradient(from 0deg, ${conicStops})`,
                        transform: `rotate(${rotation}deg)`,
                        transition: spinning ? 'transform 4.3s cubic-bezier(0.17, 0.67, 0.21, 0.99)' : 'none',
                      }}
                    >
                      {/* Slice labels */}
                      {prizes.map((p, i) => {
                        const angle = i * sliceAngle + sliceAngle / 2;
                        return (
                          <div
                            key={p.id}
                            className="absolute top-1/2 left-1/2 origin-left text-white font-bold text-[11px] whitespace-nowrap drop-shadow-md pointer-events-none"
                            style={{
                              transform: `rotate(${angle}deg) translateX(28px)`,
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            }}
                          >
                            {p.label}
                          </div>
                        );
                      })}

                      {/* Slice dividers */}
                      {prizes.map((_, i) => (
                        <div
                          key={`d${i}`}
                          className="absolute top-1/2 left-1/2 w-[130px] h-[1px] bg-white/30 origin-left"
                          style={{ transform: `rotate(${i * sliceAngle}deg)` }}
                        />
                      ))}
                    </div>

                    {/* Center hub with SPIN button */}
                    <button
                      onClick={handleSpin}
                      disabled={spinning}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-white via-white to-[hsl(var(--accent)/0.1)] border-[3px] border-[hsl(var(--primary))] shadow-[0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-center font-black text-[hsl(var(--primary))] text-sm hover:scale-105 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-90"
                    >
                      {spinning ? (
                        <div className="w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        spinButtonText
                      )}
                    </button>
                  </div>
                </div>

                {/* Decorative dots around wheel */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`dot${i}`}
                    className="absolute w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] shadow-md"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${i * 30}deg) translateY(-138px)`,
                    }}
                  />
                ))}
              </div>

              <p className="text-center text-[11px] text-muted-foreground mt-4 font-medium">
                {spinning ? '✨ ভাগ্য পরীক্ষা করা হচ্ছে...' : '👇 SPIN বাটনে ক্লিক করে শুরু করুন'}
              </p>
            </div>
          )}

          {/* Won coupon view */}
          {hasSpun && coupon && (
            <div className="relative px-5 pt-5 pb-5">
              {/* Prize badge */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent)/0.12)] border border-[hsl(var(--accent)/0.2)] mb-2">
                  <Sparkles className="w-3 h-3 text-[hsl(var(--accent))]" />
                  <span className="text-[10px] font-bold text-[hsl(var(--accent))] uppercase tracking-wide">আপনি জিতেছেন</span>
                </div>
                <div className="relative inline-block">
                  <span className="text-4xl font-black bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(258,78%,50%)] to-[hsl(var(--accent))] bg-clip-text text-transparent leading-none">
                    {coupon.prizeLabel}
                  </span>
                  <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.08)] blur-2xl rounded-full -z-10" />
                </div>
                <p className="text-muted-foreground text-xs mt-1.5 font-medium">
                  {coupon.discountType === 'fixed'
                    ? `৳${coupon.discountValue} ছাড় যেকোনো অর্ডারে`
                    : 'ডিসকাউন্ট যেকোনো প্রোডাক্টে'}
                </p>
              </div>

              {/* Coupon code */}
              <button
                onClick={handleCopy}
                className="w-full group relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))] opacity-70" style={{ backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />
                <div className="absolute inset-[1.5px] rounded-[14.5px] bg-background" />

                <div className="relative flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-background" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-background" />
                  <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-t border-dashed border-[hsl(var(--primary)/0.15)]" />

                  <span className="relative font-mono text-[15px] font-extrabold tracking-[0.15em] bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(258,78%,50%)] bg-clip-text text-transparent whitespace-nowrap">
                    {coupon.code}
                  </span>
                  <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                    copied
                      ? 'bg-green-500/15 text-green-600'
                      : 'bg-gradient-to-r from-[hsl(var(--primary)/0.1)] to-[hsl(var(--accent)/0.1)] text-[hsl(var(--primary))]'
                  }`}>
                    {copied ? <><Check className="w-3.5 h-3.5" /><span className="text-[11px] font-bold">কপি!</span></>
                            : <><Copy className="w-3.5 h-3.5" /><span className="text-[11px] font-bold">কপি</span></>}
                  </div>
                </div>
              </button>

              {/* Timer */}
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                  <Clock className="w-3.5 h-3.5 text-destructive animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium">মেয়াদ শেষ হবে:</span>
                  <span className="font-mono font-bold text-destructive text-xs tabular-nums">{timeLeft}</span>
                </div>
              </div>

              <p className="text-center text-[10px] text-muted-foreground/70 mt-3 font-medium">
                ✨ চেকআউটে এই কোডটি ব্যবহার করুন
              </p>
            </div>
          )}

          {/* "Try Again" / no prize view */}
          {hasSpun && noPrize && (
            <div className="relative px-5 pt-5 pb-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                <Gift className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground text-sm font-semibold mb-1">এবার আপনি কোনো পুরস্কার পাননি</p>
              <p className="text-muted-foreground text-xs">পরবর্তী অফারের জন্য অপেক্ষা করুন। ভালো অফার আসছে!</p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white text-sm font-semibold shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                ঠিক আছে
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
