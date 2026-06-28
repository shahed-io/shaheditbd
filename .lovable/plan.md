# Custom Offer Forms & AI Winner System

Google Form-এর পরিবর্তে আমাদের নিজস্ব domain-এ (`shahedstore.com.bd/offer/<slug>`) সম্পূর্ণ custom form system তৈরি হবে — admin panel থেকে fully controllable.

## Admin এ যা করা যাবে (`/ceo/offers`)

**Offer Management**
- নতুন offer তৈরি / edit / delete / duplicate
- Title, description (markdown), banner image, prize details, terms
- Custom slug → public URL: `shahedstore.com.bd/offer/your-slug`
- Status: draft / active / closed
- Start date, end date (auto-close)
- Max submissions limit (optional)
- Login required toggle
- Success message customization

**Form Builder (Drag & Drop ছাড়া simple list)**
- Field types: text, email, phone, number, textarea, select (dropdown), radio, checkbox, date, file upload
- প্রতিটি field-এ: label, placeholder, required toggle, validation, help text
- Field reorder (up/down arrow)
- যেকোন সংখ্যক field add করা যাবে

**Google Form Hybrid (optional)**
- চাইলে Google Form URL embed করা যাবে fallback হিসেবে
- কিন্তু public link সবসময় আমাদের domain-এ থাকবে (proxy/embed)

**Submissions View**
- সব entries table view-এ
- Search, filter, CSV export
- Individual submission detail modal

**AI Winner Picker** ⭐
- "Pick Winners" button
- Number of winners select (1-100)
- Prize names list (Winner 1: X, Winner 2: Y...)
- Selection mode:
  - Random (fair random)
  - AI Smart Pick (Gemini analyzes submissions — quality, engagement, completeness)
- Winners auto-saved, displayed with badge
- Optional: auto-email winners
- Re-pick / manual override

## Public Side

- `/offer/<slug>` page — branded with site theme, glassmorphism design
- Form renders dynamically from builder config
- Validation client + server side
- Success page with custom message
- Closed/expired offer shows "Offer ended" state
- Optional winners announcement section

## Technical

**Database tables (4 new):**
```
offers
  id, slug (unique), title, description, banner_url, prize_details,
  terms, status, start_at, end_at, max_submissions, require_login,
  success_message, google_form_url, show_winners, created_at

offer_fields
  id, offer_id, field_type, label, placeholder, required, options (jsonb),
  validation (jsonb), help_text, sort_order

offer_submissions
  id, offer_id, user_id (nullable), data (jsonb), ip, user_agent,
  is_winner, winner_rank, prize_won, created_at

offer_winners (denormalized for display)
  id, offer_id, submission_id, rank, prize, selected_by (ai/random/manual),
  announced, created_at
```
All with RLS + GRANTs (public read on active offers/fields, public insert on submissions, admin-only writes).

**Edge function:** `pick-winners` — receives offer_id, count, mode, prizes → if AI mode, calls Lovable AI Gateway (Gemini) with submission data to score & rank → writes to `offer_winners`.

**Files:**
- New: `src/pages/admin/AdminOffers.tsx` (list), `AdminOfferEditor.tsx` (form builder + settings + submissions + winner picker)
- New: `src/pages/OfferPage.tsx` (public)
- New route `/offer/:slug` in `App.tsx`
- Sidebar menu item "Offers" with Gift icon in `AdminLayout.tsx`
- Edge function `supabase/functions/pick-winners/index.ts`

## Default settings
- Login NOT required (anyone can join)
- AI winner pick uses Gemini 2.5 Flash
- Admin UI: English (per project rule)
- Public offer page: Bengali

---

এটা approve করলেই full system build করে দিচ্ছি। কোনো adjustment লাগবে কি?
