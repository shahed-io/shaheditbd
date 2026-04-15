import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Check if this visitor already got a coupon
    const { data: existing } = await supabase
      .from('welcome_coupons')
      .select('code, discount_percent, expires_at, is_used')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      // If still valid and not used, return it
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
      // Already used or expired — don't give another
      return new Response(JSON.stringify({ alreadyClaimed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Generate random discount 5-12%
    const discount = Math.floor(Math.random() * 8) + 5; // 5,6,7,8,9,10,11,12

    // Random expiry 30-60 minutes
    const minutesValid = Math.floor(Math.random() * 31) + 30; // 30-60
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
