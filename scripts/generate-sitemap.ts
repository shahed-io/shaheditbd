// Pre-build sitemap generator.
//
// Runs via `predev` and `prebuild` (see package.json) and writes
// `public/sitemap.xml` containing every public URL: static pages,
// active products, active categories, and published blog posts.
//
// We pull data directly from Supabase so the sitemap always matches
// the database (single source of truth — no stale cross-domain
// sitemap-index, no broken /_redirects proxies).

import { writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config();

const BASE_URL = "https://shahedit.com";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://dpvdavjwqyviredzoorj.supabase.co";
const SUPABASE_STORAGE_PUBLIC_PATH = "/storage/v1/object/public/";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

interface Entry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
  images?: { url: string; title?: string; caption?: string }[];
}

// ─── 1. Static public routes (mirror src/App.tsx, exclude admin/auth) ──
const STATIC_ROUTES: Entry[] = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop", changefreq: "daily", priority: "0.9" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
  { loc: "/link", changefreq: "weekly", priority: "0.6" },
  { loc: "/about", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact-us", changefreq: "monthly", priority: "0.6" },
  { loc: "/faqs", changefreq: "monthly", priority: "0.7" },
  { loc: "/antivirus-price-in-bd", changefreq: "weekly", priority: "0.8" },
  { loc: "/free-tools", changefreq: "weekly", priority: "0.7" },
  { loc: "/delivery-info", changefreq: "monthly", priority: "0.5" },
  { loc: "/refund-policy", changefreq: "monthly", priority: "0.4" },
  { loc: "/return-policy", changefreq: "monthly", priority: "0.4" },
  { loc: "/order-policy", changefreq: "monthly", priority: "0.4" },
  { loc: "/privacy-policy", changefreq: "monthly", priority: "0.4" },
  { loc: "/terms-conditions", changefreq: "monthly", priority: "0.4" },
  { loc: "/get-cid", changefreq: "weekly", priority: "0.6" },
  { loc: "/check-key", changefreq: "monthly", priority: "0.5" },
  { loc: "/affiliate", changefreq: "monthly", priority: "0.5" },
  { loc: "/install", changefreq: "monthly", priority: "0.5" },
];

async function fetchTable<T>(
  table: string,
  query: string,
): Promise<T[]> {
  if (!SUPABASE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${query}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(
        `[sitemap] ${table} fetch failed: ${res.status} ${await res.text()}`,
      );
      return [];
    }
    return (await res.json()) as T[];
  } catch (e) {
    console.warn(`[sitemap] ${table} fetch error:`, e);
    return [];
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanText(s: string | null | undefined, max = 180): string {
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function uniqueImages(primary?: string | null, gallery?: string[] | null): string[] {
  const out: string[] = [];
  const toIndexableUrl = (url: string) => {
    const clean = url.trim();
    if (clean.startsWith(`${SUPABASE_URL}${SUPABASE_STORAGE_PUBLIC_PATH}`)) {
      return clean.replace(SUPABASE_URL, BASE_URL);
    }
    if (clean.startsWith(SUPABASE_STORAGE_PUBLIC_PATH)) return `${BASE_URL}${clean}`;
    return clean;
  };
  const add = (url?: string | null) => {
    const clean = toIndexableUrl(url || '');
    if (!clean || !/^https?:\/\//i.test(clean) || out.includes(clean)) return;
    out.push(clean);
  };
  add(primary);
  if (Array.isArray(gallery)) gallery.forEach(add);
  return out;
}

function imageBlocks(images: Entry['images']): string[] {
  if (!images?.length) return [];
  return images.flatMap((image) => {
    const parts = [
      `    <image:image>`,
      `      <image:loc>${escapeXml(image.url)}</image:loc>`,
    ];
    if (image.title) parts.push(`      <image:title>${escapeXml(image.title)}</image:title>`);
    if (image.caption) parts.push(`      <image:caption>${escapeXml(image.caption)}</image:caption>`);
    parts.push(`      <image:license>${BASE_URL}/terms-conditions</image:license>`);
    parts.push(`    </image:image>`);
    return parts;
  });
}

function entryToXml(e: Entry): string {
  const parts = [
    `  <url>`,
    `    <loc>${escapeXml(BASE_URL + e.loc)}</loc>`,
  ];
  if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
  if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
  if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
  parts.push(...imageBlocks(e.images));
  parts.push(`  </url>`);
  return parts.join("\n");
}

function buildUrlset(entries: Entry[]): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...entries.map(entryToXml),
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const entries: Entry[] = [...STATIC_ROUTES];

  // ─── 2. Active products ────────────────────────────────────────
  const products = await fetchTable<{
    slug: string;
    updated_at: string;
    image_url: string | null;
    images: string[] | null;
    name: string;
    short_description: string | null;
    seo_title: string | null;
  }>(
    "products",
    "select=slug,updated_at,image_url,images,name,short_description,seo_title&status=eq.active&order=updated_at.desc&limit=5000",
  );
  for (const p of products) {
    if (!p.slug) continue;
    const images = uniqueImages(p.image_url, p.images);
    const caption = cleanText(p.short_description) || `${p.name} - genuine digital product from Shahed IT Bangladesh`;
    entries.push({
      loc: `/product/${p.slug}`,
      lastmod: p.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
      images: images.map((url, index) => ({
        url,
        title: index === 0 ? (p.seo_title || p.name) : `${p.name} - Product Image ${index + 1}`,
        caption,
      })),
    });
  }

  // ─── 3. Active categories (rendered via /shop?category=slug) ───
  const categories = await fetchTable<{ slug: string; updated_at: string; image_url: string | null; name: string; description: string | null }>(
    "categories",
    "select=slug,updated_at,image_url,name,description&is_active=eq.true&order=sort_order.asc&limit=500",
  );
  for (const c of categories) {
    if (!c.slug) continue;
    entries.push({
      loc: `/shop?category=${encodeURIComponent(c.slug)}`,
      lastmod: c.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
      images: c.image_url
        ? uniqueImages(c.image_url).map((url) => ({ url, title: `${c.name} - Buy in Bangladesh`, caption: cleanText(c.description) || `Shop ${c.name} digital products in Bangladesh` }))
        : undefined,
    });
  }

  // ─── 4. Published blog posts ───────────────────────────────────
  const posts = await fetchTable<{
    slug: string;
    updated_at: string;
    featured_image: string | null;
    title: string;
  }>(
    "blog_posts",
    "select=slug,updated_at,featured_image,title&status=eq.published&order=published_at.desc&limit=1000",
  );
  for (const post of posts) {
    if (!post.slug) continue;
    entries.push({
      loc: `/blog/${post.slug}`,
      lastmod: post.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
      images: post.featured_image
        ? uniqueImages(post.featured_image).map((url) => ({ url, title: post.title }))
        : undefined,
    });
  }

  // ─── 5. Published help-center articles (/link/:slug) ─────────────
  const helpArticles = await fetchTable<{ slug: string; updated_at: string }>(
    "help_articles",
    "select=slug,updated_at&status=eq.published&order=updated_at.desc&limit=1000",
  );
  for (const article of helpArticles) {
    if (!article.slug) continue;
    entries.push({
      loc: `/link/${article.slug}`,
      lastmod: article.updated_at?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  // ─── 6. Active payment links (/pay/:slug) ────────────────────────
  const paymentLinks = await fetchTable<{ slug: string; updated_at: string }>(
    "payment_links",
    "select=slug,updated_at&status=eq.active&order=updated_at.desc&limit=1000",
  );
  for (const link of paymentLinks) {
    if (!link.slug) continue;
    entries.push({
      loc: `/pay/${link.slug}`,
      lastmod: link.updated_at?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.3",
    });
  }

  // ─── Build XML ─────────────────────────────────────────────────
  const imageEntries = entries
    .filter((entry) => entry.images?.length)
    .map((entry) => ({ loc: entry.loc, images: entry.images }));

  const xml = buildUrlset(entries);
  const imageXml = buildUrlset(imageEntries);
  const sitemapIndex = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <sitemap>`,
    `    <loc>${BASE_URL}/sitemap.xml</loc>`,
    `  </sitemap>`,
    `  <sitemap>`,
    `    <loc>${BASE_URL}/image-sitemap.xml</loc>`,
    `  </sitemap>`,
    `</sitemapindex>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  writeFileSync(resolve("public/image-sitemap.xml"), imageXml);
  writeFileSync(resolve("public/sitemap_index.xml"), sitemapIndex);
  console.log(
    `[sitemap] wrote public/sitemap.xml — ${entries.length} URLs ` +
      `(${STATIC_ROUTES.length} static, ${products.length} products, ` +
      `${categories.length} categories, ${posts.length} blog posts, ` +
      `${helpArticles.length} help articles, ${paymentLinks.length} payment links, ` +
      `${imageEntries.length} image URLs)`,
  );
}

main().catch((e) => {
  console.error("[sitemap] generation failed:", e);
  // Don't fail the build — keep whatever sitemap.xml already exists.
  process.exit(0);
});
