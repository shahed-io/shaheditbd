

# ওয়েবসাইট লোডিং স্পিড অপটিমাইজেশন

## সমস্যা চিহ্নিত
হোমপেজ লোড হওয়ার সময় অনেকগুলো Supabase কল একসাথে হচ্ছে, যা পেজ রেন্ডার ব্লক করে:

1. **AuthProvider** — `getSession()` + `onAuthStateChange` + admin role check (3 calls)
2. **Navbar** — `useFooterSettings` (site_settings), categories, announcement, profile, admin role (5 calls)
3. **HeroBanner** — hero banner settings (1 call)
4. **TopProducts** — products query (1 call)
5. **WelcomeDiscount** — settings + generate-welcome-coupon edge function (2 calls)
6. **PopupBanner** — site_settings (1 call)
7. **FlashSale** — flash sale products (1 call)
8. **Realtime channels** — categories subscription

মোট **~14টি** DB/API কল প্রথম লোডেই হচ্ছে — এটাই ধীরগতির কারণ।

## সমাধান পরিকল্পনা

### 1. Auth Loading টাইমআউট কমানো
`useAuth.tsx`-এ ৮ সেকেন্ড fallback timeout আছে — এটি ৩ সেকেন্ডে নামানো হবে। Guest ইউজারদের জন্য loading দ্রুত false হবে।

### 2. Navbar DB কল ডিফার করা
- Footer settings ও announcement ফেচ ১ সেকেন্ড পরে শুরু হচ্ছে — ঠিক আছে
- Categories ১০০ms পরে হচ্ছে — এটা ৫০০ms এ নিয়ে যাওয়া হবে
- Profile/admin check ৫০০ms পরে — ঠিক আছে

### 3. TopProducts কে React Query তে মাইগ্রেট
বর্তমানে manual `useEffect` + `useState` ব্যবহার হচ্ছে — React Query-তে নিলে ক্যাশিং (১০ মিনিট staleTime) পাবে এবং repeated fetch বন্ধ হবে।

### 4. WelcomeDiscount ও PopupBanner ডিলে বাড়ানো
- WelcomeDiscount ইতিমধ্যে ১০-২০ সেকেন্ড delay আছে কিন্তু settings fetch তখনই হচ্ছে — fetch-ও delay করা হবে
- PopupBanner এর fetch ও ১ সেকেন্ড ডিলে দেওয়া হবে

### 5. FlashSale প্রোডাক্ট ক্যাশিং
FlashSale কম্পোনেন্ট `useEffect` ব্যবহার করছে — React Query তে নিয়ে যাওয়া হবে।

### 6. HeroBanner ইমেজ অপটিমাইজেশন
Static logo imports (idm.webp, ms365-logo.png, windows-logo.png) লোড হচ্ছে eagerly — `loading="lazy"` দেওয়া হবে।

### 7. CSS ফাইল সাইজ কমানো
`index.css` ১৬০০+ লাইন — অপ্রয়োজনীয় কমেন্ট ও unused কোড সরানো হবে।

## ফাইল পরিবর্তন
- `src/hooks/useAuth.tsx` — timeout ৮s → ৩s
- `src/components/store/Navbar.tsx` — category fetch delay বাড়ানো
- `src/components/store/TopProducts.tsx` — React Query migration
- `src/components/store/FlashSale.tsx` — React Query migration
- `src/components/store/WelcomeDiscount.tsx` — fetch delay
- `src/components/store/PopupBanner.tsx` — fetch delay
- `src/pages/Index.tsx` — component loading অপটিমাইজ

## প্রযুক্তিগত বিবরণ
মূল সমস্যা হলো প্রথম লোডে ১৪টি parallel Supabase কল ডাটাবেসকে overwhelm করছে। React Query ক্যাশিং + staggered delays ব্যবহার করে এই কলগুলো ছড়িয়ে দেওয়া হবে — above-fold কন্টেন্ট (Navbar, Hero, Products) প্রথমে লোড হবে, বাকিগুলো পরে।
