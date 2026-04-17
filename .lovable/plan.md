

## অনুরোধ পর্যালোচনা

আপনি Next.js ব্যবহার করে ওয়েবসাইটকে ইনস্ট্যান্ট-লোডিং করতে চাইছেন। কিন্তু এখানে একটি **গুরুত্বপূর্ণ টেকনিক্যাল সীমাবদ্ধতা** আছে যা আগে পরিষ্কার করা দরকার।

## কেন Next.js এ migrate করা সম্ভব নয়

Lovable প্ল্যাটফর্ম **শুধুমাত্র React 18 + Vite 5 + TypeScript** সাপোর্ট করে। Next.js, Angular, Vue, Svelte — এগুলো Lovable-এ সাপোর্টেড নয়। এটি প্ল্যাটফর্মের একটি hard constraint, কোনো workaround নেই।

এছাড়া, আপনার বর্তমান প্রজেক্টে ১৫০+ ফাইল, ৪০+ Supabase Edge Functions, কাস্টম Auth, Realtime, এবং বহু React Router ভিত্তিক পেজ আছে। এগুলো Next.js-এ migrate করা মানে কার্যত পুরো প্রজেক্ট নতুন করে লেখা — যা Lovable-এ সম্ভব নয়।

## আসল সমাধান — Vite + React কেই ইনস্ট্যান্ট বানানো

ভালো খবর: Next.js ছাড়াও আমরা ক্লিক-টু-লোড প্রায় **0ms** করতে পারি। এর জন্য ৪টি প্রমাণিত কৌশল আছে যা Next.js-এর গতি দেয়:

### ১. Route Prefetching (Next.js-এর `<Link prefetch>` এর সমতুল্য)
- হোভার বা viewport-এ আসা মাত্রই route এর JS chunk প্রি-লোড হবে
- বর্তমানে `React.lazy` দিয়ে সব route lazy-loaded — ক্লিকের পর তবেই chunk download শুরু হয়
- নতুন `usePrefetchRoute` hook তৈরি করব যা hover/touchstart-এ chunk fetch করবে
- ফলে user যখন ক্লিক করবে, chunk আগে থেকেই cached থাকবে → instant navigation

### ২. View Transitions API (Smooth, Native-feel Navigation)
- ক্রোম-ভিত্তিক ব্রাউজারে built-in `document.startViewTransition()` ব্যবহার করব
- পেজ পরিবর্তন হবে fade/slide animation সহ — flicker ছাড়া
- React Router v6.4+ এর `unstable_viewTransition` flag enable করব

### ৩. Aggressive Data Prefetching (React Query)
- প্রোডাক্ট কার্ডে hover/touch করলেই সেই প্রোডাক্টের data prefetch হবে
- Top categories, trending products page mount হওয়ার সাথে সাথেই background-এ load হবে
- `queryClient.prefetchQuery()` ব্যবহার করব strategic জায়গায়

### ৪. Critical Path Optimization
- **Preload critical chunks** — index.html-এ `<link rel="modulepreload">` যোগ করব main routes এর জন্য
- **Service Worker caching** — visited pages instant load (already PWA enabled)
- **Image preload** — hero banner, top products এর images priority hint দিয়ে preload
- **Font preload** — Sora font-face FOUT eliminate করব

## বাস্তবায়ন পরিকল্পনা

### পরিবর্তিত ফাইলসমূহ:
- `src/hooks/usePrefetchRoute.tsx` — নতুন hook (hover/intersection prefetch)
- `src/components/NavLink.tsx` — prefetch integration
- `src/components/store/Navbar.tsx` — সব menu item-এ hover prefetch
- `src/components/store/ProductCard.tsx` — hover-এ product data + detail page chunk prefetch
- `src/components/store/Categories.tsx` — category click এর আগে prefetch
- `src/App.tsx` — React Router-এ `unstable_viewTransition` enable
- `index.html` — modulepreload hints, font preconnect
- `src/index.css` — view transition animations
- `vite.config.ts` — manual chunk splitting আরো optimize

### ফলাফল:
- প্রথম ক্লিক: ~50-100ms (vs বর্তমান 500-1500ms)
- পরবর্তী navigation: ~0-30ms (instant feel)
- Smooth fade transition — কোনো white flash নেই
- Image, font, data সব pre-cached

## গুরুত্বপূর্ণ নোট
- এটি Next.js নয়, কিন্তু **performance experience প্রায় একই বা ভালো** হবে
- প্রজেক্ট structure, Supabase, Edge Functions — কিছুই ভাঙবে না
- সব existing feature কাজ করবে

