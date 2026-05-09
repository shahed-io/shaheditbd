import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://shahedstore.com.bd';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// W3C Datetime (ISO 8601) — full timestamp with timezone, e.g. 2026-05-09T12:34:56+00:00
// Google honours this precision for `lastmod` and uses it to schedule re-crawls.
const toW3C = (input: string | Date | null | undefined): string | null => {
  if (!input) return null;
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace('Z', '+00:00');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const urls: string[] = [];
    const nowW3C = toW3C(new Date())!;

    // ── Fetch latest content first (parallel) ────────────────────
    const [productsRes, categoriesRes, blogRes, helpRes] = await Promise.all([
      supabase
        .from('products')
        .select('slug, updated_at, created_at, name, image_url, images, seo_title')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase
        .from('categories')
        .select('slug, updated_at, created_at')
        .eq('is_active', true),
      supabase
        .from('blog_posts')
        .select('slug, updated_at, created_at, published_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('help_articles')
        .select('slug, updated_at, created_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(500),
    ]);

    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const blogPosts = blogRes.data || [];
    const helpArticles = helpRes.data || [];

    // Newest content timestamp drives static page lastmod
    const newestProduct = products[0]?.updated_at;
    const newestBlog = blogPosts[0]?.updated_at;
    const newestHelp = helpArticles[0]?.updated_at;
    const newestOverall = toW3C(
      [newestProduct, newestBlog, newestHelp]
        .filter(Boolean)
        .sort()
        .reverse()[0] || new Date()
    )!;

    // ── Static pages (with smart lastmod) ────────────────────────
    const staticPages: Array<{ path: string; changefreq: string; priority: string; lastmod: string }> = [
      { path: '/',                 changefreq: 'daily',   priority: '1.0', lastmod: newestOverall },
      { path: '/shop',             changefreq: 'daily',   priority: '0.9', lastmod: toW3C(newestProduct) || nowW3C },
      { path: '/blog',             changefreq: 'weekly',  priority: '0.8', lastmod: toW3C(newestBlog) || nowW3C },
      { path: '/link',             changefreq: 'monthly', priority: '0.7', lastmod: toW3C(newestHelp) || nowW3C },
      { path: '/free-tools',       changefreq: 'monthly', priority: '0.7', lastmod: nowW3C },
      { path: '/about',            changefreq: 'monthly', priority: '0.6', lastmod: nowW3C },
      { path: '/contact',          changefreq: 'monthly', priority: '0.6', lastmod: nowW3C },
      { path: '/faqs',             changefreq: 'monthly', priority: '0.7', lastmod: nowW3C },
      { path: '/privacy-policy',   changefreq: 'yearly',  priority: '0.3', lastmod: nowW3C },
      { path: '/terms-conditions', changefreq: 'yearly',  priority: '0.3', lastmod: nowW3C },
      { path: '/refund-policy',    changefreq: 'yearly',  priority: '0.4', lastmod: nowW3C },
      { path: '/return-policy',    changefreq: 'yearly',  priority: '0.4', lastmod: nowW3C },
      { path: '/delivery-info',    changefreq: 'monthly', priority: '0.5', lastmod: nowW3C },
      { path: '/order-policy',     changefreq: 'yearly',  priority: '0.3', lastmod: nowW3C },
    ];

    for (const p of staticPages) {
      urls.push(`  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
    }

    // ── Products (with images for Google Image indexing) ──────────
    for (const p of products) {
      const allImages: string[] = [];
      if (p.image_url) allImages.push(p.image_url);
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          if (img && !allImages.includes(img)) allImages.push(img);
        }
      }

      const imageTitle = escape(p.seo_title || `${p.name} - Buy at Best Price in Bangladesh | Shahed Store`);
      const imageCaption = escape(`${p.name} - High quality product image from Shahed Store Bangladesh`);

      const imageBlocks = allImages.map((img, i) => `
    <image:image>
      <image:loc>${escape(img)}</image:loc>
      <image:title>${i === 0 ? imageTitle : escape(`${p.name} - Image ${i + 1}`)}</image:title>
      <image:caption>${imageCaption}</image:caption>
    </image:image>`).join('');

      const lastmod = toW3C(p.updated_at) || toW3C(p.created_at) || nowW3C;

      urls.push(`  <url>
    <loc>${SITE_URL}/product/${escape(p.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="bn-BD" href="${SITE_URL}/product/${escape(p.slug)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/product/${escape(p.slug)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/product/${escape(p.slug)}" />${imageBlocks}
  </url>`);
    }

    // ── Categories ───────────────────────────────────────────────
    for (const c of categories) {
      const lastmod = toW3C(c.updated_at) || toW3C(c.created_at) || nowW3C;
      urls.push(`  <url>
    <loc>${SITE_URL}/shop?category=${escape(c.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    // ── Blog posts ───────────────────────────────────────────────
    for (const b of blogPosts) {
      const lastmod = toW3C(b.updated_at) || toW3C(b.published_at) || toW3C(b.created_at) || nowW3C;
      urls.push(`  <url>
    <loc>${SITE_URL}/blog/${escape(b.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    // ── Help Articles ─────────────────────────────────────────────
    for (const h of helpArticles) {
      const lastmod = toW3C(h.updated_at) || toW3C(h.created_at) || nowW3C;
      urls.push(`  <url>
    <loc>${SITE_URL}/link/${escape(h.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    // ── Build XML ─────────────────────────────────────────────────
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        // Short cache so freshly published items reflect quickly
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('Error generating sitemap', { status: 500, headers: corsHeaders });
  }
});
