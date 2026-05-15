import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SITE = Deno.env.get('PUBLIC_SITE_URL') || 'https://shahedstore.com.bd'

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

const daysBetween = (iso: string | null) => {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / 86400000)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Lookahead window: today through +7 days. Re-send no more than once per 6 days.
  const now = new Date()
  const horizon = new Date(now.getTime() + 7 * 86400000).toISOString()
  const reminderCutoff = new Date(now.getTime() - 6 * 86400000).toISOString()

  const results: any = { order_items: 0, personal_licenses: 0, notifications: 0, failed: 0 }

  try {
    // 1) order_items expiring within 7 days
    const { data: items } = await supabase
      .from('order_items')
      .select('id, product_name, expires_at, last_reminder_sent_at, orders!inner(id, order_number, customer_name, customer_email, user_id, status)')
      .not('expires_at', 'is', null)
      .lte('expires_at', horizon)
      .gte('expires_at', now.toISOString())
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lte.${reminderCutoff}`)

    for (const it of (items || []) as any[]) {
      const order = it.orders
      if (!order?.customer_email) continue
      if (order.status && order.status !== 'completed') continue
      const days = daysBetween(it.expires_at)
      const today = now.toISOString().slice(0, 10)
      try {
        const { error } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'subscription-renewal-reminder',
            recipientEmail: order.customer_email,
            idempotencyKey: `auto-subrenew-oi-${it.id}-${today}`,
            templateData: {
              customerName: order.customer_name || 'Customer',
              productName: it.product_name,
              expiryDate: fmtDate(it.expires_at),
              daysLeft: days,
              renewUrl: `${SITE}/shop`,
              orderNumber: order.order_number,
            },
          },
        })
        if (error) throw error
        await supabase.from('order_items').update({ last_reminder_sent_at: now.toISOString() }).eq('id', it.id)
        results.order_items++

        // In-app notification for logged-in customers
        if (order.user_id) {
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            type: 'warning',
            title: 'Subscription expiring soon',
            message: `Your "${it.product_name}" subscription ${days === 0 ? 'expires today' : `expires in ${days} day${days === 1 ? '' : 's'}`} (${fmtDate(it.expires_at)}). Renew now to avoid interruption.`,
            link: '/dashboard?tab=subscriptions',
          })
          results.notifications++
        }
      } catch (e) {
        console.error('order_item reminder failed', it.id, e)
        results.failed++
      }
      await new Promise(r => setTimeout(r, 100))
    }

    // 2) personal_licenses expiring within 7 days
    const { data: pls } = await supabase
      .from('personal_licenses')
      .select('id, name, customer_name, customer_email, expires_at, last_reminder_sent_at, status')
      .not('expires_at', 'is', null)
      .not('customer_email', 'is', null)
      .lte('expires_at', horizon)
      .gte('expires_at', now.toISOString())
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lte.${reminderCutoff}`)

    for (const it of (pls || []) as any[]) {
      const days = daysBetween(it.expires_at)
      const today = now.toISOString().slice(0, 10)
      try {
        const { error } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'subscription-renewal-reminder',
            recipientEmail: it.customer_email,
            idempotencyKey: `auto-subrenew-pl-${it.id}-${today}`,
            templateData: {
              customerName: it.customer_name || 'Customer',
              productName: it.name,
              expiryDate: fmtDate(it.expires_at),
              daysLeft: days,
              renewUrl: `${SITE}/shop`,
            },
          },
        })
        if (error) throw error
        await supabase.from('personal_licenses').update({ last_reminder_sent_at: now.toISOString() }).eq('id', it.id)
        results.personal_licenses++
      } catch (e) {
        console.error('personal_license reminder failed', it.id, e)
        results.failed++
      }
      await new Promise(r => setTimeout(r, 100))
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('auto-subscription-reminders error', e)
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
