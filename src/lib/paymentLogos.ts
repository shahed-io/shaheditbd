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

export const getPaymentLogo = (
  methodId: string,
  configuredLogo?: string | null,
  sharedBkashLogo?: string | null,
) => {
  // Each payment method uses its OWN admin-configured logo independently.
  // Manual methods (bkash, bkash_merchant, nagad, rocket, upay) are never
  // overridden by other methods' logos.
  const customLogo = (configuredLogo || '').trim();
  if (customLogo) return customLogo;

  // Only bkash_online (PGW) may fall back to the shared bKash checkout logo
  // when the admin has not uploaded a dedicated logo for it.
  if (methodId === 'bkash_online') {
    const sharedLogo = (sharedBkashLogo || '').trim();
    if (sharedLogo) return sharedLogo;
  }

  return PAYMENT_ASSET_LOGOS[methodId] || '';
};