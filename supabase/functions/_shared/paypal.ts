// Shared PayPal helper: config loader, OAuth token, REST base URL.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface PayPalCfg {
  mode: 'sandbox' | 'live';
  client_id: string;
  client_secret: string;
  webhook_id: string;
  currency: string;
  is_active: boolean;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export async function loadPayPalConfig(supabase: SupabaseClient): Promise<PayPalCfg> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'paypal_pgw_config')
    .maybeSingle();
  let cfg: Partial<PayPalCfg> = {};
  if (data?.value) {
    try { cfg = JSON.parse(data.value as string); } catch { /* ignore */ }
  }
  const envMode = (Deno.env.get('PAYPAL_ENV') || '').toLowerCase();
  return {
    mode: ((cfg.mode || envMode || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox'),
    client_id: cfg.client_id || Deno.env.get('PAYPAL_CLIENT_ID') || '',
    client_secret: cfg.client_secret || Deno.env.get('PAYPAL_CLIENT_SECRET') || '',
    webhook_id: cfg.webhook_id || Deno.env.get('PAYPAL_WEBHOOK_ID') || '',
    currency: (cfg.currency || 'USD').toUpperCase(),
    is_active: cfg.is_active !== false,
  };
}

export function paypalBaseUrl(mode: string): string {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export async function paypalAccessToken(cfg: PayPalCfg): Promise<string> {
  if (!cfg.client_id || !cfg.client_secret) {
    throw new Error('PayPal credentials not configured');
  }
  const basic = btoa(`${cfg.client_id}:${cfg.client_secret}`);
  const res = await fetch(`${paypalBaseUrl(cfg.mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`PayPal token error: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function logPP(...args: unknown[]) {
  console.log('[paypal]', ...args);
}
