import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { code, orderTotal } = await req.json();

    if (!code || typeof code !== 'string' || code.length > 30) {
      return new Response(JSON.stringify({ valid: false, message: 'কুপন কোড সঠিক নয়' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const trimmedCode = code.trim().toUpperCase();

    // --- Check welcome_coupons first if code starts with WELCOME- ---
    if (trimmedCode.startsWith('WELCOME-')) {
      const { data: wc, error: wcErr } = await supabase
        .from('welcome_coupons')
        .select('id, code, discount_percent, discount_type, discount_amount, expires_at, is_used')
        .eq('code', trimmedCode)
        .single();

      if (wcErr || !wc) {
        return new Response(JSON.stringify({ valid: false, message: 'কুপন কোড সঠিক নয়' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }

      if (wc.is_used) {
        return new Response(JSON.stringify({ valid: false, message: 'এই কুপন ইতিমধ্যে ব্যবহৃত হয়েছে' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }

      if (new Date(wc.expires_at) < new Date()) {
        return new Response(JSON.stringify({ valid: false, message: 'কুপনের মেয়াদ শেষ হয়ে গেছে' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }

      // Calculate discount based on type (percent / fixed)
      let discount = 0;
      if (wc.discount_type === 'fixed' && wc.discount_amount > 0) {
        discount = Math.min(wc.discount_amount, orderTotal);
      } else {
        // legacy: percent (fallback if discount_type is null/percent)
        discount = Math.round(orderTotal * wc.discount_percent / 100);
      }

      // Mark as used
      await supabase
        .from('welcome_coupons')
        .update({ is_used: true })
        .eq('id', wc.id);

      return new Response(JSON.stringify({
        valid: true,
        discount,
        couponId: wc.id,
        welcomeCoupon: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // --- Regular coupons table ---
    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value, min_order_amount, max_uses, uses_count, is_active, expires_at')
      .eq('code', trimmedCode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false, message: 'কুপন কোড সঠিক নয়' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, message: 'কুপন মেয়াদ শেষ হয়ে গেছে' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    if (data.min_order_amount && orderTotal < data.min_order_amount) {
      return new Response(JSON.stringify({ valid: false, message: `ন্যূনতম অর্ডার ৳${data.min_order_amount}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    if (data.max_uses && data.uses_count >= data.max_uses) {
      return new Response(JSON.stringify({ valid: false, message: 'কুপনের সীমা শেষ হয়ে গেছে' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    const discount = data.discount_type === 'percentage'
      ? Math.round(orderTotal * data.discount_value / 100)
      : Math.min(data.discount_value, orderTotal);

    return new Response(JSON.stringify({ valid: true, discount, couponId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, message: 'কুপন যাচাই করতে সমস্যা হয়েছে' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  }
});
