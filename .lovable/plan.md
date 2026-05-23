# Payment Link Order System

একটা সম্পূর্ণ "Payment Link" system তৈরি করব যেখানে admin link বানাবে, customer fill করে submit করবে, admin approve করলে real order হয়ে যাবে।

## Workflow

```
Admin → Create Link (product + price + custom fields)
      → Copy link → send to customer (Messenger/WhatsApp)
Customer → Open link → see product details
         → Fill: name, phone, email, address (if needed)
         → Upload payment screenshot + Transaction ID + payment method
         → Submit
Admin → Review submissions in panel
      → Approve → auto-create real order (existing orders table) + assign license + send email
      → Reject → notify customer with reason
```

## Database (new tables)

**`payment_links`** — admin-created link templates
- `id`, `slug` (unique, short URL key), `title`, `description`
- `product_id` (nullable — can be custom product), `product_name`, `product_image`
- `amount` (required), `original_amount` (optional, for discount display)
- `quantity` (default 1, customer can edit if `allow_qty_change` true)
- `payment_methods` (jsonb array: bKash/Nagad/Rocket/Bank with numbers/instructions)
- `required_fields` (jsonb: name/phone/email/address/note — which to collect)
- `custom_fields` (jsonb: extra fields like "Email for delivery", "PC Username")
- `max_uses` (nullable, total submission limit), `current_uses` (counter)
- `expires_at` (nullable)
- `status` ('active' | 'paused' | 'expired')
- `redirect_url` (optional, after successful submission)
- `created_by`, `created_at`, `updated_at`

**`payment_link_submissions`** — customer submissions
- `id`, `payment_link_id` (FK), `link_slug` (snapshot)
- `customer_name`, `customer_phone`, `customer_email`, `customer_address` (nullable)
- `product_name`, `product_image`, `amount`, `quantity`, `total`
- `payment_method` (bKash/Nagad/etc.), `transaction_id`, `sender_number`
- `payment_screenshot_url` (storage)
- `custom_field_values` (jsonb)
- `customer_note`
- `status` ('pending' | 'approved' | 'rejected' | 'converted')
- `admin_note` (rejection reason)
- `order_id` (uuid, set when approved & converted to real order)
- `reviewed_by`, `reviewed_at`
- `ip_address`, `user_agent`
- `created_at`, `updated_at`

**RLS:**
- `payment_links`: admin full access; public can SELECT only `status = active` rows by slug
- `payment_link_submissions`: public can INSERT (rate-limited via IP); admin full access; customer can SELECT their own by submission id (returned after submit)

**Storage bucket:** `payment-proofs` (private, admin read; public insert via edge function)

## Pages

**Public route `/pay/:slug`** (`src/pages/PaymentLink.tsx`)
- Beautiful glassmorphism card — product image, name, price (Bengali)
- Payment instructions per method (tabs: bKash/Nagad/Rocket/Bank)
- Form: dynamic required fields + custom fields + Transaction ID + screenshot upload
- Submit → INSERT submission → show "✅ আপনার অর্ডার review-এ আছে, approve হলে confirmation পাবেন" + submission tracking link `/pay/track/:submissionId`

**Public route `/pay/track/:submissionId`** — status page (pending/approved/rejected with order link if approved)

**Admin route `/ceo/payment-links`** (`AdminPaymentLinks.tsx`)
- Tab 1: **Links** — list, create new, edit, pause, copy URL, QR code, view stats (submissions/conversions)
- Tab 2: **Submissions** — filterable (pending/approved/rejected), view payment proof, Approve/Reject buttons
- Create dialog: product picker (from existing products) OR custom, amount, payment methods config, required fields toggles, custom fields builder, expiry, max uses
- Approve action → calls `approve-payment-submission` edge function → creates real order in `orders` + `order_items`, triggers existing license auto-assignment + email

## Edge Functions

**`submit-payment-link`** (public, verify_jwt=false)
- Zod validation, IP rate limit (5/min), upload screenshot to storage, insert submission
- Returns submission ID + tracking URL
- Sends Telegram alert to admin

**`approve-payment-submission`** (admin only)
- Verify admin role via `has_role`
- Create order in `orders` table (status='processing', payment_status='paid'), `order_items`
- Update submission → `status='approved'`, `order_id=...`
- Existing triggers handle license assignment, email, points
- Send customer email/SMS with order details

**`reject-payment-submission`** (admin only)
- Update status, save admin note, notify customer (email if provided)

## Implementation Order

1. Migration: 2 tables + RLS + storage bucket + indexes
2. Edge functions (submit, approve, reject)
3. `src/pages/PaymentLink.tsx` (public form)
4. `src/pages/PaymentLinkTrack.tsx` (status)
5. `src/pages/admin/AdminPaymentLinks.tsx` (admin panel — English UI per memory)
6. Add routes in `App.tsx` + admin sidebar entry
7. QR code generation (existing `api.qrserver.com` pattern per memory)

## Reuse / Integration

- Existing `orders`/`order_items` tables — approved submission becomes a normal order, so all existing flows (license auto-assign, email, Telegram, points, invoice PDF) work automatically
- Glassmorphism design tokens already in `index.css`
- Telegram notifications via existing `notify-telegram-event`
- Bengali frontend, English admin (per project memory)

## Out of scope (this iteration)

- Recurring/subscription payment links
- Multi-product carts in a single link (one product per link for v1; can extend later)
- Auto payment gateway verification (manual Transaction ID review)

Confirm and I'll start building.
