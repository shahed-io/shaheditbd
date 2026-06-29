// AI Signature generator — returns a base64 PNG signature image
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateReplicateImage } from '../_shared/replicate-image.ts';

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

    const { name = 'Shahed Store Authority', style = 'elegant cursive' } =
      (await req.json().catch(() => ({}))) as { name?: string; style?: string };

    const prompt = `A realistic hand-written signature of the name "${name}" in ${style} style, black ink on a pure plain white background, isolated, no watermarks, no text labels, no decorations, just the signature stroke, high-resolution, looks like a real pen signature scanned from paper. Clean. Wide aspect.`;

    const { base64, mimeType } = await generateReplicateImage({ prompt, aspectRatio: '16:9' });
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return j({ success: true, dataUrl });
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
