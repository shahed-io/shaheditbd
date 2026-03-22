import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      ticketNumber, customerName, customerEmail, customerPhone,
      orderNumber, productName, reason, reasonDetail,
      subscriptionPeriod, daysUsed, daysRemaining,
      paymentAmount, paymentMethod, additionalInfo,
      screenshotUrls = [], isChangeOfMind, refundAmount,
    } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get admin email from site_settings
    const { data: settingRows } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['admin_email', 'store_name']);

    const adminEmail = settingRows?.find(r => r.key === 'admin_email')?.value || 'admin@shahedstore.com.bd';
    const storeName = settingRows?.find(r => r.key === 'store_name')?.value || 'Shahed Store';

    // Build screenshot HTML
    const screenshotHtml = screenshotUrls.length > 0
      ? `<tr><td style="padding:10px 24px;font-size:13px;color:#555;border-bottom:1px solid #eee;">
          <strong>📸 স্ক্রিনশট (${screenshotUrls.length}টি):</strong><br/>
          ${screenshotUrls.map((u: string, i: number) => `<a href="${u}" target="_blank" style="color:#7c3aed;display:block;margin-top:4px;">${i + 1}. স্ক্রিনশট দেখুন →</a>`).join('')}
        </td></tr>`
      : '';

    const deductionHtml = isChangeOfMind
      ? `<tr><td style="padding:10px 24px;background:#fff3cd;border-bottom:1px solid #eee;">
          <span style="color:#856404;font-size:13px;font-weight:600;">⚠️ মন পরিবর্তন — ১০% কেটে ৳${refundAmount} রিফান্ড হবে</span>
        </td></tr>`
      : '';

    const emailHtml = `
<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"><title>নতুন রিফান্ড রিকোয়েস্ট</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:28px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🔄 নতুন রিফান্ড রিকোয়েস্ট</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">টিকেট নম্বর: <strong>${ticketNumber}</strong></p>
        </td></tr>
        
        <!-- Alert badge -->
        <tr><td style="padding:16px 24px 0;text-align:center;">
          <span style="display:inline-block;background:#fee2e2;color:#b91c1c;padding:6px 16px;border-radius:100px;font-size:12px;font-weight:600;">⚡ অবিলম্বে পর্যালোচনা প্রয়োজন</span>
        </td></tr>

        <!-- Customer Info -->
        <tr><td style="padding:16px 24px 0;">
          <h2 style="font-size:14px;font-weight:700;color:#333;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">👤 গ্রাহকের তথ্য</h2>
        </td></tr>
        <tr><td style="padding:0 24px;">
          <table width="100%" style="background:#f9f9f9;border-radius:8px;overflow:hidden;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;width:40%;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>নাম</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;border-bottom:1px solid #eee;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>ইমেইল</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;border-bottom:1px solid #eee;"><a href="mailto:${customerEmail}" style="color:#7c3aed;">${customerEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;border-right:1px solid #eee;"><strong>ফোন</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;">${customerPhone || 'উল্লেখ নেই'}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Refund Details -->
        <tr><td style="padding:16px 24px 0;">
          <h2 style="font-size:14px;font-weight:700;color:#333;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">📦 রিফান্ডের বিবরণ</h2>
        </td></tr>
        <tr><td style="padding:0 24px 16px;">
          <table width="100%" style="border:1px solid #eee;border-radius:8px;overflow:hidden;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;width:40%;background:#fafafa;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>অর্ডার নম্বর</strong></td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#7c3aed;border-bottom:1px solid #eee;">#${orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;background:#fafafa;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>পণ্যের নাম</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;border-bottom:1px solid #eee;">${productName || 'উল্লেখ নেই'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;background:#fafafa;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>রিফান্ডের কারণ</strong></td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#dc2626;border-bottom:1px solid #eee;">${reason}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;background:#fafafa;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>বিস্তারিত</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;border-bottom:1px solid #eee;">${reasonDetail || 'উল্লেখ নেই'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;background:#fafafa;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>সাবস্ক্রিপশন মেয়াদ</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;border-bottom:1px solid #eee;">${subscriptionPeriod || 'উল্লেখ নেই'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;background:#fafafa;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>ব্যবহৃত / বাকি দিন</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;border-bottom:1px solid #eee;">${daysUsed || '—'} দিন ব্যবহার / ${daysRemaining || '—'} দিন বাকি</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;background:#fafafa;border-right:1px solid #eee;border-bottom:1px solid #eee;"><strong>পেমেন্ট পরিমাণ</strong></td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#222;border-bottom:1px solid #eee;">${paymentAmount ? '৳' + paymentAmount : 'উল্লেখ নেই'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#555;background:#fafafa;border-right:1px solid #eee;"><strong>পেমেন্ট মাধ্যম</strong></td>
              <td style="padding:10px 14px;font-size:13px;color:#222;">${paymentMethod || 'উল্লেখ নেই'}</td>
            </tr>
            ${deductionHtml}
            ${screenshotHtml}
          </table>
        </td></tr>

        ${additionalInfo ? `
        <tr><td style="padding:0 24px 16px;">
          <div style="background:#f0f0ff;border-left:3px solid #7c3aed;padding:12px 14px;border-radius:0 8px 8px 0;">
            <strong style="font-size:13px;color:#4c1d95;">📌 অতিরিক্ত তথ্য:</strong>
            <p style="margin:6px 0 0;font-size:13px;color:#555;">${additionalInfo}</p>
          </div>
        </td></tr>` : ''}

        <!-- CTA -->
        <tr><td style="padding:0 24px 28px;text-align:center;">
          <a href="https://shahedstore.com.bd/admin/tickets"
            style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">
            🔍 অ্যাডমিন প্যানেলে দেখুন →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:11px;color:#999;">${storeName} — স্বয়ংক্রিয় নোটিফিকেশন। এই ইমেইলে উত্তর দেবেন না।</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send email via Lovable email infrastructure
    const emailPayload = {
      to: adminEmail,
      subject: `🔄 নতুন রিফান্ড রিকোয়েস্ট — ${ticketNumber} (অর্ডার: #${orderNumber})`,
      html: emailHtml,
      text: `নতুন রিফান্ড রিকোয়েস্ট\nটিকেট: ${ticketNumber}\nগ্রাহক: ${customerName}\nঅর্ডার: #${orderNumber}\nকারণ: ${reason}`,
    };

    // Try to send via Lovable email API
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const projectId = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];

    let emailSent = false;

    if (lovableApiKey && projectId) {
      try {
        const emailRes = await fetch(`https://api.lovable.dev/api/v1/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
            'x-project-id': projectId,
          },
          body: JSON.stringify({
            ...emailPayload,
            purpose: 'transactional',
            idempotency_key: `refund-admin-notify-${ticketNumber}`,
          }),
        });
        if (emailRes.ok) emailSent = true;
      } catch (_) {
        // fallback: log to database only
      }
    }

    // Always log to email_send_log for admin visibility
    await supabase.from('email_send_log').insert({
      recipient_email: adminEmail,
      template_name: 'refund_request_notification',
      status: emailSent ? 'sent' : 'logged',
      metadata: { ticketNumber, orderNumber, customerName, customerEmail },
    });

    return new Response(JSON.stringify({ success: true, emailSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('notify-refund-request error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
