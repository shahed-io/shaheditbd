---
name: Admin Design System — Apple Glassmorphism
description: অ্যাডমিন প্যানেলের ডিজাইন স্ট্যান্ডার্ড — Apple-style Glassmorphism (frosted blur, layered depth, ambient color blobs, orange+pink accent)। macOS Sonoma System Settings + iCloud Admin দ্বারা অনুপ্রাণিত।
type: design
---

**Admin design (NON-NEGOTIABLE):** Apple-style **Glassmorphism** — frosted blur, layered depth, ambient color blobs। macOS Sonoma System Settings ও iCloud Admin দ্বারা অনুপ্রাণিত।

## Core Tokens (`src/index.css` — `body.admin-page` scope)

- `--ad-bg`: 220 30% 97% (faint blue-tinted canvas)
- `--ad-surface`: 0 0% 100% (white base, used with alpha for translucency)
- `--ad-accent`: 20 100% 54% (orange) + `--ad-accent-2`: 330 95% 58% (pink) + `--ad-accent-3`: 210 100% 60% (sky)
- `--ad-blur`: blur(28px) saturate(180%); `--ad-blur-strong`: blur(40px) saturate(190%)
- Radius: 10 / 16 / 22 px (sm/md/lg)
- Shadows: multi-layer with inset white highlight + soft drop

## Ambient Background

`.admin-gradient-bg` এ দুটি floating radial blob (orange + sky) যা slowly animate করে — Apple's signature ambient color habit। `prefers-reduced-motion` respected।

## Glass Components

| Component | Effect |
|-----------|--------|
| Sidebar | blur(40px), gradient tint, inner highlight stripe, orange glow at top |
| Header | blur(28px), semi-transparent, hairline border |
| Cards (`.glass-card`, `.admin-glass-card`) | gradient + blur + inset highlight + reflection line at top |
| Stat Cards | radial accent blob in corner that intensifies on hover |
| Nav Items | hover = frosted pill + translateX. Active = orange→pink gradient + glowing accent bar |
| Inputs | translucent + blur + 4px orange focus ring |
| Modals | blur(40px) glass with strong shadow + inset highlight |
| Tabs | frosted segmented control, active = white gradient + orange text |
| Buttons (primary) | black gradient → orange→pink gradient on hover |
| Tables | translucent thead, hover = soft orange tint |
| Badges | frosted colored pills with blur(8px) |

## Auto-Polish Strategy

`body.admin-page .bg-white`, `.bg-gray-50` ইত্যাদি automatically frosted gradient surface-এ convert হয়। কোনো admin page edit ছাড়াই এই design system প্রয়োগ হয়।

## Dark Mode

`html[data-theme="dark-cyber"]` ও `midnight-purple` থিমে darker translucent layers + reduced ambient blob opacity।

## Motion

সব transitions Apple's preferred easing — `cubic-bezier(0.2, 0, 0.2, 1)` — 180-250ms duration। Hover সবসময় subtle `translateY(-1px to -3px)`।

## Memory Hints

- কখনো admin panel এ flat/Notion-style suggest করা যাবে না — এটি permanently glassmorphism
- Admin hover effects-এ `translateY` + glow shadow expected
- Orange + Pink primary accent pair
