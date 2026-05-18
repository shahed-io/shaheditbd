import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BkashPgwContent = {
  title: string;
  description: string;
  bullets: string[];
  amount_prefix: string; // e.g. "💳 মোট পরিশোধ:"
};

export const DEFAULT_BKASH_CONTENT: BkashPgwContent = {
  title: 'bKash Online Payment (PGW)',
  description:
    '"অর্ডার দিন" বাটনে ক্লিক করলে আপনাকে bKash-এর সিকিউর পেমেন্ট পেজে নিয়ে যাওয়া হবে। সফল পেমেন্টের পর অর্ডার স্বয়ংক্রিয়ভাবে কনফার্ম হবে।',
  bullets: [
    'কোনো TrxID বা স্ক্রিনশট দিতে হবে না',
    'পেমেন্ট সফল হলেই লাইসেন্স সাথে সাথে ডেলিভারি',
  ],
  amount_prefix: '💳 মোট পরিশোধ:',
};

export const BKASH_CONTENT_KEY = 'bkash_pgw_content';

export function useBkashPgwContent() {
  const { data } = useQuery({
    queryKey: ['bkash-pgw-content'],
    queryFn: async (): Promise<BkashPgwContent> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', BKASH_CONTENT_KEY)
        .maybeSingle();
      if (error) return DEFAULT_BKASH_CONTENT;
      if (data?.value) {
        try {
          return { ...DEFAULT_BKASH_CONTENT, ...JSON.parse(data.value) };
        } catch {
          return DEFAULT_BKASH_CONTENT;
        }
      }
      return DEFAULT_BKASH_CONTENT;
    },
    staleTime: 60_000,
  });
  return data ?? DEFAULT_BKASH_CONTENT;
}
