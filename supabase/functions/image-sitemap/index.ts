import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Google Image Sitemap — products + blog posts + categories
 * --------------------------------------------------------------
 * Auto-updates: DB triggers (`trg_ping_sitemap_*`) ping the sitemap
 * endpoint whenever rows change, so this output stays fresh.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://shahedstore.com.bd';

const escape = (s: string) =>
  (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Strip markdown / HTML to a clean caption
const cleanText = (s: string, max = 200) =>
  (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

// Pull all markdown / HTML image URLs out of body content
const extractImages = (content: string): string[] => {
  if (!content) return [];
  const out: string[] = [];
  const md = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
  const html = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = md.exec(content))) out.push(m[1]);
  while ((m = html.exec(content))) out.push(m[1]);
  return Array.from(new Set(out));
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [productsRes, blogsRes, catsRes] = await Promise.all([
      supabase
        .from('products')
        .select('slug, name, image_url, images, short_description, seo_title')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase
        .from('blog_posts')
        .select('slug, title, excerpt, content, featured_image, seo_title')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(2000),
      supabase
        .from('categories')
        .select('slug, name, description, image_url')
        .order('name', { ascending: true })
        .limit(500),
    ]);

    const urlBlocks: string[] = [];

    // ---------- Products ----------
    for (const p of productsRes.data || []) {
      const imgs: string[] = [];
      if (p.image_url) imgs.push(p.image_url);
      if (Array.isArray(p.images)) for (const i of p.images) if (i && !imgs.includes(i)) imgs.push(i);
      if (imgs.length === 0) continue;

      const pageUrl = `${SITE_URL}/product/${escape(p.slug)}`;
      const title = p.seo_title || `${p.name} - Buy at Best Price in Bangladesh | Shahed Store`;
      const caption =
        cleanText(p.short_description) ||
        `${p.name} - 100% genuine digital product with instant delivery in Bangladesh`;

      const imageBlocks = imgs
        .map(
          (img, i) => `
    <image:image>
      <image:loc>${escape(img)}</image:loc>
      <image:title>${escape(i === 0 ? title : `${p.name} - Image ${i + 1}`)}</image:title>
      <image:caption>${escape(caption)}</image:caption>
      <image:license>${SITE_URL}/terms-conditions</image:license>
    </image:image>`,
        )
        .join('');

      urlBlocks.push(`  <url>
    <loc>${pageUrl}</loc>${imageBlocks}
  </url>`);
    }

    // ---------- Blog posts ----------
    for (const b of blogsRes.data || []) {
      const imgs: string[] = [];
      if (b.featured_image) imgs.push(b.featured_image);
      for (const i of extractImages(b.content || '')) if (!imgs.includes(i)) imgs.push(i);
      if (imgs.length === 0) continue;

      const pageUrl = `${SITE_URL}/blog/${escape(b.slug)}`;
      const title = b.seo_title || `${b.title} | Shahed Store Blog`;
      const caption = cleanText(b.excerpt || b.content) || `${b.title} - Shahed Store Bangladesh`;

      const imageBlocks = imgs
        .slice(0, 10) // cap per page
        .map(
          (img, i) => `
    <image:image>
      <image:loc>${escape(img)}</image:loc>
      <image:title>${escape(i === 0 ? title : `${b.title} - Figure ${i + 1}`)}</image:title>
      <image:caption>${escape(caption)}</image:caption>
      <image:license>${SITE_URL}/terms-conditions</image:license>
    </image:image>`,
        )
        .join('');

      urlBlocks.push(`  <url>
    <loc>${pageUrl}</loc>${imageBlocks}
  </url>`);
    }

    // ---------- Categories ----------
    for (const c of catsRes.data || []) {
      if (!c.image_url) continue;
      const pageUrl = `${SITE_URL}/shop?category=${encodeURIComponent(c.slug)}`;
      const title = `${c.name} - Buy in Bangladesh | Shahed Store`;
      const caption =
        cleanText(c.description) ||
        `Shop ${c.name} digital products with instant delivery in Bangladesh`;

      urlBlocks.push(`  <url>
    <loc>${escape(pageUrl)}</loc>
    <image:image>
      <image:loc>${escape(c.image_url)}</image:loc>
      <image:title>${escape(title)}</image:title>
      <image:caption>${escape(caption)}</image:caption>
      <image:license>${SITE_URL}/terms-conditions</image:license>
    </image:image>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlBlocks.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (err) {
    console.error('Image sitemap error:', err);
    return new Response('Error generating image sitemap', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
