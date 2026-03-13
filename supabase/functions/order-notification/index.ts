import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'পেন্ডিং', processing: 'প্রসেসিং', delivered: 'ডেলিভার্ড',
  completed: 'সম্পন্ন', cancelled: 'বাতিল', refunded: 'রিফান্ড', failed: 'ব্যর্থ',
};

const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳', processing: '🔄', delivered: '🚚',
  completed: '✅', cancelled: '❌', refunded: '↩️', failed: '⚠️',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { orderId, channel } = await req.json();
    if (!orderId) return new Response(JSON.stringify({ error: 'orderId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: order, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single();
    if (error || !order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const statusLabel = STATUS_LABELS[order.status] || order.status;
    const statusEmoji = STATUS_EMOJI[order.status] || '📦';
    const items = order.order_items?.map((i: any) => `• ${i.product_name}`).join('\n') || '';

    // In-app notification
    if (order.user_id) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: `${statusEmoji} অর্ডার ${statusLabel}`,
        message: `আপনার অর্ডার #${order.order_number} এর স্ট্যাটাস "${statusLabel}" হয়েছে।`,
        type: ['cancelled', 'failed'].includes(order.status) ? 'error' : 'success',
        link: '/dashboard',
        is_read: false,
      });
    }

    // WhatsApp link
    let whatsappLink = null;
    if (order.customer_phone && channel === 'whatsapp') {
      const phone = order.customer_phone.replace(/\D/g, '').replace(/^0/, '880');
      const msg = encodeURIComponent(`${statusEmoji} অর্ডার আপডেট!\n\nঅর্ডার: #${order.order_number}\nস্ট্যাটাস: ${statusLabel}\n\n${items}\n\nমোট: ৳${Number(order.total).toLocaleString()}\n\nধন্যবাদ! 🙏`);
      whatsappLink = `https://wa.me/${phone}?text=${msg}`;
    }

    return new Response(JSON.stringify({ success: true, whatsappLink, notificationSent: !!order.user_id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
