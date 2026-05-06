---
name: Copy Protection Active
description: Full design copy protection enabled site-wide via ScraperShield + installCopyDeterrents
type: constraint
---
Copy protection is FULLY ACTIVE site-wide (reversed earlier "fully allowed" rule).

**Active deterrents (real humans only — bots in ALLOWED_BOT_SIGNATURES are skipped):**
- Right-click / context menu blocked everywhere except `input, textarea, select, [contenteditable="true"], .allow-select, .allow-copy, [data-allow-select="true"], .prose, .product-description, .blog-content`
- `copy` / `cut` events replace clipboard with copyright notice
- `dragstart`, `selectstart` blocked on chrome zones
- DevTools shortcuts blocked (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, PrintScreen)
- DevTools shortcuts blocked (no page blur — user explicitly rejected blur effect)
- CSS `user-select: none` on body by default; readable content opted in via allow-list
- `@media print` hides body to prevent print-to-PDF cloning
- `_redirects` returns 404 for `/*.md`, `/.lovable/*`, `/src/*`, `/supabase/*`, `/README*`, `/package*.json`, `/tsconfig*`, `/vite.config*`
- Scraper UAs (Firecrawl, ScrapingBee, HTTrack, etc.) → ScraperShield "Protected Content" notice

**Why:** User explicitly requested full anti-clone / anti-AI-copy protection.
**How to apply:** Mark any new readable content area with `.allow-select` / `class="prose"` / `data-allow-select="true"` so users can still copy product info.
