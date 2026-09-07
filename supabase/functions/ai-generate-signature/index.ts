// AI Signature generator — returns a base64 PNG signature image
// Uses Lovable AI Gateway (Gemini image model) so it works without Replicate credits.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) return j({ error: 'Unauthorized' }, 401);
    const { data: u } = await supabase.auth.getUser(token);
    if (!u?.user) return j({ error: 'Unauthorized' }, 401);
    const { data: role } = await supabase
      .from('user_roles').select('role')
      .eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!role) return j({ error: 'Forbidden' }, 403);

    const { name = 'Shahed IT Authority', style = 'elegant cursive' } =
      (await req.json().catch(() => ({}))) as { name?: string; style?: string };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return j({ error: 'LOVABLE_API_KEY not configured' }, 500);

    const prompt = `A realistic hand-written signature of the name "${name}" in ${style} style. Black ink on a pure plain white background, isolated, no watermarks, no printed text, no decorations — just the signature stroke. Looks like a real pen signature scanned from paper. Clean, wide aspect.`;

    const r = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => '');
      if (r.status === 402) return j({ error: 'AI credits exhausted. Please add credits to the workspace.' }, 402);
      if (r.status === 429) return j({ error: 'Rate limited. Please try again in a moment.' }, 429);
      return j({ error: `AI image failed ${r.status}: ${t.slice(0, 200)}` }, 500);
    }

    const data = await r.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return j({ error: 'AI did not return image data' }, 500);

    return j({ success: true, dataUrl: `data:image/png;base64,${b64}` });
  } catch (e) {
    console.error('ai-generate-signature error:', e);
    return j({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
