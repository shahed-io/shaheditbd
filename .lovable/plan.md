

## বর্তমান সমস্যা

স্ক্রিনশটে মোবাইল হ্যামবার্গার মেনুটি দেখা যাচ্ছে — অনেক রং (নীল, কমলা, সবুজ, লাল), অনেক gradient cards, একটি বড় Sign-In ব্যানার, ৪টি icon বাটন (Shop/Tools/Blog/Contact), Hot Deals + Need Help cards, Trending Categories chips, এবং Explore list — সব মিলিয়ে **visually অনেক noisy এবং overwhelming**। এটি premium feel দিচ্ছে না।

## নতুন ডিজাইন কনসেপ্ট — "Glassmorphic Minimal"

Apple Vision Pro / iOS 18 Control Center অনুপ্রাণিত একটি **সম্পূর্ণ নতুন, পরিচ্ছন্ন, monochrome-first** ডিজাইন:

### ভিজ্যুয়াল ভাষা
- **Single accent color** — শুধু violet (`hsl(258,78%,55%)`), যা ব্রান্ডের সাথে সংগতিপূর্ণ
- **Pure white glassmorphism** — সব card একই subtle white glass (`rgba(255,255,255,0.7)`, `blur(28px)`)
- **Monochrome icons** — রঙিন gradient circles বাদ; সব icon dark navy (`hsl(226,35%,20%)`), শুধু hover/active তে violet
- **Generous whitespace** — কম elements, বেশি breathing room
- **Subtle depth** — soft shadows, no heavy boxes

### নতুন লেআউট স্ট্রাকচার

```text
┌─────────────────────────────────┐
│  [Search bar — pill, full-w]    │  ← প্রথমে search (most-used)
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │  ◐  Welcome back          │  │  ← Compact user/auth card
│  │     name@email.com    ›   │  │     (logged-in: profile)
│  └───────────────────────────┘  │     (guest: Sign In)
│                                 │
│  Quick Actions                  │  ← Small label
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ 🛍 │ │ ✨ │ │ 📝 │ │ 💬 │  │  ← 4 monochrome tiles
│  │Shop│ │Tool│ │Blog│ │Help│  │     (subtle hover violet)
│  └────┘ └────┘ └────┘ └────┘  │
│                                 │
│  Categories          See all ›  │  ← Inline link
│  · Windows    8                 │  ← List style (NOT chips)
│  · Office    12                 │     icon + name + count
│  · Software  20                 │
│  · Antivirus  5                 │
│                                 │
│  Account                        │
│  📦 My Orders              ›    │  ← Single-line list
│  🔑 My Licenses            ›    │     no big colored icons
│  💳 Wallet            ৳500 ›    │     value preview right
│  ❤  Wishlist           (3) ›    │
│                                 │
│  🌙 Dark mode          [○──]    │  ← Toggle
│  📱 Install app             ›   │
│                                 │
│  ─────────────────────────────  │
│  🛡 Secure  ·  ⭐ Trusted Store │  ← Trust footer
└─────────────────────────────────┘
```

### মূল পরিবর্তনসমূহ

1. **Search bar শীর্ষে** — সবচেয়ে used feature; এক ট্যাপে accessible
2. **Hot Deals / Need Help cards সরানো** — homepage এ ইতিমধ্যে আছে; menu cleaner হবে
3. **৪টি rainbow gradient circle → মনোক্রোম tile grid** — পেশাদার look
4. **Trending categories chips → clean list** with count badges (more scannable)
5. **Sign-In big purple banner → compact glass card** (subtle, premium)
6. **Logged-in user**: profile preview সহ (avatar + email) — top এ
7. **Wallet balance preview** account list-এ ইনলাইন
8. **Dark mode toggle যোগ** — মেনুর ভিতরেই
9. **Install App row** discreetly নিচে
10. **Trust footer** সরল ও মার্জিত

## বাস্তবায়ন পরিকল্পনা

### পরিবর্তিত ফাইল
- `src/components/store/Navbar.tsx` — পুরো mobile menu section (lines ~461-977) সম্পূর্ণ rewrite

### প্রযুক্তিগত বিস্তারিত
- বর্তমান logic (auth state, navCategories, canInstall, showIOSTip, mobileOpen) সব অপরিবর্তিত
- শুধু JSX এবং styling rewrite
- Animation: subtle `slideInRight` সব item-এ stagger করে (অপরিবর্তিত)
- Glass effect: `rgba(255,255,255,0.7)` + `backdrop-filter: blur(28px)` + soft border
- Icons: `lucide-react` থেকে monochrome (size 18-20)
- Responsive: শুধু `lg:hidden` (desktop unchanged)
- `useTheme` hook থেকে dark mode toggle integrate

### ফলাফল
- দেখতে অনেক বেশি premium, calm এবং professional
- কম visual noise, বেশি usability
- Apple-grade glassmorphism aesthetic
- সব বর্তমান feature বহাল

