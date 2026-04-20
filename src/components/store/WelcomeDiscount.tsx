import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Copy, Check, Clock, ShieldCheck, Tag, BadgePercent } from 'lucide-react';
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

// Professional palette — muted, brand-aligned (no neon casino colors)
const FALLBACK_PRIZES: SpinPrize[] = [
  { id: 'p1', label: '৳100 OFF', type: 'fixed',   value: 100, weight: 500, color: '258 60% 55%' },
  { id: 'p2', label: '5% OFF',   type: 'percent', value: 5,   weight: 200, color: '258 35% 92%' },
  { id: 'p3', label: '8% OFF',   type: 'percent', value: 8,   weight: 150, color: '258 55% 65%' },
  { id: 'p4', label: '10% OFF',  type: 'percent', value: 10,  weight: 90,  color: '258 35% 88%' },
  { id: 'p5', label: '12% OFF',  type: 'percent', value: 12,  weight: 50,  color: '258 50% 60%' },
  { id: 'p6', label: '20% OFF',  type: 'percent', value: 20,  weight: 5,   color: '258 70% 50%' },
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

  const loadInitial = useCallback(async () => {
    if (sessionStorage.getItem(WELCOME_SHOWN_KEY) || localStorage.getItem(WELCOME_SHOWN_KEY)) return;

    const visitorId = getOrCreateVisitorId();
    try {
      const { data, error } = await supabase.functions.invoke('generate-welcome-coupon', {
        body: { visitorId, action: 'check' },
      });
      if (error || !data || data.disabled || data.error) return;

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

  // Trigger: show 5–10 seconds after landing
  useEffect(() => {
    if (sessionStorage.getItem(WELCOME_SHOWN_KEY) || localStorage.getItem(WELCOME_SHOWN_KEY)) return;

    if (sessionStorage.getItem(PRODUCT_VISIT_KEY)) {
      const t = setTimeout(loadInitial, 3000);
      return () => clearTimeout(t);
    }

    const randomDelay = (Math.floor(Math.random() * 6) + 5) * 1000;
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
      if (diff <= 0) { setTimeLeft('Expired'); return; }
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
        toast.error('একটি সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন');
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
      const sliceCenter = prizeIndex * sliceAngle + sliceAngle / 2;
      const targetRotation = 360 * 5 + (270 - sliceCenter);

      setRotation(targetRotation);

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
      toast.error('একটি সমস্যা হয়েছে');
    }
  };

  const handleCopy = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('কুপন কোডটি কপি হয়েছে');
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
  if (!settings && !coupon) return null;

  const prizes = settings?.prizes || FALLBACK_PRIZES;
  const sliceAngle = 360 / prizes.length;
  const popupTitle = settings?.popup_title || 'আপনার Welcome Gift প্রস্তুত';
  const popupSubtitle = settings?.popup_subtitle || 'Shahed Store-এ স্বাগতম! শুধুমাত্র নতুন ভিজিটরদের জন্য একটি গ্যারান্টিড ছাড় — মাত্র একবার দাবি করা যাবে।';
  const spinButtonText = settings?.spin_button_text || 'CLAIM';

  // Professional muted gradient slices
  const conicStops = prizes.map((p, i) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    const color = `hsl(${p.color || '258 50% 60%'})`;
    return `${color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />

      <div className="relative w-full max-w-[380px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] bg-card">
          {/* Header — minimal, professional */}
          <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                <BadgePercent className="w-4 h-4 text-[hsl(var(--primary))]" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[hsl(var(--primary))]">
                🎁 New Customer Welcome Gift
              </span>
            </div>

            <h2 className="text-foreground text-lg font-semibold leading-tight">
              {hasSpun && coupon ? '🎉 অভিনন্দন! আপনার ছাড় কোড প্রস্তুত' : hasSpun && noPrize ? 'এই মুহূর্তে কোনো পুরস্কার নেই' : popupTitle}
            </h2>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              {hasSpun && coupon
                ? 'নিচের কোডটি কপি করে চেকআউটে ব্যবহার করুন — মেয়াদ শেষ হওয়ার আগেই অর্ডার সম্পন্ন করুন।'
                : hasSpun && noPrize
                ? 'পরবর্তী ক্যাম্পেইনে আবার চেষ্টা করুন'
                : popupSubtitle}
            </p>
            {!hasSpun && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>100% Guaranteed Win • Free • No Card Required</span>
              </div>
            )}
          </div>

          {/* Wheel */}
          {!hasSpun && (
            <div className="relative px-6 pt-6 pb-5">
              <div className="relative mx-auto w-[260px] h-[260px]">
                {/* Top pointer — minimal triangle */}
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-[hsl(var(--primary))]" />
                </div>

                {/* Outer ring — subtle */}
                <div className="absolute inset-0 rounded-full bg-border p-[2px]">
                  <div className="relative w-full h-full rounded-full bg-card p-[3px] overflow-hidden">
                    <div
                      ref={wheelRef}
                      className="relative w-full h-full rounded-full overflow-hidden"
                      style={{
                        background: `conic-gradient(from 0deg, ${conicStops})`,
                        transform: `rotate(${rotation}deg)`,
                        transition: spinning ? 'transform 4.3s cubic-bezier(0.17, 0.67, 0.21, 0.99)' : 'none',
                      }}
                    >
                      {prizes.map((p, i) => {
                        const angle = i * sliceAngle + sliceAngle / 2;
                        const isLight = (p.color || '').includes('92%') || (p.color || '').includes('88%');
                        return (
                          <div
                            key={p.id}
                            className={`absolute top-1/2 left-1/2 origin-left font-semibold text-[11px] whitespace-nowrap pointer-events-none ${isLight ? 'text-foreground' : 'text-white'}`}
                            style={{ transform: `rotate(${angle}deg) translateX(36px)` }}
                          >
                            {p.label}
                          </div>
                        );
                      })}

                      {prizes.map((_, i) => (
                        <div
                          key={`d${i}`}
                          className="absolute top-1/2 left-1/2 w-[130px] h-[1px] bg-white/40 origin-left"
                          style={{ transform: `rotate(${i * sliceAngle}deg)` }}
                        />
                      ))}
                    </div>

                    {/* Center claim button */}
                    <button
                      onClick={handleSpin}
                      disabled={spinning}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[68px] h-[68px] rounded-full bg-card border-[3px] border-[hsl(var(--primary))] shadow-md flex items-center justify-center font-bold text-[hsl(var(--primary))] text-xs tracking-wide hover:bg-[hsl(var(--primary)/0.05)] active:scale-95 transition-all disabled:cursor-not-allowed"
                    >
                      {spinning ? (
                        <div className="w-5 h-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        spinButtonText
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-5">
                {spinning ? 'আপনার পুরস্কার নির্ধারণ করা হচ্ছে...' : 'CLAIM-এ ক্লিক করে আপনার গ্যারান্টিড ছাড়টি Unlock করুন'}
              </p>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Offer</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  <span>One-Time Use</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Limited Time</span>
                </div>
              </div>
            </div>
          )}

          {/* Won view — professional voucher */}
          {hasSpun && coupon && (
            <div className="relative px-6 pt-6 pb-6">
              {/* Discount value display */}
              <div className="text-center mb-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">
                  Your Welcome Reward
                </p>
                <div className="text-4xl font-bold text-foreground tracking-tight">
                  {coupon.prizeLabel}
                </div>
                <p className="text-muted-foreground text-xs mt-1.5">
                  {coupon.discountType === 'fixed'
                    ? `যেকোনো অর্ডারে ৳${coupon.discountValue} সাশ্রয় করুন`
                    : `যেকোনো প্রোডাক্টে ${coupon.discountValue}% ছাড়`}
                </p>
              </div>

              {/* Voucher code card */}
              <div className="relative rounded-xl border-2 border-dashed border-border bg-muted/30 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Coupon Code
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-base font-bold text-foreground tracking-[0.15em] truncate">
                    {coupon.code}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      copied
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
                    }`}
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                </div>
              </div>

              {/* Validity */}
              <div className="flex items-center justify-between mt-4 px-1">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>মেয়াদ শেষ হবে</span>
                </div>
                <span className="font-mono font-semibold text-[hsl(var(--primary))] text-sm tabular-nums">
                  {timeLeft}
                </span>
              </div>

              {/* CTA */}
              <button
                onClick={handleClose}
                className="mt-5 w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                এখনই কেনাকাটা শুরু করুন
              </button>

              <p className="text-center text-[10px] text-muted-foreground/80 mt-3">
                চেকআউট পেজে কুপন কোডটি প্রবেশ করিয়ে ছাড় উপভোগ করুন
              </p>
            </div>
          )}

          {/* No prize view */}
          {hasSpun && noPrize && (
            <div className="relative px-6 pt-6 pb-6 text-center">
              <p className="text-foreground text-sm font-medium mb-1">
                এই মুহূর্তে আপনার জন্য কোনো ছাড় উপলব্ধ নেই
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                আমাদের পরবর্তী প্রমোশনাল ক্যাম্পেইনের জন্য অনুগ্রহ করে অপেক্ষা করুন।
              </p>
              <button
                onClick={handleClose}
                className="mt-5 w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                বুঝেছি
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
