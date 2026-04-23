---
name: Microsoft Confirmation ID Generator (User-facing)
description: Public /get-cid page for Microsoft CID generation with screenshot OCR (Gemini Vision) and per-CID credit debit from cid_balances table.
type: feature
---

`/get-cid` route — যেকোনো logged-in user CID generate করতে পারে। Architecture:

- **Page**: `src/pages/GetCID.tsx` — glassmorphism UI, Installation ID textarea + "or Upload Screenshot" button (Keyzol GetCID style)।
- **Edge Function actions** (`supabase/functions/get-cid/index.ts`):
  - `user_balance` — `cid_balances` table থেকে balance/total_added/total_used
  - `user_history` — recent 50 generations from `cid_generations`
  - `parse_screenshot` — Gemini 2.5 Flash vision API (LOVABLE_API_KEY) দিয়ে screenshot থেকে Installation ID auto-extract
  - `user_getcid` — 1 credit debit করে (admin skip), Primary→Backup channel routing, log to `cid_generations`
- **Billing**: 1 CID = 1 credit (`cid_balances.balance`)। Insufficient → 402 + "Buy Credits" link to /shop। Admins bypass billing।
- **Credit acquisition**: existing `auto_credit_cid_on_completion` trigger automatically adds credits when orders complete with products linked via `cid_product_credits` table।
- **Provider abstraction**: reseller-portal এর মতই upstream provider names (GetCID/Grahok) hidden — generic "Primary/Backup channel" terminology only।
- **Auth**: AuthModal triggers if guest tries to generate। Login → balance + history fetch।
