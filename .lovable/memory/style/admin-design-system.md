---
name: Admin Design System
description: Admin panel uses Gradient Border Glass Cards — admin-glass-card / admin-stat-card use double-background (padding-box+border-box) for true gradient stroke. Includes admin-page-header, admin-helper, admin-info-card, admin-warning-card, admin-success-card, admin-field-label clarity utilities. Auto-applied via body.admin-page selector.
type: design
---
Admin panel ওয়েবসাইটের premium **Gradient Border Glassmorphism** style follow করে — প্রতিটা card-এ true gradient stroke (violet→cyan→pink) যা hover-এ আরও vivid হয়।

## Core utility classes (in src/index.css)

### Surfaces (gradient border + glass)
- `.admin-glass-card` — primary glass card with **gradient border** (double-background trick), hover lifts + intensifies stroke
- `.admin-stat-card` — dashboard tile, gradient border, gradient sweep overlay, hover translateY(-3px)
- `.admin-glass-sidebar` — 36px blur sidebar
- `.admin-glass-header` — 28px blur sticky header
- `.admin-icon-btn` — gradient-bordered glass icon button

### Navigation
- `.admin-nav-item` + `.active` — sidebar nav with gradient pill + glowing left bar
- `.admin-section-title` — H2 with violet→cyan accent bar

### Clarity utilities (NEW — for admin understanding)
- `.admin-page-header` — page top section with gradient title + dashed bottom border
- `.admin-page-title` — large gradient text (foreground→primary)
- `.admin-page-subtitle` — muted helper line under title (max 60ch)
- `.admin-field-label` — bold field label, supports `.req` span for red asterisk
- `.admin-helper` — small muted helper text under inputs
- `.admin-helper-icon` — pill helper with brand-tinted background
- `.admin-info-card` — blue gradient-bordered callout
- `.admin-warning-card` — amber gradient-bordered callout
- `.admin-success-card` — green gradient-bordered callout

## Gradient Border technique
Uses CSS double-background trick:
```css
background:
  linear-gradient(... white glass ...) padding-box,
  linear-gradient(... brand→brand2→brand3 ...) border-box;
border: 1.5px solid transparent;
```
This creates a true gradient stroke (no hack overlays).

## Auto-inheritance
`body.admin-page .glass-card` selector globally promotes ALL `.glass-card` shadcn cards to gradient-border glass — meaning all 100+ admin pages inherit polished look without per-page edits.

## Theme support
All tokens have `html[data-theme="dark-cyber"]` and `html[data-theme="midnight-purple"]` overrides.

## Active page indicator
Sidebar active item: gradient bg (brand→brand2 18%/12%), 3px left pill bar with violet glow, primary text color.
