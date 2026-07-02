// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(jwt)
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle()
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { offer_id } = await req.json()
    if (!offer_id) throw new Error('offer_id required')

    const { data: offer, error: oe } = await supabase.from('offers').select('*').eq('id', offer_id).single()
    if (oe || !offer) throw new Error('Offer not found')

    const winnerCount = Math.max(1, offer.winner_count ?? 1)
    const mode = offer.winner_selection_mode ?? 'random'

    // Get eligible submissions (not already winner)
    const { data: subs, error: se } = await supabase
      .from('offer_submissions')
      .select('id, user_id, participant_name, participant_email, data')
      .eq('offer_id', offer_id)
      .eq('is_winner', false)
    if (se) throw se
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ error: 'No eligible submissions' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Weight calculation
    const weighted = subs.map((s: any) => {
      let weight = 1
      if (mode === 'weighted_referral') {
        const bonus = Number((s.data as any)?.referral_bonus ?? 0)
        weight = 1 + bonus
      }
      return { sub: s, weight }
    })

    // Weighted random pick without replacement
    const picked: any[] = []
    const pool = [...weighted]
    for (let i = 0; i < Math.min(winnerCount, pool.length); i++) {
      const total = pool.reduce((acc, x) => acc + x.weight, 0)
      let r = Math.random() * total
      let idx = 0
      for (let j = 0; j < pool.length; j++) {
        r -= pool[j].weight
        if (r <= 0) { idx = j; break }
      }
      picked.push(pool[idx].sub)
      pool.splice(idx, 1)
    }

    // Existing winners count to continue ranks
    const { count: existingWinners } = await supabase
      .from('offer_winners')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', offer_id)

    const startRank = (existingWinners ?? 0) + 1

    const rows = picked.map((s, i) => ({
      offer_id,
      submission_id: s.id,
      rank: startRank + i,
      prize: null,
      selected_by: mode === 'weighted_referral' ? 'weighted' : 'random',
      participant_name: s.participant_name,
      ai_reason: `Auto-selected via ${mode}`,
    }))

    const { error: iw } = await supabase.from('offer_winners').insert(rows)
    if (iw) throw iw

    // Mark submissions as winner
    const ids = picked.map((s) => s.id)
    await supabase.from('offer_submissions').update({ is_winner: true }).in('id', ids)

    return new Response(JSON.stringify({ success: true, winners: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
