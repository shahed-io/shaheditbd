import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PayPalPgwConfig = {
  mode: 'sandbox' | 'live';
  client_id: string;
  client_secret: string;
  webhook_id: string;
  currency: string;
  is_active: boolean;
};

export const DEFAULT_PAYPAL_CFG: PayPalPgwConfig = {
  mode: 'sandbox',
  client_id: '',
  client_secret: '',
  webhook_id: '',
  currency: 'USD',
  is_active: false,
};

export const PAYPAL_PGW_KEY = 'paypal_pgw_config';

/**
 * Read-only PayPal PGW config for the storefront.
 * Reacts instantly to admin saves via BroadcastChannel.
 */
export function usePayPalPgwConfig() {
  const qc = useQueryClient();

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('paypal-pgw-config-update');
      bc.onmessage = () => qc.invalidateQueries({ queryKey: ['paypal-pgw-config'] });
    } catch { /* Safari fallback */ }
    return () => { bc?.close(); };
  }, [qc]);

  const { data } = useQuery({
    queryKey: ['paypal-pgw-config'],
    queryFn: async (): Promise<PayPalPgwConfig> => {
      const { data } = await supabase
        .from('site_settings').select('value').eq('key', PAYPAL_PGW_KEY).maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_PAYPAL_CFG, ...JSON.parse(data.value) }; }
        catch { return DEFAULT_PAYPAL_CFG; }
      }
      return DEFAULT_PAYPAL_CFG;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 2,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return data ?? DEFAULT_PAYPAL_CFG;
}
