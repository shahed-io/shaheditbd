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

const SHARED_BKASH_METHODS = new Set(['bkash', 'bkash_merchant', 'bkash_online']);

export const getPaymentLogo = (
  methodId: string,
  configuredLogo?: string | null,
  sharedBkashLogo?: string | null,
) => {
  const sharedLogo = (sharedBkashLogo || '').trim();
  if (sharedLogo && SHARED_BKASH_METHODS.has(methodId)) return sharedLogo;

  const customLogo = (configuredLogo || '').trim();
  return customLogo || PAYMENT_ASSET_LOGOS[methodId] || '';
};