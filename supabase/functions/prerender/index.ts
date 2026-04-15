import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = 'https://shahedstore.com.bd';
const SITE_NAME = 'Shahed Store';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch product
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !product) {
      return new Response('Product not found', { status: 404 });
    }

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('rating, author_name, body, created_at')
      .eq('product_slug', slug)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch category
    let categoryName = '';
    if (product.category_id) {
      const { data: cat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', product.category_id)
        .single();
      if (cat) categoryName = cat.name;
    }

    // Build data
    const title = product.seo_title || `${product.name} - Buy at Best Price in Bangladesh | ${SITE_NAME}`;
    const description = product.seo_description || product.short_description || `Buy ${product.name} at the lowest price in Bangladesh from ${SITE_NAME}. 100% genuine, instant delivery.`;
    const canonicalUrl = `${SITE_URL}/product/${product.slug}`;
    const mainImage = product.image_url || '/favicon.png';
    const mainImageFull = mainImage.startsWith('http') ? mainImage : `${SITE_URL}${mainImage}`;

    // All images
    const allImages: string[] = [];
    if (product.image_url) allImages.push(product.image_url);
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && !allImages.includes(img)) allImages.push(img);
      }
    }

    // Reviews aggregate
    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount > 0
      ? (reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : '5.0';

    // FAQ
    const faqItems = Array.isArray(product.faq) ? product.faq : [];

    // Schema.org Product
    const productSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: description,
      image: allImages.length > 0 ? allImages : mainImageFull,
      url: canonicalUrl,
      brand: { '@type': 'Brand', name: product.brand || SITE_NAME },
      sku: product.sku || product.slug,
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'BDT',
        price: product.price,
        availability: product.stock_quantity && product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: SITE_NAME },
      },
    };

    if (reviewCount > 0) {
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviewCount,
        bestRating: '5',
        worstRating: '1',
      };
      productSchema.review = reviews!.slice(0, 5).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author_name },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: '5' },
        reviewBody: r.body,
        datePublished: r.created_at?.split('T')[0],
      }));
    }

    // FAQ Schema
    let faqSchema = '';
    if (faqItems.length > 0) {
      const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f: any) => ({
          '@type': 'Question',
          name: f.question || f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.answer || f.a },
        })),
      };
      faqSchema = `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>`;
    }

    // BreadcrumbList Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
        ...(categoryName ? [{ '@type': 'ListItem', position: 3, name: categoryName, item: `${SITE_URL}/shop?category=${product.category_id}` }] : []),
        { '@type': 'ListItem', position: categoryName ? 4 : 3, name: product.name, item: canonicalUrl },
      ],
    };

    // What you get
    const whatYouGet = Array.isArray(product.what_you_get) ? product.what_you_get : [];

    // Build HTML
    const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="keywords" content="${escape(product.name)}, buy ${escape(product.name)} bangladesh, ${escape(product.name)} price bd, ${escape(categoryName)}, digital software bangladesh, shahed store">
  <meta name="author" content="${SITE_NAME}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="geo.region" content="BD">
  <meta name="geo.placename" content="Bangladesh">

  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="bn-BD" href="${canonicalUrl}">
  <link rel="alternate" hreflang="en" href="${canonicalUrl}">
  <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">

  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${escape(mainImageFull)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="bn_BD">
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="BDT">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(mainImageFull)}">

  <script type="application/ld+json">${JSON.stringify(productSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  ${faqSchema}
</head>
<body>
  <header>
    <nav>
      <a href="${SITE_URL}">${SITE_NAME}</a> &gt;
      <a href="${SITE_URL}/shop">Shop</a> &gt;
      ${categoryName ? `<a href="${SITE_URL}/shop?category=${escape(product.category_id || '')}">${escape(categoryName)}</a> &gt;` : ''}
      <span>${escape(product.name)}</span>
    </nav>
  </header>

  <main>
    <article itemscope itemtype="https://schema.org/Product">
      <h1 itemprop="name">${escape(product.name)}</h1>

      ${allImages.map((img, i) => `<img src="${escape(img)}" alt="${escape(product.name)} - ${i === 0 ? 'Buy at Best Price in Bangladesh' : `Image ${i + 1}`} | ${SITE_NAME}" title="${escape(product.name)}" width="800" height="800" loading="${i === 0 ? 'eager' : 'lazy'}" itemprop="image">`).join('\n      ')}

      <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <meta itemprop="priceCurrency" content="BDT">
        <p>Price: <span itemprop="price" content="${product.price}">৳${product.price}</span></p>
        ${product.original_price ? `<p>Original Price: <del>৳${product.original_price}</del></p>` : ''}
        <link itemprop="availability" href="https://schema.org/InStock">
        <meta itemprop="url" content="${canonicalUrl}">
      </div>

      ${product.short_description ? `<p itemprop="description">${escape(product.short_description)}</p>` : ''}

      ${product.description ? `<section><h2>Description</h2><div>${product.description}</div></section>` : ''}

      ${whatYouGet.length > 0 ? `<section><h2>What You Get</h2><ul>${whatYouGet.map(item => `<li>${escape(String(item))}</li>`).join('')}</ul></section>` : ''}

      ${faqItems.length > 0 ? `<section><h2>Frequently Asked Questions</h2>${faqItems.map((f: any) => `<details><summary>${escape(f.question || f.q || '')}</summary><p>${escape(f.answer || f.a || '')}</p></details>`).join('')}</section>` : ''}

      ${reviewCount > 0 ? `<section><h2>Customer Reviews (${reviewCount})</h2><p>Average Rating: ${avgRating}/5</p>${reviews!.map(r => `<div itemprop="review" itemscope itemtype="https://schema.org/Review"><strong itemprop="author">${escape(r.author_name)}</strong> — ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}<p itemprop="reviewBody">${escape(r.body)}</p></div>`).join('')}</section>` : ''}
    </article>
  </main>

  <footer>
    <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
    <p>Bangladesh's most trusted digital software shop.</p>
    <nav>
      <a href="${SITE_URL}/about">About Us</a> |
      <a href="${SITE_URL}/contact">Contact</a> |
      <a href="${SITE_URL}/privacy-policy">Privacy Policy</a> |
      <a href="${SITE_URL}/refund-policy">Refund Policy</a>
    </nav>
  </footer>

  <script>
    // Redirect real users to the SPA version
    if (!/bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot/i.test(navigator.userAgent)) {
      window.location.replace("${canonicalUrl}");
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch (error) {
    console.error('Prerender error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
