import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { code, orderTotal, customerEmail, productIds } = await req.json();

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

      const welcomeMinOrder = wc.discount_type === 'fixed' && wc.discount_amount >= 100 ? 999 : 0;
      if (welcomeMinOrder > 0 && orderTotal < welcomeMinOrder) {
        return new Response(JSON.stringify({ valid: false, message: `এই Welcome Offer ব্যবহার করতে ন্যূনতম ৳${welcomeMinOrder} টাকার অর্ডার করুন` }), {
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
        discountType: wc.discount_type === 'fixed' ? 'fixed' : 'percentage',
        discountValue: wc.discount_type === 'fixed' ? wc.discount_amount : wc.discount_percent,
        message: '✅ Welcome কুপন approved!',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // --- Regular coupons table ---
    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value, min_order_amount, max_uses, uses_count, is_active, expires_at, customer_email, product_id')
      .eq('code', trimmedCode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false, message: 'কুপন কোড সঠিক নয়' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Personal coupon — restricted to specific customer email
    if (data.customer_email) {
      const submitted = (customerEmail || '').toString().trim().toLowerCase();
      if (!submitted) {
        return new Response(JSON.stringify({ valid: false, message: 'এই কুপন ব্যবহারের জন্য লগইন করুন বা ইমেইল দিন' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
      if (submitted !== data.customer_email) {
        return new Response(JSON.stringify({ valid: false, message: 'এই কুপন আপনার অ্যাকাউন্টের জন্য নয়' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
    }

    // Product-restricted coupon — must be applied with that product in cart
    if (data.product_id) {
      const ids: string[] = Array.isArray(productIds) ? productIds.map((x: any) => String(x)) : [];
      if (!ids.includes(String(data.product_id))) {
        return new Response(JSON.stringify({ valid: false, message: 'এই কুপন শুধুমাত্র নির্দিষ্ট প্রোডাক্টের জন্য — সেই প্রোডাক্ট কার্টে যোগ করুন' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
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

    return new Response(JSON.stringify({
      valid: true,
      discount,
      couponId: data.id,
      discountType: data.discount_type,
      discountValue: data.discount_value,
      message: data.discount_type === 'percentage'
        ? `✅ কুপন approved — ${data.discount_value}% ছাড়!`
        : `✅ কুপন approved — ৳${data.discount_value} ছাড়!`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, message: 'কুপন যাচাই করতে সমস্যা হয়েছে' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  }
});
