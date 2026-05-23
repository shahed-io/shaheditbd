// Server-side SEO health checker: fetches sitemaps/feeds/robots from the public site
// and returns structured stats. Bypasses browser CORS for the admin SEO Monitor page.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckResult {
  name: string;
  url: string;
  ok: boolean;
  status: number;
  count: number;
  bytes: number;
  responseMs: number;
  contentType: string;
  lastModified: string | null;
  error?: string;
  sample?: string[];
}

async function checkUrl(name: string, url: string): Promise<CheckResult> {
  const started = Date.now();
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'ShahedStore-SEO-Monitor/1.0 (+admin)' },
      redirect: 'follow',
    });
    const text = await r.text();
    const responseMs = Date.now() - started;
    const contentType = r.headers.get('content-type') || '';
    const lastModified = r.headers.get('last-modified');

    let count = 0;
    let sample: string[] = [];

    if (name.endsWith('.xml')) {
      // count <url> (sitemap), <item> (rss), <sitemap> (index), <image:loc> (image sitemap)
      const urlMatches = text.match(/<url>/g) || [];
      const itemMatches = text.match(/<item>/g) || [];
      const sitemapMatches = text.match(/<sitemap>/g) || [];
      const imageMatches = text.match(/<image:loc>/g) || [];
      count = urlMatches.length + itemMatches.length + sitemapMatches.length + imageMatches.length;

      // grab up to 3 sample locs
      const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].slice(0, 3).map((m) => m[1]);
      sample = locs;
    } else if (name === 'robots.txt') {
      // count sitemap directives
      count = text.split('\n').filter((l) => l.trim().toLowerCase().startsWith('sitemap:')).length;
      sample = text.split('\n').filter((l) => l.trim().toLowerCase().startsWith('sitemap:')).slice(0, 3);
    }

    return {
      name,
      url,
      ok: r.ok && (name.endsWith('.xml') ? count > 0 : true),
      status: r.status,
      count,
      bytes: text.length,
      responseMs,
      contentType,
      lastModified,
      sample,
    };
  } catch (e: any) {
    return {
      name,
      url,
      ok: false,
      status: 0,
      count: 0,
      bytes: 0,
      responseMs: Date.now() - started,
      contentType: '',
      lastModified: null,
      error: e.message || String(e),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Admin-only
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const site: string = body.site || 'https://shahedstore.com.bd';
    const targets: { name: string; url: string }[] = body.targets || [
      { name: 'sitemap.xml', url: `${site}/sitemap.xml` },
      { name: 'image-sitemap.xml', url: `${site}/image-sitemap.xml` },
      { name: 'rss.xml', url: `${site}/rss.xml` },
      { name: 'robots.txt', url: `${site}/robots.txt` },
    ];

    const results = await Promise.all(targets.map((t) => checkUrl(t.name, t.url)));
    return new Response(JSON.stringify({ ok: true, results, checkedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
