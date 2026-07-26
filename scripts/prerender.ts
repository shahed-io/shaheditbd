// Build-time prerender.
//
// Runs after `vite build` (via `postbuild` in package.json).
// For every SEO-important URL in `public/sitemap.xml`, boot the SPA in
// headless Chromium, wait for React to hydrate, and snapshot the fully
// rendered HTML to `dist/<route>/index.html`. Hosting then serves that
// static HTML as the initial response for the route, so Googlebot and
// other crawlers see the real h1, product name/price, image tags, and
// per-route JSON-LD without executing JavaScript. React still hydrates
// on top — no behavior change for real users.
//
// Failures never break the build: any route we can't prerender simply
// falls back to the SPA shell (`dist/index.html`), which is the same
// behavior the site had before this script existed.

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { XMLParser } from "fast-xml-parser";
import { startPrerenderServer } from "./prerender-server";

const DIST_DIR = resolve("dist");
const SITEMAP_PATH = resolve("public/sitemap.xml");
const BASE_URL = "https://shahedstore.com.bd";
const PORT = 4183;
const MAX_PRERENDER_PAGES = Number(process.env.MAX_PRERENDER_PAGES || 2000);
const NAV_TIMEOUT_MS = 30_000;
const RENDER_SETTLE_MS = 400;
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 4);

const SKIP_PREFIXES = [
  "/checkout",
  "/dashboard",
  "/ceo",
  "/admin",
  "/reset-password",
  "/unsubscribe",
  "/pay/",
  "/auth",
  "/login",
  "/refund-request",
  "/oauth",
];

interface Route {
  urlPath: string; // e.g. "/", "/shop?category=windows"
  outPath: string; // e.g. "dist/index.html", "dist/shop/windows/index.html"
  kind: "home" | "static" | "product" | "category" | "blog" | "other";
}

function classify(pathname: string): Route["kind"] {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/product/")) return "product";
  if (pathname.startsWith("/blog/")) return "blog";
  if (pathname.startsWith("/shop") && pathname.includes("category=")) return "category";
  return "static";
}

function toRoute(loc: string): Route | null {
  let u: URL;
  try {
    u = new URL(loc);
  } catch {
    return null;
  }
  const pathname = u.pathname || "/";
  if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))) {
    return null;
  }
  const kind = classify(pathname + u.search);

  let outRel: string;
  if (pathname === "/" && !u.search) {
    outRel = "index.html";
  } else if (kind === "category") {
    const cat = u.searchParams.get("category");
    if (!cat) return null;
    outRel = join("shop", cat, "index.html");
  } else {
    outRel = join(pathname.replace(/^\//, ""), "index.html");
  }

  return {
    urlPath: pathname + u.search,
    outPath: join(DIST_DIR, outRel),
    kind,
  };
}

async function loadRoutes(): Promise<Route[]> {
  if (!existsSync(SITEMAP_PATH)) {
    console.warn("[prerender] sitemap.xml missing — skipping");
    return [];
  }
  const xml = await readFile(SITEMAP_PATH, "utf-8");
  const parser = new XMLParser({ ignoreAttributes: false, isArray: (n) => n === "url" });
  const parsed = parser.parse(xml);
  const urls: Array<{ loc: string }> = parsed?.urlset?.url || [];
  const routes: Route[] = [];
  const seen = new Set<string>();
  for (const u of urls) {
    const loc = typeof u.loc === "string" ? u.loc : String(u.loc || "");
    if (!loc) continue;
    const r = toRoute(loc);
    if (!r) continue;
    if (seen.has(r.urlPath)) continue;
    seen.add(r.urlPath);
    routes.push(r);
    if (routes.length >= MAX_PRERENDER_PAGES) break;
  }
  return routes;
}

function sanitizeHtml(html: string, canonicalPath: string): string {
  // Strip any vite dev/HMR markers just in case.
  let out = html.replace(/<script[^>]*src="\/@vite\/[^"]*"[^>]*><\/script>/g, "");
  out = out.replace(/<script[^>]*type="module"[^>]*src="\/@react-refresh"[^>]*><\/script>/g, "");
  // Mark snapshot for hydration debugging.
  out = out.replace(
    /<html([^>]*)>/,
    `<html$1 data-prerendered="true" data-prerender-path="${canonicalPath.replace(/"/g, "&quot;")}">`,
  );
  return out;
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.warn("[prerender] dist/ missing — did vite build run? skipping");
    return;
  }

  const routes = await loadRoutes();
  if (routes.length === 0) {
    console.warn("[prerender] no routes to prerender");
    return;
  }

  console.log(`[prerender] target: ${routes.length} routes (max ${MAX_PRERENDER_PAGES})`);

  // Lazy-import puppeteer so a missing binary produces a clean warning
  // rather than crashing the build.
  let puppeteer: typeof import("puppeteer");
  try {
    puppeteer = await import("puppeteer");
  } catch (e) {
    console.warn("[prerender] puppeteer not available — skipping prerender:", (e as Error).message);
    return;
  }

  const server = await startPrerenderServer(DIST_DIR, PORT).catch((e) => {
    console.warn("[prerender] failed to start static server:", e?.message || e);
    return null;
  });
  if (!server) return;

  let browser: import("puppeteer").Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (e) {
    console.warn("[prerender] failed to launch chromium — skipping prerender:", (e as Error).message);
    await server.stop();
    return;
  }

  const counts: Record<Route["kind"], number> = {
    home: 0,
    static: 0,
    product: 0,
    category: 0,
    blog: 0,
    other: 0,
  };
  let ok = 0;
  let fail = 0;

  async function renderOne(route: Route) {
    const page = await browser!.newPage();
    try {
      await page.setUserAgent(
        "Mozilla/5.0 (compatible; ShahedStorePrerender/1.0; +https://shahedstore.com.bd)",
      );
      // Speed up: block heavy 3rd-party requests we don't need in HTML.
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const url = req.url();
        if (
          url.includes("googletagmanager.com") ||
          url.includes("google-analytics.com") ||
          url.includes("facebook.net") ||
          url.includes("clarity.ms") ||
          url.includes("hotjar")
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });

      const target = `http://127.0.0.1:${PORT}${route.urlPath}`;
      await page.goto(target, { waitUntil: "networkidle0", timeout: NAV_TIMEOUT_MS });

      // Wait for the app root to have real content and an h1 to appear.
      await page
        .waitForFunction(
          () => {
            const root = document.getElementById("root");
            if (!root || root.children.length === 0) return false;
            return !!document.querySelector("h1, [data-prerender-ready='true']");
          },
          { timeout: 15_000 },
        )
        .catch(() => {
          /* fall through with whatever rendered */
        });

      await new Promise((r) => setTimeout(r, RENDER_SETTLE_MS));

      const html = await page.content();
      const finalHtml = sanitizeHtml(html, route.urlPath);

      await mkdir(dirname(route.outPath), { recursive: true });
      await writeFile(route.outPath, finalHtml, "utf-8");

      counts[route.kind]++;
      ok++;
    } catch (e) {
      fail++;
      console.warn(`[prerender] failed ${route.urlPath}: ${(e as Error).message}`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  // Simple concurrency pool.
  let i = 0;
  async function worker() {
    while (i < routes.length) {
      const idx = i++;
      await renderOne(routes[idx]);
      if (ok % 25 === 0 && ok > 0) {
        console.log(`[prerender] progress ${ok + fail}/${routes.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  await browser.close().catch(() => {});
  await server.stop().catch(() => {});

  console.log(
    `[prerender] wrote ${ok}/${routes.length} HTML files (` +
      `${counts.home} home, ${counts.static} static, ${counts.product} products, ` +
      `${counts.category} categories, ${counts.blog} blog posts, ${fail} failed)`,
  );
}

main().catch((e) => {
  console.error("[prerender] fatal:", e);
  // Never break the build.
  process.exit(0);
});
