import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendLovableEmail } from 'npm:@lovable.dev/email-js'

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
  const PM_LABELS: Record<string, string> = {
    bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket',
    upay: 'Upay', bkash_merchant: 'bKash Merchant', wallet: 'Wallet'
  }
  const dateFormatted = new Date(order.created_at).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateEn = new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })

  const itemsHtml = items.map((item, idx) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#4b5563;vertical-align:top;">
        <span style="display:inline-block;background:#ede9fe;color:#7c3aed;border-radius:4px;padding:1px 7px;font-size:11px;font-weight:700;margin-right:6px;">${idx + 1}</span>
        <strong style="color:#111827;">${item.product_name}</strong>
        ${item.license_key ? `<br><span style="font-size:11px;color:#7c3aed;font-family:monospace;background:#f5f3ff;padding:2px 8px;border-radius:4px;display:inline-block;margin-top:4px;">🔑 ${item.license_key}</span>` : ''}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#6b7280;text-align:center;white-space:nowrap;">×${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#6b7280;text-align:right;white-space:nowrap;">৳${Number(item.price).toLocaleString('en-US')}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f5;font-size:14px;font-weight:700;color:#7c3aed;text-align:right;white-space:nowrap;">৳${Number(item.total).toLocaleString('en-US')}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>অর্ডার কনফার্মেশন — #${order.order_number}</title>
</head>
<body style="margin:0;padding:0;background:#f0edf8;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">

  <div style="max-width:620px;margin:32px auto 48px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(124,58,237,0.13);">

    <!-- ═══ TOP LOGO BAR ═══ -->
    <div style="background:#ffffff;padding:22px 32px;border-bottom:3px solid #7c3aed;display:flex;align-items:center;justify-content:space-between;">
      <img src="${SITE_URL}/logo.png" alt="${SITE_NAME}" height="44" style="display:block;height:44px;width:auto;object-fit:contain;" />
      <div style="text-align:right;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;">Invoice</div>
        <div style="font-size:15px;font-weight:800;color:#7c3aed;font-family:monospace;">#${order.order_number}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${dateEn}</div>
      </div>
    </div>

    <!-- ═══ HERO GREETING ═══ -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#0ea5e9 100%);padding:32px 36px;">
      <div style="font-size:13px;color:rgba(255,255,255,0.8);font-weight:500;letter-spacing:.05em;margin-bottom:8px;">আস্সালামু আলাইকুম,</div>
      <div style="font-size:22px;font-weight:900;color:#ffffff;margin-bottom:8px;">${order.customer_name} 👋</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.85);line-height:1.6;">
        আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
      </div>
      <!-- Status pill -->
      <div style="margin-top:18px;display:inline-block;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.35);border-radius:999px;padding:6px 18px;">
        <span style="font-size:13px;font-weight:700;color:#fff;">${statusInfo.emoji} স্ট্যাটাস: ${statusInfo.bn}</span>
      </div>
    </div>

    <!-- ═══ ORDER + CUSTOMER INFO GRID ═══ -->
    <div style="padding:28px 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <!-- Order details card -->
          <td width="50%" style="vertical-align:top;padding-right:10px;">
            <div style="background:#f8f5ff;border-radius:14px;padding:18px 20px;border:1px solid #ede9fe;">
              <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#7c3aed;margin-bottom:12px;">📋 অর্ডার তথ্য</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="font-size:12px;color:#6b7280;padding-bottom:7px;">অর্ডার নম্বর</td><td style="font-size:12px;font-weight:700;color:#111827;text-align:right;padding-bottom:7px;">#${order.order_number}</td></tr>
                <tr><td style="font-size:12px;color:#6b7280;padding-bottom:7px;">তারিখ</td><td style="font-size:12px;font-weight:600;color:#111827;text-align:right;padding-bottom:7px;">${dateFormatted}</td></tr>
                <tr><td style="font-size:12px;color:#6b7280;padding-bottom:7px;">পেমেন্ট মেথড</td><td style="font-size:12px;font-weight:700;color:#7c3aed;text-align:right;padding-bottom:7px;">${PM_LABELS[order.payment_method] || (order.payment_method || 'N/A').toUpperCase()}</td></tr>
                ${order.transaction_id ? `<tr><td style="font-size:12px;color:#6b7280;padding-bottom:7px;">TrxID</td><td style="font-size:11px;font-weight:600;color:#111827;text-align:right;font-family:monospace;padding-bottom:7px;">${order.transaction_id}</td></tr>` : ''}
                <tr><td style="font-size:12px;color:#6b7280;">পেমেন্ট স্ট্যাটাস</td><td style="text-align:right;"><span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;background:${order.payment_status === 'paid' ? '#dcfce7' : '#fef3c7'};color:${order.payment_status === 'paid' ? '#15803d' : '#b45309'};">${order.payment_status === 'paid' ? '✅ পেইড' : '⏳ পেন্ডিং'}</span></td></tr>
              </table>
            </div>
          </td>
          <!-- Customer details card -->
          <td width="50%" style="vertical-align:top;padding-left:10px;">
            <div style="background:#f0f9ff;border-radius:14px;padding:18px 20px;border:1px solid #bae6fd;">
              <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#0284c7;margin-bottom:12px;">👤 গ্রাহকের তথ্য</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="font-size:12px;color:#6b7280;padding-bottom:7px;">নাম</td><td style="font-size:12px;font-weight:700;color:#111827;text-align:right;padding-bottom:7px;">${order.customer_name}</td></tr>
                <tr><td style="font-size:12px;color:#6b7280;padding-bottom:7px;">ইমেইল</td><td style="font-size:11px;color:#0284c7;text-align:right;padding-bottom:7px;">${order.customer_email}</td></tr>
                ${order.customer_phone ? `<tr><td style="font-size:12px;color:#6b7280;">ফোন</td><td style="font-size:12px;font-weight:600;color:#111827;text-align:right;">${order.customer_phone}</td></tr>` : ''}
              </table>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ ITEMS TABLE ═══ -->
    <div style="padding:24px 32px 0;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#374151;margin-bottom:12px;">📦 অর্ডারকৃত পণ্য</div>
      <div style="border-radius:14px;overflow:hidden;border:1px solid #ede9fe;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead>
            <tr style="background:#7c3aed;">
              <th style="padding:11px 16px;font-size:11px;font-weight:700;color:#ffffff;text-align:left;letter-spacing:.06em;">পণ্যের নাম</th>
              <th style="padding:11px 16px;font-size:11px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:.06em;">পরিমাণ</th>
              <th style="padding:11px 16px;font-size:11px;font-weight:700;color:#ffffff;text-align:right;letter-spacing:.06em;">একক মূল্য</th>
              <th style="padding:11px 16px;font-size:11px;font-weight:700;color:#ffffff;text-align:right;letter-spacing:.06em;">মোট</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ TOTALS ═══ -->
    <div style="padding:20px 32px;">
      <div style="display:flex;justify-content:flex-end;">
        <div style="min-width:260px;background:#f8f5ff;border-radius:14px;padding:18px 20px;border:1px solid #ede9fe;">
          ${order.subtotal && Number(order.discount_amount) > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:9px;">
            <span style="font-size:13px;color:#6b7280;">সাবটোটাল</span>
            <span style="font-size:13px;color:#374151;">৳${Number(order.subtotal).toLocaleString('en-US')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:9px;">
            <span style="font-size:13px;color:#059669;">🎉 ছাড় ${order.coupon_code ? '(' + order.coupon_code + ')' : ''}</span>
            <span style="font-size:13px;font-weight:700;color:#059669;">-৳${Number(order.discount_amount).toLocaleString('en-US')}</span>
          </div>
          <hr style="border:none;border-top:1px dashed #d8b4fe;margin:0 0 9px;">` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:15px;font-weight:800;color:#111827;">সর্বমোট</span>
            <span style="font-size:22px;font-weight:900;color:#7c3aed;">৳${Number(order.total).toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>
    </div>

    ${order.notes ? `
    <!-- Notes -->
    <div style="padding:0 32px 20px;">
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:12px 16px;">
        <span style="font-size:12px;font-weight:700;color:#b45309;">📝 গ্রাহকের নোট:</span>
        <span style="font-size:12px;color:#374151;margin-left:6px;">${order.notes}</span>
      </div>
    </div>` : ''}

    <!-- ═══ CTA BUTTON ═══ -->
    <div style="padding:8px 32px 32px;text-align:center;">
      <a href="${SITE_URL}/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#0ea5e9);color:#fff;font-size:15px;font-weight:800;border-radius:14px;padding:15px 36px;text-decoration:none;letter-spacing:.02em;box-shadow:0 4px 18px rgba(124,58,237,0.35);">
        📋 আমার অর্ডার ট্র্যাক করুন →
      </a>
      <div style="margin-top:14px;font-size:12px;color:#9ca3af;">
        কোনো সমস্যা হলে আমাদের <a href="${SITE_URL}/contact" style="color:#7c3aed;text-decoration:none;font-weight:600;">সাপোর্ট</a>-এ যোগাযোগ করুন
      </div>
    </div>

    <!-- ═══ FOOTER ═══ -->
    <div style="background:#1e1b4b;padding:24px 32px;text-align:center;">
      <img src="${SITE_URL}/logo.png" alt="${SITE_NAME}" height="36" style="display:block;margin:0 auto 14px;height:36px;width:auto;opacity:0.9;" />
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-bottom:4px;line-height:1.7;">
        আপনার অর্ডারের জন্য আন্তরিক ধন্যবাদ। ✨<br>
        <strong style="color:#a78bfa;">${SITE_NAME}</strong>-এ আপনাকে স্বাগত জানাতে পেরে আমরা গর্বিত।
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:12px;line-height:1.8;">
        <a href="${SITE_URL}" style="color:#818cf8;text-decoration:none;font-weight:600;">${SITE_URL}</a>
        &nbsp;•&nbsp; support@shahedstore.com.bd
      </div>
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
    <div style="background:#ffffff;padding:16px 28px;border-bottom:3px solid hsl(258,78%,55%);">
      <img src="${SITE_URL}/logo.png" width="160" height="50" alt="${SITE_NAME}" style="display:block;max-height:50px;width:auto;object-fit:contain;" />
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

      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.8;">
        আপনার অর্ডারের জন্য আন্তরিক ধন্যবাদ। ✨<br>
        <strong>${SITE_NAME}</strong>-এ আপনাকে সেবা দিতে পেরে আমরা সর্বদা আনন্দিত।<br>
        <a href="${SITE_URL}" style="color:hsl(258,78%,55%);text-decoration:none;font-weight:600;">${SITE_URL}</a>
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

function buildAdminOrderHtml(order: any, items: any[], adminCount: number) {
  const paymentMethodLabels: Record<string, string> = {
    bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket',
    upay: 'Upay', bkash_merchant: 'bKash Merchant', wallet: 'Wallet',
  }
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#374151;">${item.product_name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f5;font-size:13px;color:#6b7280;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f5;font-size:13px;font-weight:700;color:hsl(258,78%,50%);text-align:right;">৳${item.total}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(100,60,200,0.12);">

    <!-- Admin Header -->
    <div style="background:#ffffff;padding:16px 28px;border-bottom:3px solid hsl(258,78%,55%);">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <img src="${SITE_URL}/logo.png" width="160" height="50" alt="${SITE_NAME}" style="display:block;max-height:50px;width:auto;object-fit:contain;" />
        <div style="background:hsl(258,78%,55%);border-radius:10px;padding:10px 14px;text-align:center;">
          <p style="margin:0;color:#fff;font-size:11px;opacity:0.8;">অর্ডার নম্বর</p>
          <p style="margin:4px 0 0;color:#fff;font-size:16px;font-weight:900;">#${order.order_number}</p>
        </div>
      </div>
    </div>

    <!-- New Order Badge -->
    <div style="padding:20px 28px 0;text-align:center;">
      <span style="display:inline-block;background:#dcfce7;color:#15803d;padding:7px 20px;border-radius:100px;font-size:13px;font-weight:700;">🛒 নতুন অর্ডার পাওয়া গেছে!</span>
    </div>

    <!-- Customer Info -->
    <div style="padding:16px 28px 0;">
      <h3 style="font-size:12px;font-weight:700;color:#9ca3af;margin:0 0 10px;text-transform:uppercase;letter-spacing:.08em;">👤 গ্রাহকের তথ্য</h3>
      <table width="100%" style="background:#f9f9fc;border-radius:10px;overflow:hidden;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;width:35%;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>নাম</strong></td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #eee;">${order.customer_name}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>ইমেইল</strong></td>
          <td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #eee;"><a href="mailto:${order.customer_email}" style="color:hsl(258,78%,55%);text-decoration:none;">${order.customer_email}</a></td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>ফোন</strong></td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;border-bottom:1px solid #eee;">${order.customer_phone || 'উল্লেখ নেই'}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-right:1px solid #eee;"><strong>পেমেন্ট</strong></td>
          <td style="padding:10px 14px;font-size:13px;font-weight:700;color:${order.payment_method === 'wallet' ? '#7c3aed' : '#059669'};">${paymentMethodLabels[order.payment_method] || order.payment_method} ${order.transaction_id ? `— TxID: ${order.transaction_id}` : ''}</td>
        </tr>
      </table>
    </div>

    <!-- Order Items -->
    <div style="padding:16px 28px 0;">
      <h3 style="font-size:12px;font-weight:700;color:#9ca3af;margin:0 0 10px;text-transform:uppercase;letter-spacing:.08em;">📦 অর্ডারকৃত পণ্য</h3>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f5f5f7;">
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:left;">পণ্য</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:center;">পরিমাণ</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-align:right;">মোট</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <!-- Total -->
    <div style="padding:16px 28px 0;">
      <div style="background:linear-gradient(135deg,hsl(258,78%,97%),hsl(200,90%,97%));border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          ${order.discount_amount > 0 ? `<p style="margin:0 0 4px;font-size:12px;color:#6b7280;">সাবটোটাল: ৳${order.subtotal} | ছাড়: -৳${order.discount_amount}</p>` : ''}
          <p style="margin:0;font-size:12px;color:#6b7280;">পেমেন্ট স্ট্যাটাস: <strong style="color:${order.payment_status === 'paid' ? '#059669' : '#d97706'};">${order.payment_status === 'paid' ? '✅ পেইড' : '⏳ পেন্ডিং'}</strong></p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">সর্বমোট</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:hsl(258,78%,50%);">৳${order.total}</p>
        </div>
      </div>
    </div>

    ${order.notes ? `
    <div style="padding:12px 28px 0;">
      <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:10px 14px;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:12px;color:#92400e;"><strong>📌 গ্রাহকের নোট:</strong> ${order.notes}</p>
      </div>
    </div>` : ''}

    <!-- CTA -->
    <div style="padding:20px 28px 28px;text-align:center;">
      <a href="${SITE_URL}/admin/orders"
        style="display:inline-block;background:${BRAND_GRADIENT};color:#fff;font-size:14px;font-weight:700;border-radius:12px;padding:13px 28px;text-decoration:none;">
        🔍 অ্যাডমিন প্যানেলে দেখুন →
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#c4c4c4;">এই নোটিফিকেশনটি ${adminCount} জন অ্যাডমিনকে পাঠানো হয়েছে।</p>
    </div>

    <div style="background:#f9f9fc;border-top:1px solid #f0f0f5;padding:16px 28px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">${SITE_NAME} Admin Notification — স্বয়ংক্রিয় বার্তা</p>
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
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders').select('*').eq('id', orderId).single()
      if (orderErr || !order) {
        console.error('[order_confirmation] Order fetch error:', orderErr, 'orderId:', orderId)
        throw new Error('Order not found')
      }

      const { data: items } = await supabaseAdmin
        .from('order_items').select('*').eq('order_id', orderId)

      console.log(`[order_confirmation] Sending email to: ${order.customer_email} for order #${order.order_number}`)

      const html = buildInvoiceHtml(order, items || [])

      await sendLovableEmail(
        {
          idempotency_key: `order-confirm-${order.id}`,
          unsubscribe_token: crypto.randomUUID(),
          to: order.customer_email,
          from: `${SITE_NAME} <noreply@notify.shahedstore.com.bd>`,
          sender_domain: 'notify.shahedstore.com.bd',
          subject: `✅ অর্ডার কনফার্ম হয়েছে — #${order.order_number}`,
          html,
          text: `অর্ডার কনফার্ম হয়েছে — #${order.order_number}\nমোট: ৳${order.total}\nধন্যবাদ ${order.customer_name}!`,
          purpose: 'transactional',
          label: 'order_confirmation',
        },
        { apiKey: LOVABLE_API_KEY }
      )

      console.log(`[order_confirmation] Email sent successfully to ${order.customer_email}`)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── STATUS UPDATE ───────────────────────────────────────────────
    if (type === 'status_update') {
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders').select('*').eq('id', orderId).single()
      if (orderErr || !order) {
        console.error('[status_update] Order fetch error:', orderErr, 'orderId:', orderId)
        throw new Error('Order not found')
      }

      const html = buildStatusUpdateHtml(order, newStatus)
      const statusInfo = STATUS_LABELS[newStatus] || { bn: newStatus, emoji: '📋' }

      console.log(`[status_update] Sending status email to: ${order.customer_email} — ${newStatus}`)

      try {
        await sendLovableEmail(
          {
            idempotency_key: `order-status-${order.id}-${newStatus}`,
            unsubscribe_token: crypto.randomUUID(),
            to: order.customer_email,
            from: `${SITE_NAME} <noreply@notify.shahedstore.com.bd>`,
            sender_domain: 'notify.shahedstore.com.bd',
            subject: `${statusInfo.emoji} অর্ডার স্ট্যাটাস আপডেট: ${statusInfo.bn} — #${order.order_number}`,
            html,
            text: `অর্ডার #${order.order_number} এর স্ট্যাটাস "${statusInfo.bn}" হয়েছে। ${SITE_URL}/dashboard`,
            purpose: 'transactional',
            label: 'status_update',
          },
          { apiKey: LOVABLE_API_KEY }
        )
        console.log(`[status_update] Email sent to ${order.customer_email}`)
      } catch (emailErr) {
        console.error('[status_update] Email send failed:', emailErr)
      }

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

    // ── ADMIN NEW ORDER NOTIFY ──────────────────────────────────────
    if (type === 'admin_notify') {
      const { data: order } = await supabaseAdmin
        .from('orders').select('*').eq('id', orderId).single()
      if (!order) throw new Error('Order not found')

      const { data: items } = await supabaseAdmin
        .from('order_items').select('*').eq('order_id', orderId)

      // Get all admin emails from user_roles + profiles
      const { data: adminRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      const adminUserIds = adminRoles?.map(r => r.user_id) || []

      let adminEmails: string[] = []
      if (adminUserIds.length > 0) {
        const { data: adminProfiles } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .in('user_id', adminUserIds)
          .not('email', 'is', null)
        adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || []
      }

      // Also add ADMIN_EMAIL secret & site_settings admin_email as fallback
      const secretAdminEmail = Deno.env.get('ADMIN_EMAIL')
      if (secretAdminEmail && !adminEmails.includes(secretAdminEmail)) {
        adminEmails.push(secretAdminEmail)
      }

      // Also check site_settings for admin_email
      const { data: settingRow } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'admin_email')
        .maybeSingle()
      if (settingRow?.value && !adminEmails.includes(settingRow.value)) {
        adminEmails.push(settingRow.value)
      }

      // Deduplicate
      adminEmails = [...new Set(adminEmails.filter(Boolean))]

      if (adminEmails.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'No admin emails found' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const html = buildAdminOrderHtml(order, items || [], adminEmails.length)
      const subject = `🛒 নতুন অর্ডার #${order.order_number} — ${order.customer_name} — ৳${order.total}`

      // Send to all admins
      const results = await Promise.allSettled(
        adminEmails.map((email, idx) =>
          sendLovableEmail(
            {
              idempotency_key: `admin-notify-${order.id}-${idx}`,
              unsubscribe_token: crypto.randomUUID(),
              to: email,
              from: `${SITE_NAME} <noreply@notify.shahedstore.com.bd>`,
              sender_domain: 'notify.shahedstore.com.bd',
              subject,
              html,
              text: `নতুন অর্ডার #${order.order_number} — ${order.customer_name} — ৳${order.total}\n${SITE_URL}/admin/orders`,
              purpose: 'transactional',
              label: 'admin_order_notify',
            },
            { apiKey: LOVABLE_API_KEY }
          )
        )
      )

      const sent = results.filter(r => r.status === 'fulfilled').length
      const errors = results.filter(r => r.status === 'rejected').map(r => (r as any).reason?.message)
      if (errors.length > 0) console.error('[admin_notify] Some emails failed:', errors)

      return new Response(JSON.stringify({ success: true, sent, total: adminEmails.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── PROMO BULK EMAIL ────────────────────────────────────────────
    if (type === 'promotional') {
      const emails: string[] = recipientEmails || []
      const html = buildPromoHtml(promoSubject, promoBody, ctaText, ctaUrl)

      let sent = 0
      const batchSize = 10
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize)
        await Promise.allSettled(batch.map((email, idx) =>
          sendLovableEmail(
            {
              idempotency_key: `promo-${Date.now()}-${i + idx}`,
              unsubscribe_token: crypto.randomUUID(),
              to: email,
              from: `${SITE_NAME} <noreply@notify.shahedstore.com.bd>`,
              sender_domain: 'notify.shahedstore.com.bd',
              subject: promoSubject,
              html,
              text: promoBody || promoSubject,
              purpose: 'transactional',
              label: 'promotional',
            },
            { apiKey: LOVABLE_API_KEY }
          )
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
