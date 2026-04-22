# Project Memory

## Core
React, Supabase Edge Functions. Database is the single source of truth. No WooCommerce.
Storefront design: 'Gradient Glassmorphism' (24-28px blur), dynamic HSL (`--brand-h`). White glass for PWA/Cards.
Admin design: Notion/Stripe Clean Light Minimal — pure white surfaces, hairline borders, glass sidebar with backdrop, orange (#FF6B1A) + black accent. NEVER apply gradient glassmorphism to admin panel.
Language: Admin panel strictly English. Frontend in Bengali. Emails in English (`lang="en"`).
AI Card Generator: pale-blue/white bg + sky-blue/mint bubbles, WHITE pill with RED inner SHAHED STORE badge, white brand pill, contact line inside card. NEVER pastel pink/peach/lavender bg.

## Memories
- [Product card generation](mem://features/product-card-generation) — Signature SHAHED STORE AI card visual blueprint (background, pills, bubbles, contact)
- [Admin design system](mem://style/admin-design-system) — Notion/Stripe clean minimal admin: --ad-* tokens, glass sidebar with backdrop, orange+black accent; auto-applied via body.admin-page
