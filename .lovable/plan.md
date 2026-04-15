

# নতুন ভিজিটরদের জন্য র‍্যান্ডম ডিসকাউন্ট কুপন সিস্টেম

## কনসেপ্ট
নতুন ভিজিটর সাইটে প্রবেশ করলে ২-৩ সেকেন্ড পর একটি আকর্ষণীয় পপআপ দেখাবে যেখানে ৫-১২% র‍্যান্ডম ডিসকাউন্ট কুপন কোড থাকবে, ৩০-৬০ মিনিটের কাউন্টডাউন টাইমার সহ। কুপনটি চেকআউটে ব্যবহারযোগ্য হবে।

## পরিকল্পনা

### 1. ডাটাবেস — `welcome_coupons` টেবিল তৈরি
নতুন টেবিল যেখানে অটো-জেনারেটেড কুপনগুলো সংরক্ষিত থাকবে:
- `code`, `discount_percent` (5-12), `expires_at`, `is_used`, `visitor_id` (localStorage fingerprint)
- RLS: service_role insert/update, anon/authenticated select by code

### 2. Edge Function — `generate-welcome-coupon`
- ভিজিটরের `visitor_id` চেক করে — আগে কুপন পেয়ে থাকলে আর দেবে না
- র‍্যান্ডম ৫-১২% ডিসকাউন্ট ও ৩০-৬০ মিনিটের মেয়াদ নির্ধারণ
- ইউনিক কুপন কোড জেনারেট করে (যেমন: `WELCOME-A3F8K2`)
- ডাটাবেসে সেভ করে কুপন রিটার্ন

### 3. `validate-coupon` Edge Function আপডেট
- বিদ্যমান `coupons` টেবিলের পাশাপাশি `welcome_coupons` টেবিলও চেক করবে
- মেয়াদ ও ব্যবহারের অবস্থা যাচাই করবে

### 4. নতুন কম্পোনেন্ট — `WelcomeDiscount.tsx`
- গ্লাসমরফিজম পপআপ ডিজাইন (ব্র্যান্ডের সাথে সামঞ্জস্যপূর্ণ)
- কুপন কোড কপি বাটন
- লাইভ কাউন্টডাউন টাইমার (মিনিট:সেকেন্ড)
- localStorage দিয়ে ট্র্যাকিং — একবার দেখানোর পর আবার দেখাবে না
- বাংলা টেক্সট

### 5. Index.tsx-এ ইন্টিগ্রেশন
- `WelcomeDiscount` কম্পোনেন্ট lazy load করে যোগ

## ফাইল পরিবর্তন
- **নতুন মাইগ্রেশন** — `welcome_coupons` টেবিল তৈরি
- **নতুন** `supabase/functions/generate-welcome-coupon/index.ts`
- **এডিট** `supabase/functions/validate-coupon/index.ts` — welcome coupon সাপোর্ট
- **নতুন** `src/components/store/WelcomeDiscount.tsx`
- **এডিট** `src/pages/Index.tsx` — কম্পোনেন্ট যোগ

