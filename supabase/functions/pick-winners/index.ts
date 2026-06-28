// Pick winners for an offer — random or AI-assisted
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAIWithFallback } from '../_shared/ai-fallback.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PickRequest {
  offer_id: string;
  count: number;
  mode: 'random' | 'ai';
  prizes?: string[]; // prize per rank
  replace_existing?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = (await req.json()) as PickRequest;
    const { offer_id, count, mode, prizes = [], replace_existing = false } = body;

    if (!offer_id || !count || count < 1 || count > 100) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load submissions
    const { data: subs, error: subErr } = await supabase
      .from('offer_submissions')
      .select('id, data, participant_name, participant_email, participant_phone, created_at')
      .eq('offer_id', offer_id);

    if (subErr) throw subErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ error: 'No submissions found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const winnersCount = Math.min(count, subs.length);

    // Clear existing if requested
    if (replace_existing) {
      await supabase.from('offer_winners').delete().eq('offer_id', offer_id);
      await supabase.from('offer_submissions').update({ is_winner: false, winner_rank: null, prize_won: null }).eq('offer_id', offer_id);
    }

    let picked: Array<{ submission_id: string; rank: number; prize: string | null; reason?: string }> = [];

    if (mode === 'ai') {
      // Compose compact submission list for AI
      const compact = subs.map((s, i) => ({
        idx: i,
        id: s.id,
        name: s.participant_name || '',
        email: s.participant_email || '',
        phone: s.participant_phone || '',
        data: s.data,
      }));

      const prompt = `You are picking ${winnersCount} winner(s) from ${compact.length} contest submissions. Evaluate based on: completeness of answers, quality/effort in any text fields, genuineness (avoid spam/duplicates/test entries). Return ONLY a JSON object: {"winners":[{"idx":<number>,"reason":"<short reason in Bengali>"}]}. Pick exactly ${winnersCount} unique entries, ordered best first.

Submissions:
${JSON.stringify(compact).slice(0, 30000)}`;

      try {
        const ai = await callAIWithFallback({
          messages: [
            { role: 'system', content: 'You output only valid JSON.' },
            { role: 'user', content: prompt },
          ],
        });
        const match = ai.text.match(/\{[\s\S]*\}/);
        const parsed = match ? JSON.parse(match[0]) : { winners: [] };
        const aiWinners = (parsed.winners || []).slice(0, winnersCount);
        picked = aiWinners.map((w: any, rank: number) => {
          const sub = compact[w.idx];
          return sub ? { submission_id: sub.id, rank: rank + 1, prize: prizes[rank] || null, reason: w.reason } : null;
        }).filter(Boolean);
      } catch (e) {
        console.error('AI pick failed, falling back to random:', e);
      }
    }

    // Fallback / random mode
    if (picked.length < winnersCount) {
      const used = new Set(picked.map(p => p.submission_id));
      const pool = subs.filter(s => !used.has(s.id));
      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      for (let i = 0; picked.length < winnersCount && i < pool.length; i++) {
        const rank = picked.length + 1;
        picked.push({ submission_id: pool[i].id, rank, prize: prizes[rank - 1] || null });
      }
    }

    // Insert winners
    const winnerRows = picked.map(p => ({
      offer_id,
      submission_id: p.submission_id,
      rank: p.rank,
      prize: p.prize,
      selected_by: mode,
      ai_reason: p.reason || null,
    }));

    const { error: insErr } = await supabase.from('offer_winners').insert(winnerRows);
    if (insErr) throw insErr;

    // Mark submissions
    for (const p of picked) {
      await supabase.from('offer_submissions').update({
        is_winner: true,
        winner_rank: p.rank,
        prize_won: p.prize,
      }).eq('id', p.submission_id);
    }

    return new Response(JSON.stringify({ success: true, winners: picked }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('pick-winners error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
