// SEO auto-ping endpoint:
//  • IndexNow (Bing, Yandex, Seznam, Naver) — instantly notifies about new/updated URLs
//  • Submits sitemap to the same network
// Called by DB trigger when products / blog posts publish.
const INDEXNOW_KEY = 'f457da4fc7d6a59544e71cf9e5ce3245';
const SITE_HOST = 'shahedstore.com.bd';
const SITE_URL = `https://${SITE_HOST}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let urls: string[] = [];

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body.urls)) urls = body.urls;
      else if (typeof body.url === 'string') urls = [body.url];
      else if (typeof body.slug === 'string') urls = [`${SITE_URL}/product/${body.slug}`];
    } else {
      const u = new URL(req.url);
      const slug = u.searchParams.get('slug');
      const url = u.searchParams.get('url');
      if (slug) urls = [`${SITE_URL}/product/${slug}`];
      else if (url) urls = [url];
    }

    if (urls.length === 0) urls = [SITE_URL];

    // Normalize all URLs to https://shahedstore.com.bd
    urls = urls
      .map(u => u.trim())
      .filter(Boolean)
      .map(u => u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)
      .filter(u => u.includes(SITE_HOST));

    const results: Record<string, any> = {};

    // 1. IndexNow (Bing + Yandex + Seznam + Naver)
    try {
      const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: SITE_HOST,
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
      });
      results.indexnow = { status: indexNowRes.status, ok: indexNowRes.ok };
    } catch (e) {
      results.indexnow = { error: String(e) };
    }

    // 2. Bing direct fallback
    try {
      const bingRes = await fetch(`https://www.bing.com/indexnow?url=${encodeURIComponent(urls[0])}&key=${INDEXNOW_KEY}`);
      results.bing = { status: bingRes.status };
    } catch (e) {
      results.bing = { error: String(e) };
    }

    // 3. Yandex direct fallback
    try {
      const yandexRes = await fetch(`https://yandex.com/indexnow?url=${encodeURIComponent(urls[0])}&key=${INDEXNOW_KEY}`);
      results.yandex = { status: yandexRes.status };
    } catch (e) {
      results.yandex = { error: String(e) };
    }

    return new Response(JSON.stringify({ ok: true, urls, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
