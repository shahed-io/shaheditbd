import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';

export const PAYMENT_ASSET_LOGOS: Record<string, string> = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  bkash_merchant: bkashMerchantLogo,
};

// Each payment method keeps its OWN logo. The bKash PGW (`bkash_online`) has no
// per-method admin entry, so it falls back to the shared bKash content logo.
// `bkash` (personal) and `bkash_merchant` are independent — admin-configured logos win.
export const getPaymentLogo = (
  methodId: string,
  configuredLogo?: string | null,
  sharedBkashLogo?: string | null,
) => {
  const customLogo = (configuredLogo || '').trim();
  if (customLogo) return customLogo;

  if (methodId === 'bkash_online') {
    const sharedLogo = (sharedBkashLogo || '').trim();
    if (sharedLogo) return sharedLogo;
  }

  return PAYMENT_ASSET_LOGOS[methodId] || '';
};