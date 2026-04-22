---
name: Admin Panel Design System
description: Purple Glassmorphism Dashboard — soft lavender canvas, white-glass cards, violet accents (258 78% 55%), floating active pills, big violet icon page-header card. Auto-applied via body.admin-page selectors.
type: design
---

**Admin design (NON-NEGOTIABLE):** **Purple Glassmorphism Dashboard** matching the user dashboard. Soft lavender canvas + white-glass surfaces + violet accents. Replaces the previous orange/black Notion-minimal system.

## Color tokens (scoped via `body.admin-page` in `src/index.css`)
- `--ad-bg`: 262 60% 98% (soft lavender wash)
- `--ad-surface`: 0 0% 100% (white cards)
- `--ad-surface-2`: 262 40% 96% (violet-tinted alt)
- `--ad-border`: 262 40% 88% (soft violet hairline)
- `--ad-border-strong`: 262 40% 80%
- `--ad-text`: 258 30% 16% (deep violet-black)
- `--ad-text-muted`: 258 12% 46%
- `--ad-accent`: 258 78% 55% (violet brand)
- `--ad-accent-soft`: 258 78% 96%
- `--ad-accent-deep`: 258 78% 42%
- `--ad-shadow-pill`: 0 4px 14px hsla(258,78%,55%,0.18) — for active nav pill
- Radius: 8 / 14 / 18 px. Shadows: violet-tinted layered.

## Key surface rules
- **Canvas (`.admin-gradient-bg`):** lavender wash + 2 radial violet ambient glows (top-left + bottom-right).
- **Sidebar (`.admin-glass-sidebar`):** `hsla(white, 0.72)` + `backdrop-filter: blur(28px) saturate(180%)` + soft violet hairline + ambient violet right-edge glow.
- **Header (`.admin-glass-header`):** matching white glass + violet hairline.
- **Cards (`.glass-card`, `.admin-glass-card`, `.admin-stat-card`):** `hsla(white, 0.85)` + 24px blur + soft violet border `hsla(258,78%,75%,0.22)` + violet-tinted shadow. Stat-card lifts 2px on hover.
- **Nav item (default):** transparent + violet-tinted icon box (28×28 rounded). Hover = soft violet bg.
- **Nav item (active):** white floating pill + violet text + violet-filled gradient icon box (white icon) + soft violet shadow. NO left bar.
- **Page header card (`.admin-page-header`):** big 56×56 violet gradient icon box + violet gradient title + gray subtitle. Auto-injected by AdminLayout for every admin page.
- **Buttons (primary):** violet gradient pill (135deg, accent → accent-deep) with violet shadow. Hover lifts 1px + brightens.
- **Tabs:** violet-tinted track + white floating pill on active with violet shadow.
- **Inputs:** white + 1px violet-strong border + 8px radius + focus = violet border + 3px violet/15 ring.
- **Tables:** violet-tinted header row, violet uppercase labels, hairline rows, violet hover.
- **Dialogs/Popovers:** white-glass `hsla(white, 0.92)` + 28px blur + violet border + 18px radius + premium shadow.
- **Status badges:** soft pastel fills (green/red/amber/blue/violet) with matching 1px borders. Orange and purple both map to violet.

## Auto-inheritance
All `body.admin-page` selectors override raw Tailwind:
- `.bg-white`, `.bg-gray/slate-50/100`, `.glass-card` → white glass with 24px blur + violet border
- `[role="dialog"]`, popover, menu, listbox → white glass + violet border + 28px blur
- `[role="tablist"]` + active tab → violet-tinted track with white floating pill
- Primary buttons (`.bg-primary`, `.bg-blue/indigo/violet/purple-600`) → violet gradient pill
- `<table>` → violet-tinted header + hairlines + uppercase labels
- Inputs/selects/textareas → white flat with violet focus ring
- Status backgrounds (green/red/amber/blue/orange/purple/violet-100) → flat soft pills (orange & purple → violet)
- `.border-gray/slate-200/300`, `.border-border` → soft violet hairline

## Page header injection
`AdminLayout.tsx` auto-injects `<div className="admin-page-header">` above `<Outlet />` on every admin page — big violet icon (from menu item) + violet gradient title + section/subtitle. No per-page edits needed.

## Skip auto-polish
Add `data-glass-skip` attribute to opt-out a specific surface.

## Theme support
`html[data-theme="dark-cyber"]` and `html[data-theme="midnight-purple"]` flip tokens to deep violet-tinted slate surfaces while keeping violet accents and ambient glows. Other themes (rose-gold, ocean-blue, forest-green) — admin always stays violet.
