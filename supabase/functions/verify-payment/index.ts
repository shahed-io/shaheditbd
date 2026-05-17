import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate the caller's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId, action, adminNotes } = await req.json();

    if (!orderId || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newStatus = action === 'approve' ? 'completed' : 'cancelled';
    const paymentStatus = action === 'approve' ? 'verified' : 'rejected';

    // Update order status
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        status: newStatus,
        payment_status: paymentStatus,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderError) {
      return new Response(JSON.stringify({ error: 'Failed to update order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update payment proof status
    await supabaseAdmin
      .from('payment_proofs')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        admin_notes: adminNotes || null,
      })
      .eq('order_id', orderId);

    // If approved, assign available license keys to order items
    if (action === 'approve') {
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('id, product_id, product_name, quantity')
        .eq('order_id', orderId);

      if (orderItems) {
        for (const item of orderItems) {
          if (!item.product_id) continue;

          // Parse variant/option from product_name like "Office 365 (1 Year)"
          const variantMatch = (item.product_name || '').match(/\(([^()]+)\)\s*$/);
          const variant = variantMatch ? variantMatch[1].trim() : null;

          // Prefer keys matching this specific variant; fallback to keys without a variant
          let keys: any[] | null = null;
          if (variant) {
            const { data: variantKeys } = await supabaseAdmin
              .from('license_keys')
              .select('id, key_value')
              .eq('product_id', item.product_id)
              .eq('variant', variant)
              .eq('status', 'available')
              .limit(item.quantity);
            keys = variantKeys || null;
          }
          if (!keys || keys.length < item.quantity) {
            const need = item.quantity - (keys?.length || 0);
            const { data: noVariantKeys } = await supabaseAdmin
              .from('license_keys')
              .select('id, key_value')
              .eq('product_id', item.product_id)
              .is('variant', null)
              .eq('status', 'available')
              .limit(need);
            keys = [...(keys || []), ...(noVariantKeys || [])];
          }

          if (keys && keys.length > 0) {
            for (const key of keys) {
              await supabaseAdmin
                .from('license_keys')
                .update({
                  status: 'assigned',
                  order_item_id: item.id,
                  assigned_at: new Date().toISOString(),
                })
                .eq('id', key.id);

              await supabaseAdmin
                .from('order_items')
                .update({ license_key: key.key_value })
                .eq('id', item.id);
            }
          }
        }
      }
    }

    console.log(`[verify-payment] Admin ${user.id} ${action}d order ${orderId}`);

    return new Response(JSON.stringify({ success: true, action, orderId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[verify-payment] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
