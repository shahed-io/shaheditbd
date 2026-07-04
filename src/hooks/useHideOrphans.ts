import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reads `hide_orphan_products` from site_settings.
 * When enabled (default), product grids trim their last row so no partial
 * row of 1-2 orphan cards is displayed (unless the category ONLY has 1-2
 * products in total — those small categories stay untouched).
 */
export const useHideOrphans = (): boolean => {
  const { data } = useQuery({
    queryKey: ['site-setting', 'hide_orphan_products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'hide_orphan_products')
        .maybeSingle();
      return data?.value ?? 'true';
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
  // Default ON if setting missing/unknown
  return (data ?? 'true') !== 'false';
};
