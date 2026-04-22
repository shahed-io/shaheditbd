---
name: Admin Panel Design System
description: Site-Aligned Gradient Glassmorphism — cool airy bg + multi-color ambient gradient (violet/cyan/pink/gold), white-glass cards, violet→cyan→pink gradient page-header, gradient stat-card top accent, gradient pill buttons. Matches storefront's hero & glass aesthetic. Auto-applied via body.admin-page.
type: design
---

**Admin design (NON-NEGOTIABLE):** **Site-Aligned Gradient Glassmorphism**. Visually unified with the storefront — same violet→cyan→pink gradient hero, gold accents, white glass cards, and multi-color ambient glows. Replaces the previous lavender-only purple system.

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

## Key surface rules
- **Canvas (`.admin-gradient-bg`):** 4-color ambient — violet (top-left), cyan (top-right), pink (bottom-right), gold (bottom-left).
- **Sidebar (`.admin-glass-sidebar`):** white glass `hsla(white, 0.78)` + 28px blur + violet→cyan vertical gradient right edge.
- **Header (`.admin-glass-header`):** white glass + horizontal violet→cyan→pink hairline gradient under it.
- **Cards (`.admin-glass-card`):** white glass + violet hover border + lift 1px.
- **Stat cards (`.admin-stat-card`):** 3px gradient top bar (violet→cyan→pink) appears on hover, soft violet radial glow corner, lift 3px.
- **Nav active:** white floating pill + tri-color violet→purple→cyan gradient icon box.
- **Page header (`.admin-page-header`):** violet→white→cyan gradient bg, dual radial glows, 56×56 tri-color gradient icon box, violet→cyan gradient text title.
- **Buttons (primary):** tri-color violet→purple→cyan gradient pill with shifting background-position on hover (200% size). Inset white sheen.
- **Section title bar:** violet→cyan vertical gradient.
- **Tabs / inputs / dialogs:** unchanged white glass + violet focus.

## Auto-inheritance
Same `body.admin-page` overrides as before (Tailwind .bg-white/gray, dialogs, tabs, inputs, status badges) — all flow through the new gradient tokens. Add `data-glass-skip` to opt out.

## Theme support
`html[data-theme="dark-cyber"]` and `html[data-theme="midnight-purple"]` flip surfaces to deep violet-tinted slate; gradients & ambient glows remain.
