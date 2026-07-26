import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UddoktapayPgwConfig = {
  mode: 'sandbox' | 'live';
  api_key: string;
  base_url: string; // e.g. https://sandbox.uddoktapay.com or https://your-domain.uddoktapay.com
  currency: string;
  is_active: boolean;
};

export const DEFAULT_UDDOKTAPAY_CFG: UddoktapayPgwConfig = {
  mode: 'sandbox',
  api_key: '',
  base_url: 'https://sandbox.uddoktapay.com',
  currency: 'BDT',
  is_active: false,
};

export const UDDOKTAPAY_PGW_KEY = 'uddoktapay_pgw_config';

/**
 * Read-only Uddoktapay PGW config for the storefront.
 * Reacts instantly to admin saves via BroadcastChannel.
 * Checkout page auto-shows Uddoktapay only when is_active && api_key.
 */
export function useUddoktapayPgwConfig() {
  const qc = useQueryClient();

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('uddoktapay-pgw-config-update');
      bc.onmessage = () => qc.invalidateQueries({ queryKey: ['uddoktapay-pgw-config'] });
    } catch { /* Safari fallback */ }
    return () => { bc?.close(); };
  }, [qc]);

  const { data } = useQuery({
    queryKey: ['uddoktapay-pgw-config'],
    queryFn: async (): Promise<UddoktapayPgwConfig> => {
      const { data } = await supabase
        .from('site_settings').select('value').eq('key', UDDOKTAPAY_PGW_KEY).maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_UDDOKTAPAY_CFG, ...JSON.parse(data.value) }; }
        catch { return DEFAULT_UDDOKTAPAY_CFG; }
      }
      return DEFAULT_UDDOKTAPAY_CFG;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 2,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return data ?? DEFAULT_UDDOKTAPAY_CFG;
}
