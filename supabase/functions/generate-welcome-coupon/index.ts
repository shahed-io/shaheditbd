import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeSettings {
  enabled: boolean;
  min_discount: number;
  max_discount: number;
  min_minutes: number;
  max_minutes: number;
}

const DEFAULT_SETTINGS: WelcomeSettings = {
  enabled: true,
  min_discount: 5,
  max_discount: 12,
  min_minutes: 30,
  max_minutes: 60,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { visitorId } = await req.json();

    if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 64) {
      return new Response(JSON.stringify({ error: 'Invalid visitor ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch admin settings
    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'welcome_discount_config')
      .single();

    const settings: WelcomeSettings = settingsRow?.value
      ? JSON.parse(settingsRow.value)
      : DEFAULT_SETTINGS;

    if (!settings.enabled) {
      return new Response(JSON.stringify({ disabled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Check if this visitor already got a coupon
    const { data: existing } = await supabase
      .from('welcome_coupons')
      .select('code, discount_percent, expires_at, is_used')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      if (!existing.is_used && new Date(existing.expires_at) > new Date()) {
        return new Response(JSON.stringify({
          code: existing.code,
          discount: existing.discount_percent,
          expiresAt: existing.expires_at,
          isNew: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
      return new Response(JSON.stringify({ alreadyClaimed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Generate random discount within admin-configured range
    const range = settings.max_discount - settings.min_discount;
    const discount = Math.floor(Math.random() * (range + 1)) + settings.min_discount;

    // Random expiry within admin-configured range
    const minuteRange = settings.max_minutes - settings.min_minutes;
    const minutesValid = Math.floor(Math.random() * (minuteRange + 1)) + settings.min_minutes;
    const expiresAt = new Date(Date.now() + minutesValid * 60 * 1000).toISOString();

    // Generate unique code
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(36).toUpperCase().slice(0, 1))
      .join('') + Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `WELCOME-${randomPart}`;

    const { error: insertError } = await supabase
      .from('welcome_coupons')
      .insert({
        code,
        discount_percent: discount,
        expires_at: expiresAt,
        visitor_id: visitorId,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create coupon' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    return new Response(JSON.stringify({
      code,
      discount,
      expiresAt,
      isNew: true,
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
