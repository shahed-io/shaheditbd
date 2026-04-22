---
name: Admin Panel Design System
description: Premium Gradient Glow — site-aligned multi-color gradient glassmorphism with rich animations. Big Hero stat cards with auto-rainbow per-column variants (violet/cyan/pink/gold), floating gradient pill nav with shine-sweep on active, animated gradient page-header (pulse glow, gradient title, rotating shine on icon). Lively hover lifts everywhere. Auto-applied via body.admin-page.
type: design
---

**Admin design (NON-NEGOTIABLE):** **Premium Gradient Glow** — site-aligned multi-color gradient glassmorphism with rich, lively animations. Visually unified with the storefront — same violet→cyan→pink→gold gradient hero, gold accents, white glass cards, and multi-color ambient glows. Optimized to make admin work feel exciting.

## Color tokens (scoped via `body.admin-page` in `src/index.css`)
- `--ad-bg`: 230 50% 97% (cool airy off-white — matches storefront)
- `--ad-surface`: 0 0% 100%
- `--ad-surface-2`: 230 40% 97%
- `--ad-border`: 230 35% 90%
- `--ad-text`: 226 35% 12% (storefront foreground)
- `--ad-text-muted`: 226 15% 42%
- `--ad-accent`: 258 78% 55% (violet brand `--brand-h`)
- `--ad-accent-2`: 200 90% 45% (cyan `--brand2`)
- `--ad-accent-3`: 330 85% 55% (pink `--brand3`)
- `--ad-accent-gold`: 42 96% 58% (gold)
- `--ad-gradient-brand`: violet → purple → cyan (135deg)
- `--ad-gradient-warm`: pink → gold (135deg)
- Radius: 12 / 20 / 26 px. Shadows: violet+cyan layered.

## Animation keyframes (admin-only)
- `admin-gradient-shift` — 200%/220% bg position pan, 4–6s loop
- `admin-pulse-glow` — pulsing violet ring + drop-shadow on header icon
- `admin-shine-sweep` — diagonal white shine across active nav pill & header icon
- `admin-card-float` — gentle 2px Y oscillation
- `admin-icon-spin-in` — 0.45s entrance pop on active nav icon
- `admin-page-header-in` — 0.5s spring slide-down on every page header
- `admin-content-in` — 0.35s fade+rise on main content children (route change)

## Key surface rules
- **Canvas (`.admin-gradient-bg`):** 4-color ambient — violet (top-left), cyan (top-right), pink (bottom-right), gold (bottom-left).
- **Sidebar (`.admin-glass-sidebar`):** white glass `hsla(white, 0.78)` + 28px blur + violet→cyan vertical gradient right edge.
- **Header (`.admin-glass-header`):** white glass + horizontal violet→cyan→pink hairline gradient under it.
- **Cards (`.admin-glass-card`):** white glass + violet hover border + lift 2px (spring easing).
- **Stat cards (`.admin-stat-card`):** big gradient hero — always-visible 3px gradient top accent (animates on hover), big radial glow corner that scales up on hover, lift 4px + scale 1.005. Auto-rainbow inside `.grid` via `:nth-child(4n+1..4)` → violet, cyan, pink, gold variants without JSX changes. Manual override via `data-variant="violet|cyan|pink|gold"`.
- **Nav active (`.admin-nav-item.active`):** white floating pill + tri-color violet→purple→cyan→pink animated gradient icon box (shifts position infinitely + spring spin-in entrance) + shine sweep across the pill once on activation + 3px gradient left edge with glow. Hover slides item 2px right.
- **Page header (`.admin-page-header`):** violet→white→cyan gradient bg, dual radial glows, 56×56 tri-color animated gradient icon box with continuous pulse-glow ring + repeating shine sweep, animated gradient text title (220% bg pan, 6s loop). Header itself springs in on mount.
- **Buttons (primary):** tri-color violet→purple→cyan gradient pill with shifting background-position on hover. Inset white sheen.
- **Section title bar:** violet→cyan vertical gradient.
- **Tabs / inputs / dialogs:** unchanged white glass + violet focus.

## Auto-inheritance
Same `body.admin-page` overrides as before (Tailwind .bg-white/gray, dialogs, tabs, inputs, status badges) — all flow through the gradient tokens. Add `data-glass-skip` to opt out.

## Theme support
`html[data-theme="dark-cyber"]` and `html[data-theme="midnight-purple"]` flip surfaces to deep violet-tinted slate; gradients & ambient glows remain.
