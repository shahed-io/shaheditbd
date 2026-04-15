

# প্রোডাক্ট ইমেজ গুগল র‍্যাংকিং অপটিমাইজেশন

## সমস্যা
বর্তমানে প্রোডাক্টের ছবিগুলো গুগল ইমেজ সার্চে ভালোভাবে র‍্যাংক করছে না কারণ:
- সাইটম্যাপে `<image:image>` ট্যাগ নেই
- ইমেজের `alt` টেক্সট শুধু প্রোডাক্টের নাম (SEO-optimized না)
- Schema.org-তে `image` অ্যারেতে শুধু একটি ছবি থাকে, সব গ্যালারি ছবি নেই
- ইমেজে `title`, `width`, `height` অ্যাট্রিবিউট নেই

## পরিকল্পনা

### 1. সাইটম্যাপে ইমেজ ট্যাগ যোগ (sitemap edge function)
- প্রোডাক্ট কুয়েরিতে `image_url, images, seo_title` ফিল্ড যোগ
- প্রতিটি প্রোডাক্ট URL-এ `<image:image>` ব্লক: `<image:loc>`, `<image:title>`, `<image:caption>` সহ
- মাল্টিপল ইমেজ (গ্যালারি) থাকলে সবগুলো আলাদা `<image:image>` ব্লকে

### 2. প্রোডাক্ট ডিটেইল পেজে SEO-রিচ alt ও title (ProductDetail.tsx)
- মেইন ও থাম্বনেইল ইমেজে SEO-optimized alt: `"Buy {product.name} at best price in Bangladesh - Shahed Store"`
- `title` অ্যাট্রিবিউট যোগ
- গ্যালারি ছবিতে ক্রমিক alt: `"{product.name} - Image 1/2/3"`

### 3. প্রোডাক্ট কার্ডে SEO alt উন্নত (ProductCard.tsx)
- alt টেক্সট: `"{product.name} - Buy at ৳{price} in Bangladesh"`
- `title` অ্যাট্রিবিউট যোগ

### 4. Schema.org-তে সব ইমেজ যোগ (schemas.ts)
- `productSchema`-তে `image` ফিল্ডে গ্যালারি সব ছবি অ্যারে হিসেবে পাস
- ProductDetail থেকে সব ইমেজ URL পাঠানো

### 5. SEOHead-এ Open Graph multi-image সাপোর্ট
- গ্যালারি ইমেজগুলো `og:image` হিসেবে যোগ (ফেসবুক/গুগল ডিসকভারের জন্য)

## ফাইল পরিবর্তন
- `supabase/functions/sitemap/index.ts` — ইমেজ ট্যাগ যোগ
- `src/pages/ProductDetail.tsx` — SEO alt/title
- `src/components/store/ProductCard.tsx` — SEO alt/title
- `src/components/seo/schemas.ts` — multi-image schema
- `src/components/seo/SEOHead.tsx` — og:image অ্যারে সাপোর্ট

