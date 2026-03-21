import { useState } from 'react';
import { Copy, CheckCheck, AlertCircle, Smartphone, Building2 } from 'lucide-react';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';

// Fallback asset logos (when DB logoUrl is empty)
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';

const ASSET_LOGOS: Record<string, string> = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  bkash_merchant: bkashMerchantLogo,
};

interface Props {
  paymentMethodId: string;
  amount: number;
  amountLabel?: string;
}

const PaymentInstructions = ({ paymentMethodId, amount, amountLabel = 'মোট পরিমাণ' }: Props) => {
  const { configs } = usePaymentSettings();
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const cfg = configs.find(c => c.id === paymentMethodId);
  if (!cfg) return null;

  const logoSrc = cfg.logoUrl || ASSET_LOGOS[cfg.id] || '';

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setCopiedField(field);
      setTimeout(() => { setCopied(false); setCopiedField(null); }, 2500);
    });
  };

  const copyNumber = () => copyText(cfg.number, 'number');

  const isBankTransfer = cfg.type === 'Bank Transfer';

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: `${cfg.accentColor}35`,
        background: cfg.bgColor,
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: `${cfg.accentColor}25`, background: `${cfg.accentColor}12` }}
      >
        {logoSrc
          ? <img src={logoSrc} alt={cfg.label} className="h-8 w-auto object-contain rounded-md" />
          : isBankTransfer
            ? <div className="h-8 w-8 rounded-md flex items-center justify-center text-white" style={{ background: cfg.accentColor }}><Building2 size={16} /></div>
            : <div className="h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: cfg.accentColor }}>{cfg.label.charAt(0)}</div>
        }
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
        {/* Bank Transfer — Account Details */}
        {isBankTransfer ? (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'hsla(0,0%,100%,0.65)', border: `1px solid ${cfg.accentColor}20` }}
          >
            <p
              className="text-[11px] font-black tracking-widest uppercase mb-3 flex items-center gap-1.5"
              style={{ color: cfg.accentColor }}
            >
              <Building2 size={12} /> ব্যাংক অ্যাকাউন্ট তথ্য
            </p>

            {/* Bank Name */}
            {cfg.bankName && (
              <div className="flex items-center justify-between gap-2 py-1.5">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider w-28 flex-shrink-0">ব্যাংকের নাম</span>
                <span className="text-sm font-bold text-foreground flex-1 text-right">{cfg.bankName}</span>
              </div>
            )}

            {/* Account Name */}
            {cfg.accountName && (
              <div className="flex items-center justify-between gap-2 py-1.5 border-t" style={{ borderColor: `${cfg.accentColor}15` }}>
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider w-28 flex-shrink-0">অ্যাকাউন্ট নাম</span>
                <span className="text-sm font-bold text-foreground flex-1 text-right">{cfg.accountName}</span>
              </div>
            )}

            {/* Account Number */}
            {cfg.number && (
              <div className="border-t pt-2" style={{ borderColor: `${cfg.accentColor}15` }}>
                <p className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase mb-2">অ্যাকাউন্ট নম্বর</p>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="group w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all active:scale-95"
                  style={{ background: `${cfg.accentColor}10`, border: `2px dashed ${cfg.accentColor}55` }}
                >
                  <span className="text-xl font-black tracking-wider tabular-nums" style={{ color: cfg.accentColor, fontFamily: 'Fira Code, monospace' }}>
                    {cfg.number}
                  </span>
                  <span className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ background: copiedField === 'number' ? 'hsl(142,70%,38%)' : cfg.accentColor, color: 'white' }}>
                    {copiedField === 'number' ? <><CheckCheck size={13} /> কপি!</> : <><Copy size={13} /> কপি</>}
                  </span>
                </button>
              </div>
            )}

            {/* Branch */}
            {cfg.branchName && (
              <div className="flex items-center justify-between gap-2 py-1.5 border-t" style={{ borderColor: `${cfg.accentColor}15` }}>
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider w-28 flex-shrink-0">শাখা</span>
                <span className="text-sm font-bold text-foreground flex-1 text-right">{cfg.branchName}</span>
              </div>
            )}

            {/* Routing Number */}
            {cfg.routingNumber && (
              <div className="border-t pt-2" style={{ borderColor: `${cfg.accentColor}15` }}>
                <p className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase mb-2">রাউটিং নম্বর</p>
                <button
                  type="button"
                  onClick={() => copyText(cfg.routingNumber!, 'routing')}
                  className="group w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all active:scale-95"
                  style={{ background: `${cfg.accentColor}10`, border: `2px dashed ${cfg.accentColor}55` }}
                >
                  <span className="text-xl font-black tracking-wider tabular-nums" style={{ color: cfg.accentColor, fontFamily: 'Fira Code, monospace' }}>
                    {cfg.routingNumber}
                  </span>
                  <span className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ background: copiedField === 'routing' ? 'hsl(142,70%,38%)' : cfg.accentColor, color: 'white' }}>
                    {copiedField === 'routing' ? <><CheckCheck size={13} /> কপি!</> : <><Copy size={13} /> কপি</>}
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Mobile Money — Copyable Number */
          <div className="text-center space-y-2">
            <p className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">
              {cfg.type === 'Merchant Payment' ? 'Merchant নম্বর' : 'Send Money নম্বর'}
            </p>
            <button
              type="button"
              onClick={copyNumber}
              className="group w-full flex items-center justify-between gap-3 px-5 py-3 rounded-xl transition-all active:scale-95"
              style={{ background: `${cfg.accentColor}10`, border: `2px dashed ${cfg.accentColor}55` }}
            >
              <span className="text-2xl font-black tracking-wider tabular-nums" style={{ color: cfg.accentColor, fontFamily: 'Fira Code, monospace', letterSpacing: '0.08em' }}>
                {cfg.number}
              </span>
              <span
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: copied ? 'hsl(142,70%,38%)' : cfg.accentColor, color: 'white' }}
              >
                {copied ? <><CheckCheck size={13} /> কপি হয়েছে!</> : <><Copy size={13} /> কপি করুন</>}
              </span>
            </button>
            <p className="text-[11px] text-muted-foreground">👆 নম্বরে ক্লিক করলেই কপি হবে</p>
          </div>
        )}

        {/* Steps */}
        <div
          className="rounded-xl p-4 space-y-2.5"
          style={{ background: 'hsla(0,0%,100%,0.65)', border: `1px solid ${cfg.accentColor}20` }}
        >
          <p
            className="text-[11px] font-black tracking-widest uppercase mb-3 flex items-center gap-1.5"
            style={{ color: cfg.accentColor }}
          >
            {isBankTransfer ? <Building2 size={12} /> : <Smartphone size={12} />}
            {isBankTransfer ? 'পেমেন্টের নিয়ম' : 'পেমেন্ট করার নিয়ম'}
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

        {/* Warning */}
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
export type { Props as PaymentInstructionsProps };
// Backward-compat type alias
export type PMId = string;
