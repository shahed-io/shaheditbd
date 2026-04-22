

# Admin Panel Redesign — Purple Glassmorphism Dashboard Style

আপলোড করা ছবির ডিজাইন (User Dashboard-এর মতো premium violet glassmorphism) সম্পূর্ণ অ্যাডমিন প্যানেলে apply করা হবে। বর্তমান minimal orange-black design সরিয়ে user-dashboard-এর সাথে একই visual language আনা হবে।

## নতুন Design Language

**Reference থেকে নেয়া elements:**
- **Soft violet wash background** — সাদা ক্যানভাসের উপর হালকা lavender gradient
- **White glassmorphism cards** — `rgba(255,255,255,0.80)` + `blur(24-32px)` + soft violet border
- **Sidebar sections** — uppercase violet labels (ACCOUNT, SALES, CATALOG ইত্যাদি)
- **Active nav item** — সাদা floating pill, soft violet shadow, violet icon
- **Icon badges** — গোল violet-tinted box প্রতিটি menu item-এর পাশে
- **Section header card** — বড় rounded violet icon + Title (purple) + subtitle (gray)
- **Primary buttons** — violet gradient pill (`hsl(258,78%,55%)` → `hsl(258,78%,42%)`) সাদা টেক্সট সহ
- **Inputs** — সাদা glass field, leading icon, violet focus ring

## Color Token পরিবর্তন (`src/index.css`)

`body.admin-page` scope-এ নতুন violet token set:

```text
--ad-bg            → soft lavender wash (262 60% 98%)
--ad-surface       → white glass (rgba 255,255,255,0.82)
--ad-surface-2     → violet-tinted (262 40% 96%)
--ad-border        → soft violet (262 40% 88%)
--ad-accent        → violet (258 78% 55%)        [main brand]
--ad-accent-soft   → violet wash (258 78% 96%)
--ad-primary-grad  → linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))
--ad-shadow-md     → 0 8px 32px hsla(258,78%,55%,0.10)
```

## Component-level Changes

| Component | পরিবর্তন |
|---|---|
| **Sidebar** (`admin-glass-sidebar`) | White glass `rgba(255,255,255,0.82)` + 28px blur + violet hairline border + soft violet ambient glow on right edge |
| **Section labels** | Uppercase 11px, violet color (`hsl(258,78%,55%)`), letter-spacing 1.2px |
| **Nav item (default)** | Transparent, gray text + violet-tinted icon box (32×32 rounded) |
| **Nav item (active)** | White pill + soft violet shadow + violet text + violet-filled icon box (no left bar) |
| **Header** (`admin-glass-header`) | White glass + violet hairline + breadcrumb in violet |
| **Cards** (`admin-glass-card`) | White glass `rgba(255,255,255,0.85)` + 24px blur + soft violet border (`hsla(258,78%,75%,0.22)`) + violet-tinted shadow |
| **Page header card** | Big violet rounded icon (left) + page title in violet + subtitle gray + Action button (right) |
| **Primary buttons** | Violet gradient pill, white text, soft violet shadow on hover |
| **Inputs/Selects/Textareas** | White glass + leading icon (violet) + violet focus ring (3px `hsla(258,78%,55%,0.15)`) |
| **Tabs** | Violet-tinted track, white floating pill on active with violet shadow |
| **Tables** | Violet-tinted header row, violet uppercase labels, hairline rows, soft violet hover |
| **Status badges** | Soft pastel fills (violet/green/amber/rose) with 1px matching border |
| **Dialogs/Popovers** | White glass + violet border + 14px radius + premium shadow |
| **Command palette** (`AdminCommandPalette`) | Violet-tinted overlay, violet accents, kbd shortcuts violet-tinted |
| **Sidebar search trigger** | Violet hover state replacing current orange |

## Auto-polish overrides (already in place)

`body.admin-page`-এর global selectors orange → violet swap:
- `.bg-primary`, `.bg-blue-600`, `.bg-indigo-600`, `.bg-violet-600`, `.bg-purple-600` → violet gradient
- Focus rings: orange → violet
- Status badges: same flat soft pills
- Tables, inputs, dialogs — all auto-inherit new violet tokens

কোন individual page (100+ admin pages) edit করতে হবে না — সব auto-update হবে।

## Page Header Pattern (নতুন)

প্রতিটি admin page-এর top-এ ছবির মতো header card:

```text
┌──────────────────────────────────────────────────┐
│  ╔═══╗   Page Title (violet, bold)    [Action]  │
│  ║ ◉ ║   Page subtitle (gray, sm)               │
│  ╚═══╝                                           │
└──────────────────────────────────────────────────┘
```

`AdminLayout.tsx`-এ এই header automatically inject হবে — page name থেকে title, section name থেকে subtitle।

## Theme support

- `data-theme="dark-cyber"` & `midnight-purple` → deep slate surfaces, violet accents intact
- বাকি themes (rose-gold, ocean-blue, forest-green) → default violet admin maintain (admin সবসময় violet)

## Files to Edit

| File | Change |
|---|---|
| `src/index.css` | Replace `--ad-*` tokens with violet palette + update all `.admin-glass-*` classes + auto-polish selectors |
| `src/components/admin/AdminLayout.tsx` | Sidebar nav item structure (icon box + active pill), inject page header card above `<Outlet />`, swap orange hover → violet |
| `src/components/admin/AdminCommandPalette.tsx` | Violet accents replacing orange |
| `.lovable/memory/style/admin-design-system.md` | Rewrite to document new Purple Glassmorphism system as the standard |
| `.lovable/memory/index.md` | Update Core rule about admin design |

## Result Preview

```text
┌─ ACCOUNT ────────┐  ┌─────────────────────────────────────────┐
│                  │  │ ╔══╗ Orders                    [+ New] │
│ ┌──┐             │  │ ║◉ ║ Manage all customer orders        │
│ │◉ │ Dashboard   │  │ ╚══╝                                    │
│ └──┘             │  └─────────────────────────────────────────┘
│ ╔══╗             │  ┌─────────────────────────────────────────┐
│ ║◉ ║ Orders ←────│  │ [Filters] [Search]              [Export]│
│ ╚══╝   active    │  ├─────────────────────────────────────────┤
│ ┌──┐             │  │ ORDER #  CUSTOMER   STATUS    TOTAL    │
│ │◉ │ Products    │  │ #1024    Md Shahed  ●Pending  ৳1,200   │
│ └──┘             │  │ #1023    Ali Ahmed  ●Done     ৳800     │
│ SALES            │  │ ...                                     │
│ ┌──┐             │  └─────────────────────────────────────────┘
│ │◉ │ Payments    │
│ └──┘             │
└──────────────────┘
   white glass        violet-accented glass cards on lavender wash
```

Approve করলে আমি default mode-এ গিয়ে সম্পূর্ণ implement করব।

