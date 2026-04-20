import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpinPrize {
  id: string;
  label: string;          // e.g. "20% OFF", "৳100 OFF", "Try Again"
  type: 'percent' | 'fixed' | 'none';
  value: number;          // percent number OR taka amount (0 for "none")
  weight: number;         // probability weight (higher = more frequent)
  color?: string;         // wheel slice color (hsl)
}

interface SpinSettings {
  enabled: boolean;
  popup_title: string;
  popup_subtitle: string;
  spin_button_text: string;
  min_minutes: number;
  max_minutes: number;
  prizes: SpinPrize[];
}

const DEFAULT_PRIZES: SpinPrize[] = [
  { id: 'p1', label: '5% OFF',   type: 'percent', value: 5,   weight: 30, color: '262 80% 60%' },
  { id: 'p2', label: '৳50 OFF',  type: 'fixed',   value: 50,  weight: 25, color: '24 95% 55%' },
  { id: 'p3', label: '10% OFF',  type: 'percent', value: 10,  weight: 18, color: '198 90% 55%' },
  { id: 'p4', label: '৳100 OFF', type: 'fixed',   value: 100, weight: 12, color: '142 75% 45%' },
  { id: 'p5', label: '15% OFF',  type: 'percent', value: 15,  weight: 8,  color: '340 85% 60%' },
  { id: 'p6', label: '৳150 OFF', type: 'fixed',   value: 150, weight: 4,  color: '47 95% 55%' },
  { id: 'p7', label: '20% OFF',  type: 'percent', value: 20,  weight: 2,  color: '280 85% 55%' },
  { id: 'p8', label: 'Try Again',type: 'none',    value: 0,   weight: 1,  color: '0 0% 60%' },
];

const DEFAULT_SETTINGS: SpinSettings = {
  enabled: true,
  popup_title: '🎡 Lucky Spin!',
  popup_subtitle: 'হুইল ঘুরিয়ে বিশেষ ছাড় জিতে নিন',
  spin_button_text: 'SPIN',
  min_minutes: 30,
  max_minutes: 60,
  prizes: DEFAULT_PRIZES,
};

function pickWeighted(prizes: SpinPrize[]): SpinPrize {
  const total = prizes.reduce((s, p) => s + Math.max(0, p.weight), 0);
  if (total <= 0) return prizes[0];
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= Math.max(0, p.weight);
    if (r <= 0) return p;
  }
  return prizes[prizes.length - 1];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { visitorId, action } = await req.json();

    if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 64) {
      return new Response(JSON.stringify({ error: 'Invalid visitor ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch admin settings (spin wheel config)
    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'welcome_discount_config')
      .single();

    let settings: SpinSettings = DEFAULT_SETTINGS;
    if (settingsRow?.value) {
      try {
        const parsed = JSON.parse(settingsRow.value);
        settings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          prizes: Array.isArray(parsed.prizes) && parsed.prizes.length > 0 ? parsed.prizes : DEFAULT_PRIZES,
        };
      } catch { /* fall back to defaults */ }
    }

    if (!settings.enabled) {
      return new Response(JSON.stringify({ disabled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // ─── action: 'check' returns existing coupon or settings only (no spin) ───
    if (action === 'check') {
      const { data: existing } = await supabase
        .from('welcome_coupons')
        .select('code, discount_percent, discount_type, discount_amount, prize_label, expires_at, is_used')
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing && !existing.is_used && new Date(existing.expires_at) > new Date()) {
        return new Response(JSON.stringify({
          alreadyHas: true,
          code: existing.code,
          discount: existing.discount_percent,
          discountType: existing.discount_type,
          discountAmount: existing.discount_amount,
          prizeLabel: existing.prize_label,
          expiresAt: existing.expires_at,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }

      if (existing) {
        return new Response(JSON.stringify({ alreadyClaimed: true, settings }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }

      return new Response(JSON.stringify({ canSpin: true, settings }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // ─── action: 'spin' — pick a prize and create coupon ───
    // Prevent double-spin
    const { data: existingSpin } = await supabase
      .from('welcome_coupons')
      .select('id, code, discount_percent, discount_type, discount_amount, prize_label, expires_at, is_used')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSpin) {
      if (!existingSpin.is_used && new Date(existingSpin.expires_at) > new Date()) {
        return new Response(JSON.stringify({
          alreadyHas: true,
          code: existingSpin.code,
          discount: existingSpin.discount_percent,
          discountType: existingSpin.discount_type,
          discountAmount: existingSpin.discount_amount,
          prizeLabel: existingSpin.prize_label,
          expiresAt: existingSpin.expires_at,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
      return new Response(JSON.stringify({ alreadyClaimed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Cap percent prizes at 20%, fixed at 500 — safety
    const safePrizes = settings.prizes.map(p => {
      if (p.type === 'percent') return { ...p, value: Math.max(1, Math.min(20, Math.floor(p.value))) };
      if (p.type === 'fixed') return { ...p, value: Math.max(10, Math.min(500, Math.floor(p.value))) };
      return { ...p, value: 0 };
    });

    const prize = pickWeighted(safePrizes);
    const prizeIndex = safePrizes.findIndex(p => p.id === prize.id);

    // "none" → no coupon, just respond with the spin result
    if (prize.type === 'none') {
      return new Response(JSON.stringify({
        spinResult: true,
        prize,
        prizeIndex,
        noCoupon: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Random expiry within admin-configured range
    const minMin = Math.max(5, settings.min_minutes);
    const maxMin = Math.max(minMin, settings.max_minutes);
    const minutesValid = Math.floor(Math.random() * (maxMin - minMin + 1)) + minMin;
    const expiresAt = new Date(Date.now() + minutesValid * 60 * 1000).toISOString();

    // Generate unique code
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(36).toUpperCase().slice(0, 1))
      .join('') + Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `WELCOME-${randomPart}`;

    const insertPayload = {
      code,
      discount_percent: prize.type === 'percent' ? prize.value : 0,
      discount_type: prize.type,
      discount_amount: prize.type === 'fixed' ? prize.value : 0,
      prize_label: prize.label,
      expires_at: expiresAt,
      visitor_id: visitorId,
    };

    const { error: insertError } = await supabase
      .from('welcome_coupons')
      .insert(insertPayload);

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create coupon' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    return new Response(JSON.stringify({
      spinResult: true,
      prize,
      prizeIndex,
      code,
      discount: insertPayload.discount_percent,
      discountType: prize.type,
      discountAmount: insertPayload.discount_amount,
      prizeLabel: prize.label,
      expiresAt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
