// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const authHeader = req.headers.get('Authorization') ?? ''
    const { data: userData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle()
    if (!roleRow) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { offer_id } = await req.json()
    if (!offer_id) throw new Error('offer_id required')

    const { data: subs, error } = await supabase
      .from('offer_submissions')
      .select('*')
      .eq('offer_id', offer_id)
      .order('created_at', { ascending: true })
    if (error) throw error

    const dynamicKeys = new Set<string>()
    for (const s of subs ?? []) {
      const d = (s as any).data as Record<string, any> | null
      if (d && typeof d === 'object') Object.keys(d).forEach((k) => dynamicKeys.add(k))
    }
    const dynamicCols = Array.from(dynamicKeys)
    const baseCols = ['created_at', 'participant_name', 'participant_email', 'participant_phone', 'is_winner', 'winner_rank', 'prize_won']
    const header = [...baseCols, ...dynamicCols]

    const lines = [header.map(csvEscape).join(',')]
    for (const s of subs ?? []) {
      const row: any[] = baseCols.map((c) => (s as any)[c])
      const d = ((s as any).data ?? {}) as Record<string, any>
      dynamicCols.forEach((k) => row.push(d[k]))
      lines.push(row.map(csvEscape).join(','))
    }
    const csv = lines.join('\n')

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="giveaway-${offer_id}.csv"`,
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
