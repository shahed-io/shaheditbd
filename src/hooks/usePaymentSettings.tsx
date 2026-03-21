import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethodConfig {
  id: string;
  label: string;
  number: string;
  type: 'Send Money' | 'Merchant Payment' | 'Bank Transfer';
  logoUrl: string; // URL or empty (falls back to asset)
  accentColor: string;
  bgColor: string;
  steps: string[];
  warning?: string;
  isActive: boolean;
  sortOrder: number;
  // Bank-specific fields (only for type === 'Bank Transfer')
  bankName?: string;
  accountName?: string;
  branchName?: string;
  routingNumber?: string;
}

const SETTINGS_KEY = 'payment_methods_config';

// Default configs (fallback when DB has no data)
export const DEFAULT_PAYMENT_CONFIGS: PaymentMethodConfig[] = [
  {
    id: 'bkash',
    label: 'bKash',
    number: '01820060046',
    type: 'Send Money',
    logoUrl: '',
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
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'nagad',
    label: 'Nagad',
    number: '01840099853',
    type: 'Send Money',
    logoUrl: '',
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
    warning: undefined,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'rocket',
    label: 'Rocket',
    number: '01840099853',
    type: 'Send Money',
    logoUrl: '',
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
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'upay',
    label: 'উপায় (Upay)',
    number: '01840099853',
    type: 'Send Money',
    logoUrl: '',
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
    warning: undefined,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'bkash_merchant',
    label: 'bKash Merchant',
    number: '01840099853',
    type: 'Merchant Payment',
    logoUrl: '',
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
    isActive: true,
    sortOrder: 4,
  },
];

export const usePaymentSettings = () => {
  const qc = useQueryClient();

  const { data: configs = DEFAULT_PAYMENT_CONFIGS, isLoading } = useQuery<PaymentMethodConfig[]>({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();
      if (data?.value) {
        try {
          return JSON.parse(data.value) as PaymentMethodConfig[];
        } catch { /* fall through */ }
      }
      return DEFAULT_PAYMENT_CONFIGS;
    },
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (newConfigs: PaymentMethodConfig[]) => {
      const value = JSON.stringify(newConfigs);
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: SETTINGS_KEY, value, category: 'store' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-settings'] });
    },
  });

  return { configs, isLoading, saveMutation };
};
