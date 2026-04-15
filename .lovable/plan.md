

# প্রোডাক্ট সার্চ র‍্যাংকিং — চূড়ান্ত অপটিমাইজেশন

## বর্তমান অবস্থা (ইতিমধ্যে করা হয়েছে)
আপনার ওয়েবসাইটে ইতিমধ্যে অনেক SEO কাজ করা হয়েছে:
- প্রতিটি প্রোডাক্টে বাংলা+ইংরেজি SEO টাইটেল ও ডেসক্রিপশন
- Schema.org Product markup (BDT দাম, রিভিউ, FAQ সহ)
- ইমেজ সাইটম্যাপ, hreflang, canonical URL
- Google Analytics ও Search Console ইন্টিগ্রেশন

## সমস্যা
**React SPA সীমাবদ্ধতা**: গুগলবট JavaScript রেন্ডার করতে বিলম্ব করে (কয়েক দিন থেকে সপ্তাহ)। এই কারণে নতুন প্রোডাক্ট দ্রুত ইনডেক্স হয় না।

## পরিকল্পনা

### 1. Dynamic Prerender Edge Function তৈরি
একটি নতুন edge function (`prerender`) তৈরি করা যা সার্চ ইঞ্জিন বটদের জন্য প্রতিটি প্রোডাক্ট পেজের সম্পূর্ণ HTML জেনারেট করবে:
- বটের User-Agent চেক করে (Googlebot, Bingbot, etc.)
- ডাটাবেস থেকে প্রোডাক্টের সব তথ্য নিয়ে পূর্ণাঙ্গ HTML পেজ তৈরি করবে
- টাইটেল, ডেসক্রিপশন, ইমেজ, দাম, রিভিউ, FAQ — সবকিছু সরাসরি HTML-এ থাকবে
- Schema.org JSON-LD সম্পূর্ণ পেজে embed থাকবে

### 2. প্রোডাক্ট পেজে `<link rel="alternate">` ডায়নামিক প্রিরেন্ডার URL
SEOHead-এ প্রতিটি প্রোডাক্ট পেজের জন্য একটি alternate link যোগ করা যা বটদের prerender URL-এ redirect করবে

### 3. সাইটম্যাপে `<xhtml:link>` Alternate URL
সাইটম্যাপের প্রতিটি প্রোডাক্ট URL-এ alternate prerender link যোগ করা

### 4. robots.txt আপডেট
প্রিরেন্ডার endpoint বটদের জন্য অ্যাক্সেসযোগ্য করা এবং সাইটম্যাপ URL যোগ করা

### 5. Index.html-এ প্রোডাক্ট লিস্ট noscript ব্লক উন্নত
noscript ব্লকে ডাটাবেস থেকে টপ প্রোডাক্টগুলোর লিংক যোগ করার জন্য একটি static HTML generation স্ক্রিপ্ট

## ফাইল পরিবর্তন
- `supabase/functions/prerender/index.ts` — নতুন edge function (বটদের জন্য HTML পেজ জেনারেট)
- `supabase/functions/sitemap/index.ts` — alternate prerender URL যোগ
- `public/robots.txt` — সাইটম্যাপ URL ও prerender access
- `src/components/seo/SEOHead.tsx` — geo.region ও product-specific meta enhancement

## প্রযুক্তিগত বিবরণ
Prerender edge function প্রতিটি `/product/:slug` URL-এর জন্য সম্পূর্ণ server-rendered HTML পাঠাবে। এতে গুগল সাথে সাথে কন্টেন্ট পড়তে পারবে, JavaScript রেন্ডারিং-এর জন্য অপেক্ষা করতে হবে না। এটি র‍্যাংকিং-এর জন্য সবচেয়ে কার্যকর পদক্ষেপ।

