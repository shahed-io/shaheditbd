import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://shahedstore.com.bd';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const urls: { loc: string; lastmod?: string; changefreq: string; priority: string }[] = [];

    // ── Static pages ──────────────────────────────────────────────
    const staticPages = [
      { path: '/',               changefreq: 'daily',   priority: '1.0' },
      { path: '/shop',           changefreq: 'daily',   priority: '0.9' },
      { path: '/blog',           changefreq: 'weekly',  priority: '0.8' },
      { path: '/help',           changefreq: 'monthly', priority: '0.7' },
      { path: '/free-tools',     changefreq: 'monthly', priority: '0.7' },
      { path: '/about',          changefreq: 'monthly', priority: '0.6' },
      { path: '/contact',        changefreq: 'monthly', priority: '0.6' },
      { path: '/faqs',           changefreq: 'monthly', priority: '0.7' },
      { path: '/privacy-policy', changefreq: 'yearly',  priority: '0.3' },
      { path: '/terms-conditions', changefreq: 'yearly', priority: '0.3' },
      { path: '/refund-policy',  changefreq: 'yearly',  priority: '0.4' },
      { path: '/return-policy',  changefreq: 'yearly',  priority: '0.4' },
      { path: '/delivery-info',  changefreq: 'monthly', priority: '0.5' },
      { path: '/order-policy',   changefreq: 'yearly',  priority: '0.3' },
    ];

    for (const p of staticPages) {
      urls.push({ loc: `${SITE_URL}${p.path}`, changefreq: p.changefreq, priority: p.priority });
    }

    // ── Products ─────────────────────────────────────────────────
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at, name')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000);

    for (const p of products || []) {
      urls.push({
        loc: `${SITE_URL}/product/${escape(p.slug)}`,
        lastmod: p.updated_at?.split('T')[0],
        changefreq: 'weekly',
        priority: '0.9',
      });
    }

    // ── Categories ───────────────────────────────────────────────
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true);

    for (const c of categories || []) {
      urls.push({
        loc: `${SITE_URL}/shop?category=${escape(c.slug)}`,
        lastmod: c.updated_at?.split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    // ── Blog posts ───────────────────────────────────────────────
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    for (const b of blogPosts || []) {
      urls.push({
        loc: `${SITE_URL}/blog/${escape(b.slug)}`,
        lastmod: b.updated_at?.split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
      });
    }

    // ── Build XML ─────────────────────────────────────────────────
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('Error generating sitemap', { status: 500, headers: corsHeaders });
  }
});
