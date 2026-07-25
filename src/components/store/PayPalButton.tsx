import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window { paypal?: any; }
}

interface Props {
  orderId: string;
  onSuccess: (data: { captureId: string; orderId: string }) => void;
  onError?: (err: Error) => void;
  onCancel?: () => void;
}

let sdkPromise: Promise<void> | null = null;

async function fetchPayPalConfig() {
  const { data } = await supabase
    .from('site_settings').select('value').eq('key', 'paypal_pgw_config').maybeSingle();
  if (!data?.value) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

function loadSdk(clientId: string, currency: string): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { sdkPromise = null; reject(new Error('Failed to load PayPal SDK')); };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export default function PayPalButton({ orderId, onSuccess, onError, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'disabled'>('loading');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    let buttonsInstance: any = null;

    (async () => {
      try {
        const cfg = await fetchPayPalConfig();
        if (!cfg?.is_active) { setState('disabled'); setMsg('PayPal is not enabled.'); return; }
        if (!cfg?.client_id) { setState('error'); setMsg('PayPal Client ID missing.'); return; }
        await loadSdk(cfg.client_id, cfg.currency || 'USD');
        if (cancelled || !ref.current || !window.paypal) return;

        buttonsInstance = window.paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: async () => {
            const { data, error } = await supabase.functions.invoke('paypal-create-order', {
              body: { orderId },
            });
            if (error || (data as any)?.error) {
              const m = (data as any)?.error || error?.message || 'Create failed';
              toast.error(m); throw new Error(m);
            }
            return (data as any).id;
          },
          onApprove: async (data: any) => {
            const { data: cap, error } = await supabase.functions.invoke('paypal-capture-order', {
              body: { paypalOrderId: data.orderID },
            });
            if (error || (cap as any)?.error) {
              const m = (cap as any)?.error || error?.message || 'Capture failed';
              toast.error(m); onError?.(new Error(m)); return;
            }
            toast.success('Payment successful');
            onSuccess({ captureId: (cap as any).captureId, orderId });
          },
          onCancel: () => { toast.info('Payment cancelled'); onCancel?.(); },
          onError: (err: any) => { console.error('[paypal]', err); toast.error('PayPal error'); onError?.(err); },
        });
        await buttonsInstance.render(ref.current);
        setState('ready');
      } catch (e: any) {
        console.error('[paypal] init', e);
        setState('error'); setMsg(e.message || 'PayPal init failed');
      }
    })();

    return () => {
      cancelled = true;
      try { buttonsInstance?.close?.(); } catch { /* ignore */ }
    };
  }, [orderId]);

  return (
    <div className="w-full">
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading PayPal…
        </div>
      )}
      {(state === 'error' || state === 'disabled') && (
        <div className="text-sm text-rose-600 p-3 border border-rose-200 rounded bg-rose-50">{msg}</div>
      )}
      <div ref={ref} />
    </div>
  );
}
