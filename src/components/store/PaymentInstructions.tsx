import { useState } from 'react';
import { Copy, CheckCheck, AlertCircle, Smartphone, CreditCard, Store } from 'lucide-react';
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';

type PMId = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bkash_merchant';

interface PMConfig {
  id: PMId;
  label: string;
  number: string;
  type: 'Send Money' | 'Merchant Payment';
  logo: string;
  accentColor: string;
  bgColor: string;
  steps: string[];
  warning?: string;
}

const PM_CONFIGS: Record<PMId, PMConfig> = {
  bkash: {
    id: 'bkash',
    label: 'bKash',
    number: '01820060046',
    type: 'Send Money',
    logo: bkashLogo,
    accentColor: 'hsl(338,90%,48%)',
    bgColor: 'hsla(338,90%,48%,0.07)',
    steps: [
      'আপনার bKash অ্যাপ বা *247# ডায়াল করুন',
      '"Send Money" অপশনটি সিলেক্ট করুন',
      'নম্বর বক্সে উপরের নম্বরটি পেস্ট করুন',
      'পরিমাণ লিখুন ও PIN দিয়ে কনফার্ম করুন',
      'Transaction ID (TrxID) কপি করুন',
      'নিচের বক্সে TrxID পেস্ট করে অর্ডার সম্পন্ন করুন',
    ],
    warning: 'বিঃদ্রঃ অবশ্যই "Send Money" করবেন, "Payment" নয়।',
  },
  nagad: {
    id: 'nagad',
    label: 'Nagad',
    number: '01840099853',
    type: 'Send Money',
    logo: nagadLogo,
    accentColor: 'hsl(22,100%,48%)',
    bgColor: 'hsla(22,100%,48%,0.07)',
    steps: [
      'আপনার নগদ অ্যাপ বা *167# ডায়াল করুন',
      '"Send Money" অপশনটি সিলেক্ট করুন',
      'নম্বর বক্সে উপরের নম্বরটি পেস্ট করুন',
      'পরিমাণ লিখুন ও PIN দিয়ে কনফার্ম করুন',
      'Transaction ID কপি করুন',
      'নিচের বক্সে TrxID পেস্ট করে অর্ডার সম্পন্ন করুন',
    ],
  },
  rocket: {
    id: 'rocket',
    label: 'Rocket',
    number: '01840099853',
    type: 'Send Money',
    logo: rocketLogo,
    accentColor: 'hsl(270,80%,48%)',
    bgColor: 'hsla(270,80%,48%,0.07)',
    steps: [
      'আপনার Rocket অ্যাপ বা *322# ডায়াল করুন',
      '"Send Money" অপশনটি সিলেক্ট করুন',
      'নম্বর বক্সে উপরের নম্বরটি পেস্ট করুন',
      'পরিমাণ লিখুন ও PIN দিয়ে কনফার্ম করুন',
      'Transaction ID কপি করুন',
      'নিচের বক্সে TrxID পেস্ট করে অর্ডার সম্পন্ন করুন',
    ],
    warning: 'Rocket নম্বরের শেষে একটি অতিরিক্ত ডিজিট থাকতে পারে।',
  },
  upay: {
    id: 'upay',
    label: 'উপায় (Upay)',
    number: '01840099853',
    type: 'Send Money',
    logo: upayLogo,
    accentColor: 'hsl(142,70%,38%)',
    bgColor: 'hsla(142,70%,38%,0.07)',
    steps: [
      'আপনার Upay অ্যাপ ওপেন করুন',
      '"Send Money" অপশনটি সিলেক্ট করুন',
      'নম্বর বক্সে উপরের নম্বরটি পেস্ট করুন',
      'পরিমাণ লিখুন ও PIN দিয়ে কনফার্ম করুন',
      'Transaction ID কপি করুন',
      'নিচের বক্সে TrxID পেস্ট করে অর্ডার সম্পন্ন করুন',
    ],
  },
  bkash_merchant: {
    id: 'bkash_merchant',
    label: 'bKash Merchant',
    number: '01840099853',
    type: 'Merchant Payment',
    logo: bkashMerchantLogo,
    accentColor: 'hsl(338,85%,42%)',
    bgColor: 'hsla(338,85%,42%,0.07)',
    steps: [
      'আপনার bKash অ্যাপ বা *247# ডায়াল করুন',
      '"Payment" অপশনটি সিলেক্ট করুন',
      'Merchant নম্বর বক্সে উপরের নম্বরটি পেস্ট করুন',
      'পরিমাণ লিখুন ও PIN দিয়ে কনফার্ম করুন',
      'Transaction ID (TrxID) কপি করুন',
      'নিচের বক্সে TrxID পেস্ট করে অর্ডার সম্পন্ন করুন',
    ],
    warning: 'Merchant Payment-এ কোনো চার্জ নেই — আপনি যা পাঠাবেন তাই পাবেন।',
  },
};

interface Props {
  paymentMethodId: PMId;
  amount: number;
  /** label shown for the amount, e.g. "মোট পরিমাণ" */
  amountLabel?: string;
}

const PaymentInstructions = ({ paymentMethodId, amount, amountLabel = 'মোট পরিমাণ' }: Props) => {
  const cfg = PM_CONFIGS[paymentMethodId];
  const [copied, setCopied] = useState(false);

  const copyNumber = () => {
    navigator.clipboard.writeText(cfg.number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: `${cfg.accentColor}35`,
        background: cfg.bgColor,
      }}
    >
      {/* ── Header strip ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: `${cfg.accentColor}25`, background: `${cfg.accentColor}12` }}
      >
        <img src={cfg.logo} alt={cfg.label} className="h-8 w-auto object-contain rounded-md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{cfg.label}</p>
          <p className="text-[11px] text-muted-foreground font-medium">{cfg.type}</p>
        </div>
        <div
          className="text-right px-3 py-1.5 rounded-xl"
          style={{ background: `${cfg.accentColor}18`, border: `1px solid ${cfg.accentColor}30` }}
        >
          <p className="text-[10px] text-muted-foreground font-medium">{amountLabel}</p>
          <p className="text-base font-black" style={{ color: cfg.accentColor }}>৳{amount.toLocaleString()}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── Copyable Number ── */}
        <div className="text-center space-y-2">
          <p className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">
            {cfg.type === 'Merchant Payment' ? 'Merchant নম্বর' : 'Send Money নম্বর'}
          </p>
          <button
            type="button"
            onClick={copyNumber}
            className="group w-full flex items-center justify-between gap-3 px-5 py-3 rounded-xl transition-all active:scale-95"
            style={{
              background: `${cfg.accentColor}10`,
              border: `2px dashed ${cfg.accentColor}55`,
            }}
          >
            <span
              className="text-2xl font-black tracking-wider tabular-nums"
              style={{ color: cfg.accentColor, fontFamily: 'Fira Code, monospace', letterSpacing: '0.08em' }}
            >
              {cfg.number}
            </span>
            <span
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: copied ? 'hsl(142,70%,38%)' : cfg.accentColor,
                color: 'white',
              }}
            >
              {copied ? (
                <><CheckCheck size={13} /> কপি হয়েছে!</>
              ) : (
                <><Copy size={13} /> কপি করুন</>
              )}
            </span>
          </button>
          <p className="text-[11px] text-muted-foreground">👆 নম্বরে ক্লিক করলেই কপি হবে</p>
        </div>

        {/* ── Steps ── */}
        <div
          className="rounded-xl p-4 space-y-2.5"
          style={{ background: 'hsla(0,0%,100%,0.65)', border: `1px solid ${cfg.accentColor}20` }}
        >
          <p
            className="text-[11px] font-black tracking-widest uppercase mb-3 flex items-center gap-1.5"
            style={{ color: cfg.accentColor }}
          >
            <Smartphone size={12} /> পেমেন্ট করার নিয়ম
          </p>
          {cfg.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white mt-0.5"
                style={{ background: cfg.accentColor }}
              >
                {i + 1}
              </span>
              <p className="text-[12.5px] text-foreground leading-snug">{step}</p>
            </div>
          ))}
        </div>

        {/* ── Warning ── */}
        {cfg.warning && (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2.5"
            style={{ background: 'hsla(38,100%,55%,0.12)', border: '1px solid hsla(38,100%,55%,0.35)' }}
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(35,100%,45%)' }} />
            <p className="text-[12px] leading-snug font-medium" style={{ color: 'hsl(35,100%,30%)' }}>
              {cfg.warning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentInstructions;
export type { PMId };
