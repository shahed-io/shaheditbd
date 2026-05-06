// RSS 2.0 feed for blog posts — boosts SEO via syndication & feed crawlers.
// Public endpoint, served via /rss.xml redirect (see public/_redirects).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE = 'https://shahedstore.com.bd';
const SITE_NAME = 'Shahed Store';

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt, featured_image, published_at, updated_at, author_name')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    const now = new Date().toUTCString();
    const items = (posts || []).map((p: any) => `
    <item>
      <title>${xmlEscape(p.title || '')}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <description>${xmlEscape(p.excerpt || p.title || '')}</description>
      ${p.featured_image ? `<enclosure url="${xmlEscape(p.featured_image)}" type="image/jpeg" />` : ''}
      <pubDate>${new Date(p.published_at || p.updated_at || Date.now()).toUTCString()}</pubDate>
      <author>noreply@shahedstore.com.bd (${xmlEscape(p.author_name || SITE_NAME)})</author>
    </item>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_NAME} – Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Latest digital software news, guides &amp; deals from ${SITE_NAME}, Bangladesh.</description>
    <language>en-US</language>
    <copyright>© ${new Date().getFullYear()} ${SITE_NAME}</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${SITE}/favicon.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE}</link>
    </image>${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900, s-maxage=900',
      },
    });
  } catch (err) {
    console.error('rss-feed error', err);
    return new Response('Internal error', { status: 500, headers: corsHeaders });
  }
});
