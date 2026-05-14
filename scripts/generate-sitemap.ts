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

const BASE_URL = "https://shahedstore.com.bd";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://dpvdavjwqyviredzoorj.supabase.co";
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
  image?: { url: string; title?: string };
}

// ─── 1. Static public routes (mirror src/App.tsx, exclude admin/auth) ──
const STATIC_ROUTES: Entry[] = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop", changefreq: "daily", priority: "0.9" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
  { loc: "/about", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact-us", changefreq: "monthly", priority: "0.6" },
  { loc: "/faqs", changefreq: "monthly", priority: "0.7" },
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
  { loc: "/refund-request", changefreq: "monthly", priority: "0.4" },
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

function entryToXml(e: Entry): string {
  const parts = [
    `  <url>`,
    `    <loc>${escapeXml(BASE_URL + e.loc)}</loc>`,
  ];
  if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
  if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
  if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
  if (e.image) {
    parts.push(`    <image:image>`);
    parts.push(`      <image:loc>${escapeXml(e.image.url)}</image:loc>`);
    if (e.image.title) {
      parts.push(`      <image:title>${escapeXml(e.image.title)}</image:title>`);
    }
    parts.push(`    </image:image>`);
  }
  parts.push(`  </url>`);
  return parts.join("\n");
}

async function main() {
  const entries: Entry[] = [...STATIC_ROUTES];

  // ─── 2. Active products ────────────────────────────────────────
  const products = await fetchTable<{
    slug: string;
    updated_at: string;
    image_url: string | null;
    name: string;
  }>(
    "products",
    "select=slug,updated_at,image_url,name&status=eq.active&order=updated_at.desc&limit=2000",
  );
  for (const p of products) {
    if (!p.slug) continue;
    entries.push({
      loc: `/product/${p.slug}`,
      lastmod: p.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
      image: p.image_url
        ? { url: p.image_url, title: p.name }
        : undefined,
    });
  }

  // ─── 3. Active categories (rendered via /shop?category=slug) ───
  const categories = await fetchTable<{ slug: string; updated_at: string }>(
    "categories",
    "select=slug,updated_at&is_active=eq.true&order=sort_order.asc&limit=200",
  );
  for (const c of categories) {
    if (!c.slug) continue;
    entries.push({
      loc: `/shop?category=${encodeURIComponent(c.slug)}`,
      lastmod: c.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
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
      image: post.featured_image
        ? { url: post.featured_image, title: post.title }
        : undefined,
    });
  }

  // ─── Build XML ─────────────────────────────────────────────────
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...entries.map(entryToXml),
    `</urlset>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(
    `[sitemap] wrote public/sitemap.xml — ${entries.length} URLs ` +
      `(${STATIC_ROUTES.length} static, ${products.length} products, ` +
      `${categories.length} categories, ${posts.length} blog posts)`,
  );
}

main().catch((e) => {
  console.error("[sitemap] generation failed:", e);
  // Don't fail the build — keep whatever sitemap.xml already exists.
  process.exit(0);
});
