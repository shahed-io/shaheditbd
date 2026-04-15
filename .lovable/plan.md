

# সকল পেজ ও প্রোডাক্টের গুগল র‍্যাংকিং অপটিমাইজেশন

## সমস্যা বিশ্লেষণ
- **৮টি পেজে SEOHead নেই**: HelpCenter, DeliveryInfo, PrivacyPolicy, TermsConditions, RefundPolicy, ReturnPolicy, OrderPolicy, InstallApp — এগুলোতে কোনো টাইটেল, ডেসক্রিপশন বা ক্যানোনিক্যাল URL সেট হচ্ছে না
- **SPA সমস্যা**: React SPA হওয়ায় Googlebot অনেক সময় JavaScript রেন্ডার করতে পারে না — এর জন্য prerender.io বা সার্ভার-সাইড সমাধান দরকার
- **Schema.org অনুপস্থিত**: FAQs পেজে faqSchema নেই, Help Center-এ কোনো schema নেই
- **সাইটম্যাপে অসম্পূর্ণ**: Help articles অনুপস্থিত, static pages-এ lastmod নেই

## পরিকল্পনা

### 1. ৮টি পেজে SEOHead যোগ করা
প্রতিটি পেজে SEO-optimized title, description, keywords এবং canonical URL সেট করা:
- `HelpCenter.tsx` — "Help Center – Software Guide & Support"
- `DeliveryInfo.tsx` — "Delivery Information – Instant Digital Delivery"
- `PrivacyPolicy.tsx` — "Privacy Policy – Shahed Store"
- `TermsConditions.tsx` — "Terms & Conditions"
- `RefundPolicy.tsx` — "Refund Policy – 7-Day Guarantee"
- `ReturnPolicy.tsx` — "Return Policy"
- `OrderPolicy.tsx` — "Order Policy"
- `InstallApp.tsx` — "Install Shahed Store App – PWA"

### 2. FAQs পেজে faqSchema যোগ
FAQs পেজে ইতিমধ্যে থাকা FAQ ডেটা থেকে `faqSchema` জেনারেট করে SEOHead-এ পাস করা — Google সার্চে FAQ rich snippets দেখাবে

### 3. সাইটম্যাপে Help Articles যোগ
`sitemap/index.ts`-এ `help_articles` টেবিল থেকে published articles fetch করে URL যোগ করা

### 4. SEOHead-এ `hreflang` ও অতিরিক্ত মেটা ট্যাগ
- `hreflang="bn-BD"` এবং `hreflang="en"` alternate tags যোগ (Bangladesh bilingual SEO)
- `author` meta tag
- `publisher` meta tag

### 5. Prerender সাপোর্টের জন্য `<noscript>` ফলব্যাক
`index.html`-এ `<noscript>` ট্যাগে মূল কন্টেন্টের সারসংক্ষেপ রাখা — যাতে JavaScript disable থাকলেও basic SEO কাজ করে

## ফাইল পরিবর্তন
- `src/pages/HelpCenter.tsx` — SEOHead যোগ
- `src/pages/DeliveryInfo.tsx` — SEOHead যোগ
- `src/pages/PrivacyPolicy.tsx` — SEOHead যোগ
- `src/pages/TermsConditions.tsx` — SEOHead যোগ
- `src/pages/RefundPolicy.tsx` — SEOHead যোগ
- `src/pages/ReturnPolicy.tsx` — SEOHead যোগ
- `src/pages/OrderPolicy.tsx` — SEOHead যোগ
- `src/pages/InstallApp.tsx` — SEOHead যোগ
- `src/pages/FAQs.tsx` — faqSchema যোগ
- `supabase/functions/sitemap/index.ts` — help articles URL যোগ
- `src/components/seo/SEOHead.tsx` — hreflang ও author মেটা ট্যাগ যোগ
- `index.html` — noscript ফলব্যাক

