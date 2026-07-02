
## Giveaway System v2 — Professional Upgrade

Admin panel-focused overhaul. Public giveaway page remains as-is; only a new public **Winner Showcase** page is added.

---

### 1. Database (migration)

Extend `public.offers` with:
- `auto_publish` (bool) — activate automatically at `start_at`
- `auto_close` (bool) — close automatically at `end_at`
- `max_entries_per_user` (int, default 1)
- `min_purchase_amount` (numeric, nullable) — user must have spent this much
- `referral_bonus_entries` (int, default 0) — extra entries per referral
- `winner_count` (int, default 1)
- `winner_selection_mode` (text: `manual` | `random` | `weighted_referral`)
- `auto_notify_winners` (bool, default true) — dashboard notification + email

New table `public.offer_analytics_daily` (aggregated on the fly via view) — implemented as a SQL view over `offer_submissions` grouped by day.

Add pg_cron job (every 5 min) that:
- flips `status` to `active` when `auto_publish` AND `start_at <= now()`
- flips to `closed` when `auto_close` AND `end_at <= now()`

Trigger on `offer_winners INSERT` → if the parent offer has `auto_notify_winners`, insert a row into `notifications` for the winner's `user_id` and enqueue an email via existing `send-transactional-email`.

### 2. New Edge Functions

- `offer-auto-winner` — POST `{ offer_id }`. Picks N winners:
  - `random` → SQL `ORDER BY random()`
  - `weighted_referral` → weight = 1 + referral count
  - Skips already-selected. Inserts into `offer_winners` and updates `offer_submissions.is_winner`.
- `offer-export-csv` — POST `{ offer_id }`. Returns CSV of all submissions (dynamic form fields flattened).

### 3. New Email Template

`giveaway-winner.tsx` — congratulations email with prize name and CTA to dashboard.

### 4. Admin UI (`AdminOfferEditor.tsx`)

Add sections:
- **Schedule** — start/end datetime, auto-publish/close toggles, live countdown preview
- **Entry Rules** — max per user, min purchase, referral bonus, login required
- **Winner Selection** — mode picker, winner count, "🎲 Auto Pick Winners" button (calls edge fn), auto-notify toggle

New **Analytics tab** on the editor:
- Total entries, unique users, conversion %, daily entries chart (recharts)
- "Download CSV" button

### 5. Admin List (`AdminOffers.tsx`)

- Countdown badges (live), status pills for scheduled/active/closed
- Quick actions: Auto-Pick Winners, Export CSV, Notify Winners

### 6. Public Winner Showcase

New route `/winners` — public page listing past giveaways and their winners (name + rank + prize). Uses existing `show_winners` flag on offers.

### 7. Frontend Enforcement

On the existing giveaway submission flow:
- Check `max_entries_per_user` against user's prior submissions
- Check `min_purchase_amount` against user's completed orders
- Referral bonus recorded as duplicate submissions with `data.bonus=true`

---

### Files Created / Changed

**New:**
- `supabase/functions/offer-auto-winner/index.ts`
- `supabase/functions/offer-export-csv/index.ts`
- `supabase/functions/_shared/transactional-email-templates/giveaway-winner.tsx`
- `src/pages/Winners.tsx` (public route)
- `src/components/admin/OfferAnalytics.tsx`
- `src/components/admin/OfferScheduleSection.tsx`
- `src/components/admin/OfferEntryRulesSection.tsx`
- `src/components/admin/OfferWinnerSelectionSection.tsx`

**Modified:**
- `src/pages/admin/AdminOfferEditor.tsx` — integrate new sections + Analytics tab
- `src/pages/admin/AdminOffers.tsx` — countdowns + quick actions
- `src/App.tsx` — add `/winners` route
- Existing giveaway submission page — enforce new rules

Migration adds all columns, view, trigger, and cron job in one call. Email template registered in registry.

Confirm to proceed?
