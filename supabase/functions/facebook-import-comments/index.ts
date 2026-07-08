// Import comments from a Facebook post into offer_facebook_comments.
// Requires FACEBOOK_PAGE_ACCESS_TOKEN secret (Page or User token with pages_read_engagement).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** Extract the post's numeric FB id from a URL like
 * https://www.facebook.com/{page}/posts/{id}, /permalink/{id}, or ?story_fbid=..&id=..
 */
function extractPostId(url: string): string | null {
  const s = url.trim();
  const patterns = [
    /\/posts\/(?:pfbid[a-zA-Z0-9]+|\d+)(?:\/)?/,
    /\/permalink\/(\d+)/,
    /\/videos\/(\d+)/,
    /story_fbid=(\d+)[^&]*&id=(\d+)/,
    /\/(\d{10,})(?:\/|$|\?)/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;
    if (re.source.includes('story_fbid')) return `${m[2]}_${m[1]}`;
    const id = m[1] || m[0].replace(/\D/g, '');
    if (id) return id;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: u } = await supabase.auth.getUser(token);
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Forbidden' }, 403);

    const { offer_id, post_url, limit = 500 } = await req.json();
    if (!offer_id || !post_url) return json({ error: 'offer_id and post_url required' }, 400);

    const fbToken = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!fbToken) {
      return json({
        error: 'Facebook access token missing. Add FACEBOOK_PAGE_ACCESS_TOKEN in project secrets (Page token with pages_read_engagement scope).',
      }, 400);
    }

    const postId = extractPostId(post_url);
    if (!postId) return json({ error: 'Could not extract a Facebook post ID from that URL. Use the full post/permalink URL.' }, 400);

    // Fetch comments (paginate)
    const fields = 'id,from,message,like_count,created_time';
    let next: string | null = `https://graph.facebook.com/v20.0/${postId}/comments?fields=${fields}&limit=100&filter=stream&access_token=${encodeURIComponent(fbToken)}`;
    const collected: any[] = [];
    let pages = 0;
    while (next && collected.length < limit && pages < 20) {
      const r = await fetch(next);
      const body = await r.json();
      if (!r.ok || body.error) {
        return json({ error: `Facebook API error: ${body.error?.message || r.statusText}`, details: body }, r.status || 500);
      }
      for (const c of body.data || []) collected.push(c);
      next = body.paging?.next ?? null;
      pages += 1;
    }

    if (collected.length === 0) {
      return json({ success: true, imported: 0, total_comments: 0, message: 'No comments found on this post.' });
    }

    const rows = collected.slice(0, limit).map((c) => ({
      offer_id,
      post_url,
      fb_comment_id: c.id,
      author_id: c.from?.id ?? null,
      author_name: c.from?.name ?? 'Facebook User',
      message: c.message ?? '',
      like_count: c.like_count ?? 0,
      fb_created_time: c.created_time ?? null,
    }));

    const { error, count } = await supabase
      .from('offer_facebook_comments')
      .upsert(rows, { onConflict: 'offer_id,fb_comment_id', count: 'exact' });
    if (error) throw error;

    return json({ success: true, imported: count ?? rows.length, total_comments: collected.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
