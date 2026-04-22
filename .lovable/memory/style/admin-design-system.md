---
name: Admin Panel Design System
description: Notion/Stripe-inspired Clean Light Minimal — pure white surfaces, hairline gray borders, glass sidebar with backdrop, orange (#FF6B1A) + black accent. Auto-applied via body.admin-page selectors.
type: design
---

**Admin design (NON-NEGOTIABLE):** Notion/Stripe **Clean Light Minimal** — NOT gradient glassmorphism. Storefront uses gradient glass; admin is intentionally different for clarity & focus.

## Color tokens (scoped via `body.admin-page` in `src/index.css`)
- `--ad-bg`: 0 0% 99% (canvas)
- `--ad-surface`: 0 0% 100% (cards, pure white)
- `--ad-surface-2`: 220 14% 98% (table head, alt rows)
- `--ad-border`: 220 13% 91% (hairline)
- `--ad-border-strong`: 220 13% 84%
- `--ad-text`: 222 22% 11% (near-black)
- `--ad-text-muted`: 220 9% 46%
- `--ad-accent`: 20 100% 54% (orange)
- `--ad-accent-soft`: 20 100% 96%
- `--ad-black`: 222 22% 11% (primary button bg)
- Radius: 6 / 10 / 14 px. Shadows: subtle layered (`--ad-shadow-sm/md/lg/xl`).

## Key surface rules
- **Sidebar (`.admin-glass-sidebar`):** `hsla(white, 0.72)` + `backdrop-filter: blur(28px) saturate(180%)` + 1px hairline border. NO heavy shadow, NO gradient.
- **Header (`.admin-glass-header`):** matching glass surface with backdrop blur.
- **Cards (`.glass-card`, `.admin-glass-card`, `.admin-stat-card`):** flat white + 1px `--ad-border` + `--ad-shadow-sm`. Hover → `--ad-shadow-md` + stronger border. NO blur, NO gradient borders, NO translateY (only stat-card lifts 1px).
- **Nav item active:** orange-soft bg + orange text + 3px left orange bar. Hover = `--ad-surface-2` only.
- **Buttons (primary):** solid `--ad-black` bg, white text. Hover → orange `--ad-accent` bg with 3px orange focus ring. NO gradient sweep.
- **Tabs:** Notion segmented control — `--ad-surface-2` track, white pill on active with `--ad-shadow-sm`.
- **Inputs:** white bg, 1px `--ad-border-strong`, 6px radius, focus = orange border + 3px `--ad-accent/15` ring.
- **Tables:** `--ad-surface-2` header with uppercase 11px muted labels, hairline rows, hover = `--ad-surface-2`.
- **Dialogs/Popovers:** white surface + 1px border + 14px radius + `--ad-shadow-xl`. NO blur.
- **Status badges:** flat soft fills (green/red/yellow/blue/orange) with matched 1px border.

## Auto-inheritance
All `body.admin-page` selectors override raw Tailwind:
- `.bg-white`, `.bg-gray-50/100`, `.bg-slate-50/100`, `.glass-card` → flat white surface
- `[role="dialog"]`, popover, menu, listbox → flat elevated card (no blur)
- `[role="tablist"]` + active tab → segmented control with white pill
- Primary buttons (`.bg-primary`, `.bg-blue-600`, `.bg-indigo-600`, `.bg-violet-600`, `.bg-purple-600`) → solid black with orange hover
- `<table>` → Notion-style with hairlines + uppercase headers
- Inputs/selects/textareas → white flat with orange focus ring
- Status backgrounds (`.bg-green-100` / `.bg-red-100` / `.bg-yellow-100` / `.bg-blue-100` / `.bg-orange-100`) → flat soft pills
- `.border-gray-200/300`, `.border-slate-200/300`, `.border-border` → hairline `--ad-border`

## Skip auto-polish
Add `data-glass-skip` attribute to opt-out a specific surface.

## Theme support
`html[data-theme="dark-cyber"]` and `html[data-theme="midnight-purple"]` auto-flip tokens to deep slate surfaces, light text, dark shadows. Sidebar still uses backdrop blur.
