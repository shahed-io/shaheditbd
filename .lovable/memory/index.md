# Project Memory

## Core
React, Supabase Edge Functions. Database is the single source of truth. No WooCommerce.
Storefront design: 'Gradient Glassmorphism' (24-28px blur), dynamic HSL (`--brand-h`). White glass for PWA/Cards.
Admin design: Purple Glassmorphism Dashboard — soft lavender canvas, white-glass cards, violet accents (258 78% 55%), floating active pills, big violet icon page-header card. Matches user dashboard.
Language: Admin panel strictly English. Frontend in Bengali. Emails in English (`lang="en"`).
AI Card Generator: pastel mesh bg (lavender+pink+peach+sky blue) + CLEAR transparent soap bubbles, TRANSLUCENT GRAY-GLASS pill with WHITE "SHAHED STORE" text (NO red badge), white brand pill, contact line inside card.

## Memories
- [Product card generation](mem://features/product-card-generation) — Signature SHAHED STORE AI card visual blueprint (background, pills, bubbles, contact)
- [Admin design system](mem://style/admin-design-system) — Notion/Stripe clean minimal admin: --ad-* tokens, glass sidebar with backdrop, orange+black accent; auto-applied via body.admin-page
- [Microsoft CID Generator](mem://features/microsoft-cid-generator) — Public /get-cid page, Gemini Vision OCR, 1 credit/CID from cid_balances, generic Primary/Backup channels
