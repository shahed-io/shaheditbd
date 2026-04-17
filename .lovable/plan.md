

## সমস্যা চিহ্নিত

স্ক্রিনশটে দেখা যাচ্ছে — ১৯২০px+ ওয়াইডস্ক্রিন মনিটরে ওয়েবসাইটের কন্টেন্ট মাঝখানে ~১২৮০px প্রস্থে আটকে আছে এবং দুই পাশে বিশাল খালি সাদা জায়গা রয়েছে। এর কারণ:

1. **প্রতিটি সেকশনে `max-w-7xl` (1280px)** হার্ডকোড করা — Navbar, HeroBanner, TopProducts, FlashSale, WhyChooseUs, Testimonials, Footer, Shop, ProductDetail, FreeTools সব জায়গায়।
2. **Tailwind container cap `2xl: 1400px`** — এটিও বড় স্ক্রিনে যথেষ্ট নয়।
3. ১১+ ফাইলে ৩৪+ জায়গায় এই ক্লাস ছড়িয়ে আছে।

## সমাধান কৌশল — Fluid Responsive Container System

হার্ডকোডেড `max-w-7xl` এর পরিবর্তে একটি **স্কেলেবল রেসপন্সিভ ব্রেকপয়েন্ট সিস্টেম** তৈরি করব যেটা প্রতিটি স্ক্রিন সাইজ অনুযায়ী adapt করবে:

| ডিভাইস | স্ক্রিন সাইজ | কন্টেন্ট প্রস্থ |
|---|---|---|
| Mobile | < 640px | 100% (16px padding) |
| Tablet | 640-1024px | 100% (24px padding) |
| Laptop | 1024-1280px | max 1200px |
| Desktop | 1280-1536px | max 1400px |
| Large Desktop | 1536-1920px | max 1600px |
| Ultra-wide | 1920px+ | max 1800px |

## বাস্তবায়ন ধাপ

### ১. গ্লোবাল রেসপন্সিভ ক্লাস তৈরি (`src/index.css`)
নতুন utility class `.container-fluid` যোগ করব যেটা ব্রেকপয়েন্ট অনুযায়ী dynamic max-width নেবে:
```css
.container-fluid {
  width: 100%;
  margin-inline: auto;
  padding-inline: 1rem;
}
@media (min-width: 640px)  { padding-inline: 1.5rem; }
@media (min-width: 1024px) { max-width: 1200px; }
@media (min-width: 1280px) { max-width: 1400px; }
@media (min-width: 1536px) { max-width: 1600px; padding-inline: 2rem; }
@media (min-width: 1920px) { max-width: 1800px; }
```

### ২. Tailwind config আপডেট (`tailwind.config.ts`)
- নতুন breakpoints যোগ: `3xl: 1600px`, `4xl: 1920px`
- container max-width বাড়িয়ে `2xl: 1400px, 3xl: 1600px, 4xl: 1800px`

### ৩. সব হোমপেজ কম্পোনেন্টে replace
নিচের ফাইলগুলোতে `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` → `container-fluid`:
- `src/components/store/Navbar.tsx` (max-w-7xl → max-w container)
- `src/components/store/HeroBanner.tsx`
- `src/components/store/TopProducts.tsx`
- `src/components/store/FlashSale.tsx`
- `src/components/store/WhyChooseUs.tsx`
- `src/components/store/Testimonials.tsx`
- `src/components/store/Footer.tsx`
- `src/components/store/Categories.tsx`
- `src/pages/Index.tsx` (skeleton)
- `src/pages/Shop.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/FreeTools.tsx`

### ৪. প্রোডাক্ট গ্রিড অপ্টিমাইজেশন
বড় স্ক্রিনে আরও কলাম দেখানোর জন্য grid update:
- বর্তমান: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- নতুন: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6`

এতে ১৯২০px+ স্ক্রিনে ৬টি প্রোডাক্ট কার্ড একসাথে দেখা যাবে — খালি জায়গা utilize হবে।

### ৫. ভেরিফিকেশন
- Mobile (375px), Tablet (768px), Laptop (1280px), Desktop (1536px), Ultra-wide (1920px) — সব সাইজে চেক
- কোনো horizontal scroll না থাকা নিশ্চিত (responsive-layout মেমোরি অনুযায়ী)

## পরিবর্তিত ফাইলসমূহ
- `src/index.css` — `.container-fluid` utility
- `tailwind.config.ts` — নতুন breakpoints
- ১২টি কম্পোনেন্ট/পেজ ফাইল — class replace + grid expansion

## ফলাফল
- ১৯২০px মনিটরে কন্টেন্ট ১৬০০-১৮০০px প্রস্থে spread হবে
- ৪K/ultra-wide স্ক্রিনেও proper utilize হবে
- ছোট স্ক্রিনে আগের মতোই কাজ করবে
- প্রোডাক্ট গ্রিডে বড় স্ক্রিনে ৫-৬ কলাম দেখাবে

