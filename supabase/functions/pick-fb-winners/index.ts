// Pick winners from imported Facebook comments for an offer.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: u } = await supabase.auth.getUser(token);
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Forbidden' }, 403);

    const { offer_id, count = 1, comment_ids, prizes = [], one_per_user = true, replace_existing = false } = await req.json();
    if (!offer_id) return json({ error: 'offer_id required' }, 400);

    // Load available fb comments
    const { data: pool, error: pe } = await supabase
      .from('offer_facebook_comments')
      .select('id, author_id, author_name, message, like_count')
      .eq('offer_id', offer_id);
    if (pe) throw pe;
    if (!pool || pool.length === 0) return json({ error: 'No Facebook comments imported yet for this offer.' }, 400);

    // Load blocklist
    const { data: blocked } = await supabase
      .from('offer_blocked_participants')
      .select('kind, identifier, offer_id')
      .or(`offer_id.eq.${offer_id},offer_id.is.null`);
    const blockedNames = new Set((blocked ?? []).filter(b => b.kind === 'name').map(b => (b.identifier || '').toLowerCase()));
    const blockedFbIds = new Set((blocked ?? []).filter(b => b.kind === 'facebook_id').map(b => b.identifier));

    let candidates = pool.filter((c: any) => {
      if (c.author_id && blockedFbIds.has(c.author_id)) return false;
      if (blockedNames.has((c.author_name || '').toLowerCase())) return false;
      return true;
    });

    if (replace_existing) {
      await supabase.from('offer_winners').delete().eq('offer_id', offer_id).eq('source', 'facebook');
      await supabase.from('offer_facebook_comments').update({ is_winner: false, winner_rank: null }).eq('offer_id', offer_id);
    }

    // Pick
    let selected: any[];
    if (Array.isArray(comment_ids) && comment_ids.length > 0) {
      selected = candidates.filter((c: any) => comment_ids.includes(c.id));
    } else {
      // random N (optionally one per author)
      const seenAuthors = new Set<string>();
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      selected = [];
      for (const c of shuffled) {
        if (one_per_user && c.author_id) {
          if (seenAuthors.has(c.author_id)) continue;
          seenAuthors.add(c.author_id);
        }
        selected.push(c);
        if (selected.length >= count) break;
      }
    }

    if (selected.length === 0) return json({ error: 'No eligible comments to pick from.' }, 400);

    // Existing winner ranks (continue numbering)
    const { count: existing } = await supabase
      .from('offer_winners')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', offer_id);
    const startRank = (existing ?? 0) + 1;

    const rows = selected.map((c: any, i: number) => ({
      offer_id,
      submission_id: null,
      fb_comment_id: c.id,
      source: 'facebook',
      rank: startRank + i,
      prize: prizes[i] || null,
      selected_by: 'manual_facebook',
      participant_name: c.author_name,
      participant_contact: c.author_id ? `facebook:${c.author_id}` : null,
      ai_reason: null,
    }));

    const { data: inserted, error: ie } = await supabase.from('offer_winners').insert(rows).select('id');
    if (ie) throw ie;

    // Mark comments as winners
    await supabase
      .from('offer_facebook_comments')
      .update({ is_winner: true })
      .in('id', selected.map((c: any) => c.id));

    return json({ success: true, winners: inserted?.length ?? rows.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
