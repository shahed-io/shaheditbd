# Project Memory

## Core
React, Supabase Edge Functions. Database is the single source of truth. No WooCommerce.
Storefront design: 'Gradient Glassmorphism' (24-28px blur), dynamic HSL (`--brand-h`). White glass for PWA/Cards.
Admin design: Purple Glassmorphism Dashboard — soft lavender canvas, white-glass cards, violet accents (258 78% 55%), floating active pills, big violet icon page-header card. Matches user dashboard.
Language: Admin panel strictly English. Frontend in Bengali. Emails in English (`lang="en"`).
AI Card Generator: ALL 6 styles share one blueprint — bright pale sky-blue mesh + glossy 3D orb bubbles (blue/mint/lilac, some blurred) + white pill with RED "SHAHED" badge + dark "STORE" text + white brand pill + bottom contact line with divider. Style variants only tweak background tone subtly.

## Memories
- [Product card generation](mem://features/product-card-generation) — Signature SHAHED STORE AI card visual blueprint (background, pills, bubbles, contact)
- [Admin design system](mem://style/admin-design-system) — Notion/Stripe clean minimal admin: --ad-* tokens, glass sidebar with backdrop, orange+black accent; auto-applied via body.admin-page
- [Microsoft CID Generator](mem://features/microsoft-cid-generator) — Public /get-cid page, Gemini Vision OCR, 1 credit/CID from cid_balances, generic Primary/Backup channels
