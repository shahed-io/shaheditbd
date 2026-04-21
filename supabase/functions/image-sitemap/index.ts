import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Dedicated Google Image Sitemap
 * --------------------------------------------------------------
 * Lists every product image with rich `<image:image>` metadata so
 * Google Image Search can discover and rank our product photos.
 * When a buyer searches a product name on Google Images, our
 * picture (with caption + title) shows up.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://shahedstore.com.bd';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: products } = await supabase
      .from('products')
      .select('slug, name, image_url, images, short_description, seo_title')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000);

    const urlBlocks: string[] = [];

    for (const p of products || []) {
      const imgs: string[] = [];
      if (p.image_url) imgs.push(p.image_url);
      if (Array.isArray(p.images)) {
        for (const i of p.images) if (i && !imgs.includes(i)) imgs.push(i);
      }
      if (imgs.length === 0) continue;

      const productUrl = `${SITE_URL}/product/${escape(p.slug)}`;
      const baseTitle = p.seo_title || `${p.name} - Buy at Best Price in Bangladesh | Shahed Store`;
      const baseCaption = p.short_description ||
        `${p.name} - 100% genuine digital product with instant delivery in Bangladesh`;

      const imageBlocks = imgs.map((img, i) => `
    <image:image>
      <image:loc>${escape(img)}</image:loc>
      <image:title>${escape(i === 0 ? baseTitle : `${p.name} - Image ${i + 1}`)}</image:title>
      <image:caption>${escape(baseCaption)}</image:caption>
      <image:license>${SITE_URL}/terms-conditions</image:license>
    </image:image>`).join('');

      urlBlocks.push(`  <url>
    <loc>${productUrl}</loc>${imageBlocks}
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
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('Image sitemap error:', err);
    return new Response('Error generating image sitemap', {
      status: 500, headers: corsHeaders,
    });
  }
});
