---
name: SEO Critical Rules
description: Bengali lang attribute, og-image path, noscript SEO content rules to maintain ranking
type: constraint
---
**Critical SEO rules — never break these:**

1. `<html lang="bn">` (Bengali) — site content is primarily Bengali. NEVER set `documentElement.lang = 'en'`. Setting English breaks Bengali query ranking on Google BD.
2. Default OG image: `/og-image.jpg` (1200×630, served from own domain). Never use `*.r2.dev` or `*.lovable.app` preview URLs in production meta tags.
3. `index.html` `<noscript>` block contains the H1 + category links + Bengali keywords. Critical for non-JS crawlers (LinkedIn, Facebook, Slack) and as fallback ranking signal. Keep it rich.
4. `index.html` head must NOT contain duplicate og:title/og:description outside the structured block — causes meta dedup confusion.
5. Sitemap auto-generated via `scripts/generate-sitemap.ts` (predev/prebuild) pulling from Supabase. Static lovable.app preview URL must NEVER be the BASE_URL — always `https://shahedstore.com.bd`.
6. Per-route SEO via `SEOHead` component overrides sitewide defaults; product/blog pages set their own canonical, og:image, JSON-LD.
7. `robots.txt` blocks AhrefsBot/SemrushBot intentionally (anti-scraping memory) — third-party SEO tools will under-report; trust GSC instead.
