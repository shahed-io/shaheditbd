---
name: Admin Design System
description: Admin panel uses website-matched glassmorphism — admin-glass-* tokens, admin-nav-item, admin-stat-card, admin-section-title, admin-icon-btn utilities, plus auto-applied glass-card polish via body.admin-page selector
type: design
---
Admin panel ওয়েবসাইটের premium gradient glassmorphism follow করে।

## Core utility classes (in src/index.css)
- `.admin-gradient-bg` — animated radial blob background (violet/cyan/pink), supports dark themes
- `.admin-glass-card` — premium glass card with hover lift + brand border glow
- `.admin-glass-sidebar` — 36px blur sidebar with inset highlight
- `.admin-glass-header` — 28px blur sticky header
- `.admin-nav-item` + `.active` — sidebar nav link with gradient pill + glowing left bar
- `.admin-stat-card` — dashboard tile with hover lift + gradient sweep overlay
- `.admin-section-title` — H2 with gradient accent bar (violet→cyan)
- `.admin-icon-btn` — header/toolbar glass icon button

## Auto-inheritance
`body.admin-page` selector globally promotes `.glass-card`, tables, inputs, scrollbars to website-matched glassmorphism — meaning all 100+ admin pages inherit polished look without per-page edits.

## Theme support
All tokens have `html[data-theme="dark-cyber"]` and `html[data-theme="midnight-purple"]` overrides for full theme toggle compatibility.

## Active page indicator
Sidebar active item shows: gradient background (brand→brand2 16%/10% opacity), left vertical pill bar with violet glow, and primary text color.

## Header
- Page title in Sora font, breadcrumb has gradient text on current page
- Notification bell uses gradient-to-br badge with white ring
- All buttons use `admin-icon-btn` for consistency
