// Generic SEO prerender for non-product pages: /, /shop, /blog, /blog/:slug,
// /faqs, /about, /contact-us, /free-tools, /delivery-info, /refund-policy, etc.
// Serves bots a fully-rendered HTML with title, description, JSON-LD,
// internal links, and product list — so Google indexes everything fast.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = 'https://shahedstore.com.bd';
const SITE_NAME = 'Shahed Store';

const escape = (s: string) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageMeta {
  title: string;
  description: string;
  h1: string;
  intro: string;
  path: string;
}

const STATIC_META: Record<string, PageMeta> = {
  '/': {
    title: `${SITE_NAME} — Bangladesh's #1 Digital Software Shop | Windows, Office, Adobe`,
    description: `Buy Windows 11, Microsoft Office 365, Adobe Creative Cloud, Antivirus, VPN at the lowest price in Bangladesh. 100% genuine licenses. Instant delivery. Trusted by 10,000+ customers.`,
    h1: `${SITE_NAME} — Bangladesh's Most Trusted Digital Software Shop`,
    intro: `Welcome to ${SITE_NAME}, the #1 destination in Bangladesh for genuine digital software licenses, Office 365, Windows keys, antivirus, VPN, streaming subscriptions and more — all at the lowest prices with instant delivery.`,
    path: '/',
  },
  '/shop': {
    title: `Shop All Digital Software Bangladesh — Lowest Price | ${SITE_NAME}`,
    description: `Browse all genuine software products in Bangladesh: Windows, Office 365, Adobe, Antivirus, Netflix, Spotify, VPN. 100% original. Fast delivery from ${SITE_NAME}.`,
    h1: 'Shop All Products',
    intro: `Explore the complete catalog of digital software, license keys, and subscriptions available in Bangladesh from ${SITE_NAME}.`,
    path: '/shop',
  },
  '/blog': {
    title: `Software Tips, Guides & News — ${SITE_NAME} Blog`,
    description: `Read the latest tips, tutorials, and guides on Windows, Office, Adobe, antivirus, VPN, and more. Curated by ${SITE_NAME} for Bangladesh users.`,
    h1: `${SITE_NAME} Blog`,
    intro: `In-depth software tutorials, buying guides, and tech news for Bangladesh users.`,
    path: '/blog',
  },
  '/faqs': {
    title: `Frequently Asked Questions — ${SITE_NAME} Bangladesh`,
    description: `Answers to common questions about ordering, payment, delivery, refund and software activation at ${SITE_NAME} Bangladesh.`,
    h1: 'Frequently Asked Questions',
    intro: `Everything you need to know about shopping for digital software with ${SITE_NAME}.`,
    path: '/faqs',
  },
  '/about': {
    title: `About ${SITE_NAME} — Bangladesh's Trusted Software Shop`,
    description: `${SITE_NAME} is Bangladesh's leading digital software shop. Genuine licenses, instant delivery, and 24/7 customer support since 2020.`,
    h1: `About ${SITE_NAME}`,
    intro: `${SITE_NAME} has been serving thousands of customers across Bangladesh with genuine software licenses since 2020.`,
    path: '/about',
  },
  '/contact-us': {
    title: `Contact ${SITE_NAME} — Customer Support Bangladesh`,
    description: `Get in touch with ${SITE_NAME} for product support, sales enquiries, or order help. WhatsApp, phone, and email support available 24/7.`,
    h1: 'Contact Us',
    intro: `Reach the ${SITE_NAME} team via WhatsApp, phone, or email — 24/7 support for all customers in Bangladesh.`,
    path: '/contact-us',
  },
  '/free-tools': {
    title: `Free Tools & Utilities — ${SITE_NAME} Bangladesh`,
    description: `Free software tools, license checkers, key validators and tech utilities curated by ${SITE_NAME} for Bangladesh users.`,
    h1: 'Free Tools',
    intro: `Useful free tools and utilities provided by ${SITE_NAME}.`,
    path: '/free-tools',
  },
  '/delivery-info': {
    title: `Delivery Information — ${SITE_NAME} Bangladesh`,
    description: `Learn how digital products are delivered at ${SITE_NAME}. Most orders delivered instantly within 1–24 hours via email and WhatsApp.`,
    h1: 'Delivery Information',
    intro: `Fast, instant digital delivery across Bangladesh.`,
    path: '/delivery-info',
  },
  '/refund-policy': {
    title: `Refund Policy — ${SITE_NAME} Bangladesh`,
    description: `${SITE_NAME} refund policy: clear timelines, fair process. Refunds processed within 1–7 days subject to terms.`,
    h1: 'Refund Policy',
    intro: `Our customer-friendly refund policy explained.`,
    path: '/refund-policy',
  },
  '/privacy-policy': {
    title: `Privacy Policy — ${SITE_NAME}`,
    description: `How ${SITE_NAME} protects and handles your personal data, in compliance with Bangladesh data privacy practices.`,
    h1: 'Privacy Policy',
    intro: `Your privacy and trust are our top priorities.`,
    path: '/privacy-policy',
  },
  '/terms-conditions': {
    title: `Terms & Conditions — ${SITE_NAME}`,
    description: `Terms of service and shopping conditions at ${SITE_NAME} Bangladesh.`,
    h1: 'Terms & Conditions',
    intro: `Please read our terms before placing an order.`,
    path: '/terms-conditions',
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'OnlineStore'],
  name: SITE_NAME,
  alternateName: ['Shahed Store BD', 'শাহেদ স্টোর'],
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  sameAs: [
    'https://www.facebook.com/Shahed.Store365',
    'https://www.facebook.com/shahedstore',
    'https://wa.me/8801840099853',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+8801840099853',
    contactType: 'customer service',
    areaServed: 'BD',
    availableLanguage: ['Bengali', 'English'],
  },
  areaServed: { '@type': 'Country', name: 'Bangladesh' },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/shop?search={q}`,
    'query-input': 'required name=q',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';
    const blogSlug = url.searchParams.get('blogSlug');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Blog post (dynamic)
    if (path === '/blog' && blogSlug) {
      const { data: post } = await supabase
        .from('blog_posts')
        .select('title, excerpt, content, image_url, published_at, updated_at, author_name, slug')
        .eq('slug', blogSlug)
        .eq('status', 'published')
        .maybeSingle();

      if (!post) return new Response('Not found', { status: 404 });

      const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
      const desc = (post.excerpt || (post.content ? String(post.content).slice(0, 160) : post.title)).replace(/<[^>]+>/g, '');
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: desc,
        image: post.image_url || `${SITE_URL}/favicon.png`,
        url: canonicalUrl,
        datePublished: post.published_at || new Date().toISOString(),
        dateModified: post.updated_at || post.published_at,
        author: { '@type': 'Person', name: post.author_name || SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` } },
        mainEntityOfPage: canonicalUrl,
      };

      return htmlResponse(buildHtml({
        title: `${post.title} — ${SITE_NAME} Blog`,
        description: desc,
        canonical: canonicalUrl,
        h1: post.title,
        bodyHtml: `<article>${post.image_url ? `<img src="${escape(post.image_url)}" alt="${escape(post.title)}" width="1200" height="630">` : ''}<div>${post.content || ''}</div></article>`,
        schemas: [articleSchema, orgSchema, websiteSchema],
      }));
    }

    const meta = STATIC_META[path] || STATIC_META['/'];
    const canonicalUrl = `${SITE_URL}${meta.path}`;

    // For homepage and shop, list top products as anchor links so Googlebot crawls them
    let productList = '';
    let itemListJson: any = null;
    if (path === '/' || path === '/shop') {
      const { data: products } = await supabase
        .from('products')
        .select('name, slug, price, original_price, image_url, short_description, total_sales')
        .eq('status', 'active')
        .order('total_sales', { ascending: false })
        .limit(60);

      if (products?.length) {
        productList = `<section><h2>Featured Products</h2><ul>${products.map(p => {
          const purl = `${SITE_URL}/product/${p.slug}`;
          return `<li><a href="${purl}" title="${escape(p.name)}"><img src="${escape(p.image_url || '/favicon.png')}" alt="${escape(p.name)} — Price in Bangladesh" width="200" height="200" loading="lazy"><strong>${escape(p.name)}</strong> — <span>৳${p.price}</span>${p.short_description ? `<p>${escape(p.short_description)}</p>` : ''}</a></li>`;
        }).join('')}</ul></section>`;

        itemListJson = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Products at ${SITE_NAME}`,
          numberOfItems: products.length,
          itemListElement: products.slice(0, 30).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/product/${p.slug}`,
            name: p.name,
          })),
        };
      }
    }

    // Blog listing
    if (path === '/blog') {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('title, slug, excerpt, image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);

      if (posts?.length) {
        productList = `<section><h2>Latest Posts</h2><ul>${posts.map(p => {
          const purl = `${SITE_URL}/blog/${p.slug}`;
          return `<li><a href="${purl}"><strong>${escape(p.title)}</strong>${p.excerpt ? `<p>${escape(p.excerpt)}</p>` : ''}</a></li>`;
        }).join('')}</ul></section>`;
      }
    }

    const schemas = [orgSchema, websiteSchema];
    if (itemListJson) schemas.push(itemListJson);

    return htmlResponse(buildHtml({
      title: meta.title,
      description: meta.description,
      canonical: canonicalUrl,
      h1: meta.h1,
      bodyHtml: `<p>${escape(meta.intro)}</p>${productList}`,
      schemas,
    }));
  } catch (e) {
    console.error('prerender-page error', e);
    return new Response('Internal error', { status: 500 });
  }
});

function htmlResponse(html: string) {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=21600',
      'X-Robots-Tag': 'index, follow',
    },
  });
}

function buildHtml(o: { title: string; description: string; canonical: string; h1: string; bodyHtml: string; schemas: any[]; }) {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(o.title)}</title>
<meta name="description" content="${escape(o.description)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="geo.region" content="BD"><meta name="geo.placename" content="Bangladesh">
<link rel="canonical" href="${o.canonical}">
<link rel="alternate" hreflang="bn-BD" href="${o.canonical}">
<link rel="alternate" hreflang="en" href="${o.canonical}">
<link rel="alternate" hreflang="x-default" href="${o.canonical}">
<meta property="og:title" content="${escape(o.title)}">
<meta property="og:description" content="${escape(o.description)}">
<meta property="og:url" content="${o.canonical}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE_URL}/favicon.png">
<meta property="og:locale" content="bn_BD">
<meta name="twitter:card" content="summary_large_image">
${o.schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
</head><body>
<header><nav><a href="${SITE_URL}">${SITE_NAME}</a> — <a href="${SITE_URL}/shop">Shop</a> — <a href="${SITE_URL}/blog">Blog</a> — <a href="${SITE_URL}/faqs">FAQ</a> — <a href="${SITE_URL}/contact-us">Contact</a></nav></header>
<main><h1>${escape(o.h1)}</h1>${o.bodyHtml}</main>
<footer><p>&copy; ${new Date().getFullYear()} ${SITE_NAME} — Bangladesh's most trusted digital software shop.</p></footer>
<script>if(!/bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot/i.test(navigator.userAgent)){location.replace("${o.canonical}");}</script>
</body></html>`;
}
