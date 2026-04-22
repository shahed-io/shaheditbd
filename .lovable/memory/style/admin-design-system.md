---
name: Admin Design System
description: Admin panel uses Gradient Border Glassmorphism — admin-glass-card / admin-stat-card / admin-info-card with double-background gradient stroke. Body.admin-page selectors auto-promote .glass-card, raw bg-white/bg-gray-*, dialogs, tabs, primary buttons, status pills, borders to glassy gradient look across all 100+ pages without per-page edits.
type: design
---
Admin panel ওয়েবসাইটের premium **Gradient Border Glassmorphism** style follow করে — প্রতিটা card-এ true gradient stroke (violet→cyan→pink), hover-এ আরও vivid।

## Core utility classes (in src/index.css)

### Surfaces (gradient border + glass)
- `.admin-glass-card` — primary glass card with gradient border, hover lifts
- `.admin-stat-card` — dashboard tile, gradient border + sweep overlay
- `.admin-glass-sidebar` / `.admin-glass-header` — 36/28px blur
- `.admin-icon-btn` — gradient-bordered glass icon button

### Navigation
- `.admin-nav-item` + `.active` — sidebar nav with gradient pill + glowing left bar
- `.admin-section-title` — H2 with violet→cyan accent bar

### Clarity utilities (admin understanding)
- `.admin-page-header` + `.admin-page-title` + `.admin-page-subtitle` — page top with gradient title and dashed border
- `.admin-field-label` (`.req` for red asterisk) + `.admin-helper` + `.admin-helper-icon`
- `.admin-info-card` (blue) / `.admin-warning-card` (amber) / `.admin-success-card` (green)
- `.admin-hint-chip` — small gradient pill for contextual tips

## Auto-inheritance via body.admin-page selectors
ALL legacy admin pages auto-polished without per-page edits:
- `.glass-card` → gradient-border glass card
- Raw `.bg-white` / `.bg-gray-50/100` / `.bg-slate-50/100` panels (excluding buttons/inputs) → glassy gradient surface
- `[role="dialog"] > div` / popover / menu / listbox → blur(32px) gradient-border modal
- `[role="tablist"]` + active tab → gradient pill
- Primary buttons (`.bg-primary`, `.bg-blue-600`, `.bg-indigo-600`, `.bg-violet-600`, `.bg-purple-600`) → brand gradient with hover lift
- `<table thead>` → soft brand-tinted glass; `tbody tr:hover` → brand wash
- Inputs / selects / textareas → glass with brand focus ring
- Native `<label>` → bold 600
- Status colored backgrounds (`.bg-green-100` / `.bg-red-100` / `.bg-yellow-100` / `.bg-blue-100`) → tinted pills with matching border
- `.border-gray-200/300`, `.border-slate-200/300` → soft brand-tinted border
- `[data-empty-state]` / `.empty-state` → friendly dashed brand-tinted block

## Skip auto-glass
Add `data-glass-skip` attribute to opt-out a specific surface from auto-promotion.

## Gradient Border technique
CSS double-background trick:
```css
background:
  linear-gradient(... white glass ...) padding-box,
  linear-gradient(... brand→brand2→brand3 ...) border-box;
border: 1.5px solid transparent;
```

## Theme support
All tokens have `html[data-theme="dark-cyber"]` and `html[data-theme="midnight-purple"]` overrides.
