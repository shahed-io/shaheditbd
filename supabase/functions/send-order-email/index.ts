import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'Shahed Store'
const SITE_URL = 'https://shahedstore.com.bd'
const BRAND_COLOR = 'hsl(258,78%,55%)'
const BRAND_GRADIENT = 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))'

const STATUS_LABELS: Record<string, { bn: string; emoji: string; color: string }> = {
  pending:    { bn: 'অপেক্ষমান',     emoji: '⏳', color: '#f59e0b' },
  processing: { bn: 'প্রক্রিয়াধীন', emoji: '🔄', color: '#3b82f6' },
  completed:  { bn: 'সম্পন্ন',       emoji: '✅', color: '#10b981' },
  delivered:  { bn: 'ডেলিভারড',      emoji: '📦', color: '#10b981' },
  cancelled:  { bn: 'বাতিল',         emoji: '❌', color: '#ef4444' },
  refunded:   { bn: 'রিফান্ড হয়েছে', emoji: '💸', color: '#8b5cf6' },
  failed:     { bn: 'ব্যর্থ',        emoji: '⚠️', color: '#ef4444' },
}

function buildInvoiceHtml(order: any, items: any[]) {
  const statusInfo = STATUS_LABELS[order.status] || { bn: order.status, emoji: '📋', color: '#6b7280' }
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#374151;">${item.product_name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#6b7280;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#374151;text-align:right;">৳${item.price}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f5;font-size:13px;font-weight:700;color:hsl(258,78%,50%);text-align:right;">৳${item.total}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(100,60,200,0.10);">
    
    <!-- Header -->
    <div style="background:${BRAND_GRADIENT};padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">${SITE_NAME}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">অর্ডার কনফার্মেশন ইনভয়েস</p>
    </div>

    <!-- Status Banner -->
    <div style="background:${statusInfo.color}15;border-left:4px solid ${statusInfo.color};margin:24px 28px 0;padding:14px 18px;border-radius:0 10px 10px 0;">
      <p style="margin:0;font-size:15px;font-weight:700;color:${statusInfo.color};">${statusInfo.emoji} অর্ডার স্ট্যাটাস: ${statusInfo.bn}</p>
    </div>

    <!-- Order Info -->
    <div style="padding:24px 28px 0;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;background:#f9f9fc;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
        <div>
          <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">অর্ডার নম্বর</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:hsl(258,78%,50%);">#${order.order_number}</p>
        </div>
        <div>
          <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">তারিখ</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#374151;">${new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
        </div>
        <div>
          <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">পেমেন্ট</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#374151;">${order.payment_method?.toUpperCase() || 'N/A'}</p>
        </div>
      </div>

      <!-- Items Table -->
      <h3 style="font-size:13px;font-weight:700;color:#374151;margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em;">অর্ডারকৃত প্রোডাক্ট</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#f5f5f7;">
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:left;text-transform:uppercase;">প্রোডাক্ট</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:center;text-transform:uppercase;">পরিমাণ</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:right;text-transform:uppercase;">মূল্য</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:right;text-transform:uppercase;">মোট</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Totals -->
      <div style="border-top:2px solid #f0f0f5;padding-top:14px;margin-bottom:20px;">
        ${order.discount_amount > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#6b7280;">সাবটোটাল</span>
          <span style="font-size:13px;color:#374151;">৳${order.subtotal}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#10b981;">ছাড় (${order.coupon_code || ''})</span>
          <span style="font-size:13px;color:#10b981;">-৳${order.discount_amount}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:1px dashed #e5e7eb;margin-top:6px;">
          <span style="font-size:16px;font-weight:800;color:#111827;">সর্বমোট</span>
          <span style="font-size:18px;font-weight:900;color:hsl(258,78%,50%);">৳${order.total}</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;padding:8px 0 28px;">
        <a href="${SITE_URL}/dashboard" style="display:inline-block;background:${BRAND_GRADIENT};color:#fff;font-size:14px;font-weight:700;border-radius:12px;padding:13px 28px;text-decoration:none;">
          📋 আমার অর্ডার দেখুন
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9fc;border-top:1px solid #f0f0f5;padding:18px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">ধন্যবাদ <strong>${SITE_NAME}</strong>-এ কেনাকাটা করার জন্য 🙏</p>
      <p style="margin:6px 0 0;font-size:11px;color:#c4c4c4;"><a href="${SITE_URL}" style="color:hsl(258,78%,55%);text-decoration:none;">${SITE_URL}</a></p>
    </div>
  </div>
</body>
</html>`
}

function buildStatusUpdateHtml(order: any, newStatus: string) {
  const statusInfo = STATUS_LABELS[newStatus] || { bn: newStatus, emoji: '📋', color: '#6b7280' }
  
  const messages: Record<string, string> = {
    processing: 'আপনার অর্ডারটি আমরা প্রক্রিয়া করছি। শীঘ্রই ডেলিভারি হবে।',
    completed:  'আপনার অর্ডার সম্পন্ন হয়েছে। আপনার ড্যাশবোর্ড থেকে ডাউনলোড/লাইসেন্স কী দেখুন।',
    delivered:  'আপনার অর্ডার ডেলিভার করা হয়েছে। ধন্যবাদ!',
    cancelled:  'আপনার অর্ডারটি বাতিল করা হয়েছে। কোনো প্রশ্ন থাকলে সাপোর্টে যোগাযোগ করুন।',
    refunded:   'আপনার অর্ডারের রিফান্ড প্রক্রিয়া সম্পন্ন হয়েছে।',
  }
  const message = messages[newStatus] || 'আপনার অর্ডারের স্ট্যাটাস আপডেট হয়েছে।'

  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(100,60,200,0.10);">
    <div style="background:${BRAND_GRADIENT};padding:24px 28px;">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">${SITE_NAME}</h1>
    </div>
    <div style="padding:28px;">
      <h2 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 6px;">${statusInfo.emoji} অর্ডার স্ট্যাটাস আপডেট</h2>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 20px;">অর্ডার #${order.order_number}</p>
      
      <div style="background:${statusInfo.color}12;border:1.5px solid ${statusInfo.color}35;border-radius:12px;padding:18px 20px;margin-bottom:20px;text-align:center;">
        <p style="margin:0;font-size:24px;">${statusInfo.emoji}</p>
        <p style="margin:8px 0 4px;font-size:18px;font-weight:900;color:${statusInfo.color};">${statusInfo.bn}</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">${message}</p>
      </div>

      <div style="text-align:center;">
        <a href="${SITE_URL}/dashboard" style="display:inline-block;background:${BRAND_GRADIENT};color:#fff;font-size:14px;font-weight:700;border-radius:12px;padding:12px 26px;text-decoration:none;">
          📋 আমার অর্ডার দেখুন
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
        ধন্যবাদ <strong>${SITE_NAME}</strong>-এ কেনাকাটা করার জন্য 🙏<br>
        <a href="${SITE_URL}" style="color:hsl(258,78%,55%);text-decoration:none;">${SITE_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

function buildPromoHtml(subject: string, body: string, ctaText?: string, ctaUrl?: string) {
  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(100,60,200,0.10);">
    <div style="background:${BRAND_GRADIENT};padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">${SITE_NAME}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">বিশেষ অফার</p>
    </div>
    <div style="padding:32px 32px 24px;">
      <h2 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 16px;">${subject}</h2>
      <div style="font-size:14px;color:#374151;line-height:1.8;white-space:pre-wrap;">${body}</div>
      ${ctaText && ctaUrl ? `
      <div style="text-align:center;margin-top:28px;">
        <a href="${ctaUrl}" style="display:inline-block;background:${BRAND_GRADIENT};color:#fff;font-size:15px;font-weight:700;border-radius:12px;padding:14px 32px;text-decoration:none;">
          ${ctaText}
        </a>
      </div>` : ''}
    </div>
    <div style="background:#f9f9fc;border-top:1px solid #f0f0f5;padding:16px 28px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#c4c4c4;">
        <a href="${SITE_URL}" style="color:hsl(258,78%,55%);text-decoration:none;">${SITE_URL}</a> | 
        সাপোর্ট: info@shahedstore.com.bd
      </p>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { type, orderId, newStatus, promoSubject, promoBody, ctaText, ctaUrl, recipientEmails } = body

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!

    // ── ORDER CONFIRMATION ──────────────────────────────────────────
    if (type === 'order_confirmation') {
      const { data: order } = await supabaseAdmin
        .from('orders').select('*').eq('id', orderId).single()
      if (!order) throw new Error('Order not found')

      const { data: items } = await supabaseAdmin
        .from('order_items').select('*').eq('order_id', orderId)

      const html = buildInvoiceHtml(order, items || [])

      await fetch('https://api.lovable.dev/v1/email/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${SITE_NAME} <noreply@noreply.shahedstore.com.bd>`,
          to: order.customer_email,
          subject: `✅ অর্ডার কনফার্ম হয়েছে — #${order.order_number}`,
          html,
        }),
      })

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── STATUS UPDATE ───────────────────────────────────────────────
    if (type === 'status_update') {
      const { data: order } = await supabaseAdmin
        .from('orders').select('*').eq('id', orderId).single()
      if (!order) throw new Error('Order not found')

      const html = buildStatusUpdateHtml(order, newStatus)

      const statusInfo = STATUS_LABELS[newStatus] || { bn: newStatus, emoji: '📋' }

      await fetch('https://api.lovable.dev/v1/email/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${SITE_NAME} <noreply@noreply.shahedstore.com.bd>`,
          to: order.customer_email,
          subject: `${statusInfo.emoji} অর্ডার স্ট্যাটাস আপডেট: ${statusInfo.bn} — #${order.order_number}`,
          html,
        }),
      })

      // Push notification to dashboard
      if (order.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: order.user_id,
          title: `অর্ডার স্ট্যাটাস আপডেট ${statusInfo.emoji}`,
          message: `আপনার অর্ডার #${order.order_number} এর স্ট্যাটাস "${statusInfo.bn}" হয়েছে।`,
          type: 'order',
          link: '/dashboard',
        })
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── PROMO BULK EMAIL ────────────────────────────────────────────
    if (type === 'promotional') {
      const emails: string[] = recipientEmails || []
      const html = buildPromoHtml(promoSubject, promoBody, ctaText, ctaUrl)

      let sent = 0
      const batchSize = 10
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize)
        await Promise.all(batch.map(email =>
          fetch('https://api.lovable.dev/v1/email/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: `${SITE_NAME} <noreply@noreply.shahedstore.com.bd>`,
              to: email,
              subject: promoSubject,
              html,
            }),
          })
        ))
        sent += batch.length
        if (i + batchSize < emails.length) {
          await new Promise(r => setTimeout(r, 300))
        }
      }

      return new Response(JSON.stringify({ success: true, sent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
