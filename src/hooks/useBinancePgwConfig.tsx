import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BinancePgwConfig = {
  api_key: string;
  api_secret: string;
  base_url: string;
  currency: string;   // crypto currency charged, e.g. USDT
  bdt_rate: number;   // how many BDT equal 1 unit of `currency`
  label: string;      // checkout label
  is_active: boolean;
};

export const DEFAULT_BINANCE_CFG: BinancePgwConfig = {
  api_key: '',
  api_secret: '',
  base_url: 'https://bpay.binanceapi.com',
  currency: 'USDT',
  bdt_rate: 120,
  label: 'Binance Pay (Crypto)',
  is_active: false,
};

export const BINANCE_PGW_KEY = 'binance_pgw_config';

/**
 * Read-only Binance Pay config for the storefront.
 * Reacts instantly to admin saves via BroadcastChannel.
 * Checkout auto-shows Binance Pay only when is_active && credentials exist.
 */
export function useBinancePgwConfig() {
  const qc = useQueryClient();

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('binance-pgw-config-update');
      bc.onmessage = () => qc.invalidateQueries({ queryKey: ['binance-pgw-config'] });
    } catch { /* Safari fallback */ }
    return () => { bc?.close(); };
  }, [qc]);

  const { data } = useQuery({
    queryKey: ['binance-pgw-config'],
    queryFn: async (): Promise<BinancePgwConfig> => {
      const { data } = await supabase
        .from('site_settings').select('value').eq('key', BINANCE_PGW_KEY).maybeSingle();
      if (data?.value) {
        try { return { ...DEFAULT_BINANCE_CFG, ...JSON.parse(data.value) }; }
        catch { return DEFAULT_BINANCE_CFG; }
      }
      return DEFAULT_BINANCE_CFG;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 2,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return data ?? DEFAULT_BINANCE_CFG;
}
