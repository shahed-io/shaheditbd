// Semrush overview proxy via Lovable connector gateway
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireAdmin } from '../_shared/admin-auth.ts';

const GATEWAY = 'https://connector-gateway.lovable.dev/semrush';

function parseTsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(';');
  return lines.slice(1).map((ln) => {
    const cells = ln.split(';');
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = cells[i] ?? ''));
    return o;
  });
}

async function smCall(path: string, params: Record<string, string>, lovableKey: string, semrushKey: string) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${GATEWAY}${path}?${qs}`, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': semrushKey,
    },
  });
  const text = await r.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: r.ok, status: r.status, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const SEMRUSH_API_KEY = Deno.env.get('SEMRUSH_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!SEMRUSH_API_KEY) {
    return new Response(JSON.stringify({ error: 'SEMRUSH_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const domain: string = (body.domain || 'shahedstore.com.bd').toString().trim();
  const database: string = (body.database || 'us').toString().trim();

  try {
    const [limits, ranks, organic, backlinksOv, refDomains, history] = await Promise.all([
      smCall('/user/limits', {}, LOVABLE_API_KEY, SEMRUSH_API_KEY),
      smCall('/domains/domain_ranks', { domain, database, export_columns: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv' }, LOVABLE_API_KEY, SEMRUSH_API_KEY),
      smCall('/domains/domain_organic', { domain, database, display_limit: '15', export_columns: 'Ph,Po,Pp,Nq,Cp,Tr,Tg,Tc,Co,Nr,Td,Ur' }, LOVABLE_API_KEY, SEMRUSH_API_KEY),
      smCall('/backlinks/backlinks_overview', { target: domain, target_type: 'root_domain', export_columns: 'ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num,forms_num,frames_num' }, LOVABLE_API_KEY, SEMRUSH_API_KEY),
      smCall('/backlinks/backlinks_refdomains', { target: domain, target_type: 'root_domain', display_limit: '10', export_columns: 'domain,ascore,backlinks_num,ip,country,first_seen,last_seen' }, LOVABLE_API_KEY, SEMRUSH_API_KEY),
      smCall('/domains/domain_rank_history', { domain, database, display_limit: '12', export_columns: 'Rk,Or,Ot,Oc,Ad,At,Ac,Dt' }, LOVABLE_API_KEY, SEMRUSH_API_KEY),
    ]);

    // Helper: normalize. Some endpoints return JSON, some TSV.
    const norm = (res: any) => {
      if (!res.ok) return { error: res.data?.error || res.data?.raw || `HTTP ${res.status}`, status: res.status };
      if (res.data?.data?.rows) return { rows: res.data.data.rows, columns: res.data.data.columnNames };
      if (typeof res.data?.raw === 'string') return { rows: parseTsv(res.data.raw) };
      return { rows: [], raw: res.data };
    };

    return new Response(JSON.stringify({
      domain,
      database,
      limits: norm(limits),
      overview: norm(ranks),
      organicKeywords: norm(organic),
      backlinksOverview: norm(backlinksOv),
      refDomains: norm(refDomains),
      history: norm(history),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
