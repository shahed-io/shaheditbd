# Admin Panel Design Port → Gharoya Bazar

**Stack adaptation:** Shahed Store (React + Vite + Tailwind v3 + HSL + react-router) → Gharoya Bazar (TanStack Start + Tailwind v4 + oklch + TanStack Router)

> **How to use:** Open the Gharoya Bazar project in Lovable, paste this entire file into chat, and say: *"Apply this admin design port to my project."* The agent there will execute the steps.

---

## STEP 1 — Add admin design tokens to `src/styles.css`

Append the following block to the **end** of `src/styles.css`:

```css
/* ══════════════════════════════════════════════════════════════
   ADMIN PANEL DESIGN SYSTEM
   Ported from Shahed Store · Tailwind v4 / oklch compatible
   Indigo + Gold gradient glassmorphism (24-28px blur)
══════════════════════════════════════════════════════════════ */
:root {
  /* Brand admin tokens (Royal Indigo + Electric Gold) */
  --admin-indigo:        oklch(0.55 0.22 285);
  --admin-indigo-light:  oklch(0.72 0.18 285);
  --admin-indigo-dim:    oklch(0.55 0.22 285 / 0.12);
  --admin-gold:          oklch(0.78 0.16 85);
  --admin-gold-dim:      oklch(0.78 0.16 85 / 0.12);
  --admin-cyan:          oklch(0.65 0.15 220);
  --admin-pink:          oklch(0.65 0.22 350);
  --admin-emerald:       oklch(0.6  0.16 160);

  /* Admin glassmorphism (24-28px blur) */
  --admin-glass-bg:      oklch(1 0 0 / 0.6);
  --admin-glass-border:  oklch(0.55 0.22 285 / 0.18);
  --admin-glass-shadow:
    0 4px 24px oklch(0.25 0.04 285 / 0.08),
    inset 0 1px 0 oklch(1 0 0 / 0.7);
  --admin-glow-indigo:
    0 8px 32px oklch(0.55 0.22 285 / 0.30),
    0 1px 4px  oklch(0.55 0.22 285 / 0.15);
  --admin-glow-gold:
    0 8px 32px oklch(0.78 0.16 85 / 0.30),
    0 1px 4px  oklch(0.78 0.16 85 / 0.15);

  /* Admin gradients */
  --admin-gradient-hero:
    linear-gradient(135deg, oklch(0.55 0.22 285) 0%, oklch(0.65 0.18 220) 100%);
  --admin-gradient-warm:
    linear-gradient(135deg, oklch(0.65 0.22 350) 0%, oklch(0.78 0.16 85) 100%);
  --admin-gradient-card:
    linear-gradient(145deg, oklch(1 0 0 / 0.85), oklch(0.98 0.005 285 / 0.7));
}

/* ──────── Admin shell background ──────── */
body.admin-page {
  background:
    radial-gradient(circle at 8% 12%,  oklch(0.55 0.22 285 / 0.10), transparent 45%),
    radial-gradient(circle at 92% 8%,  oklch(0.78 0.16 85  / 0.12), transparent 45%),
    radial-gradient(circle at 80% 92%, oklch(0.65 0.15 220 / 0.10), transparent 50%),
    var(--background);
}

/* ──────── Admin glassmorphism utilities ──────── */
.admin-glass {
  background: var(--admin-glass-bg);
  border: 1px solid var(--admin-glass-border);
  box-shadow: var(--admin-glass-shadow);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border-radius: 1rem;
}
.admin-glass-strong {
  background: oklch(1 0 0 / 0.85);
  border: 1px solid var(--admin-glass-border);
  box-shadow: var(--admin-glass-shadow);
  backdrop-filter: blur(28px) saturate(1.5);
  -webkit-backdrop-filter: blur(28px) saturate(1.5);
  border-radius: 1rem;
}

/* ──────── Stat cards with gradient glow ──────── */
.admin-stat-card {
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--admin-gradient-card);
  border: 1px solid var(--admin-glass-border);
  box-shadow: var(--admin-glass-shadow);
  backdrop-filter: blur(24px) saturate(1.4);
  transition: transform .25s ease, box-shadow .25s ease;
}
.admin-stat-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg,
    oklch(0.55 0.22 285 / 0.4),
    oklch(0.78 0.16 85  / 0.4));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity .25s ease;
}
.admin-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--admin-glow-indigo);
}
.admin-stat-card:hover::before { opacity: 1; }

/* ──────── Hero header (gradient banner) ──────── */
.admin-hero-header {
  position: relative;
  overflow: hidden;
  padding: 2rem 1.5rem;
  border-radius: 1.5rem;
  background: var(--admin-gradient-hero);
  color: oklch(1 0 0);
  box-shadow: var(--admin-glow-indigo);
}
.admin-hero-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 100% 0%, oklch(0.78 0.16 85 / 0.35), transparent 45%),
    radial-gradient(circle at 0% 100%, oklch(0.65 0.22 350 / 0.25), transparent 50%);
  pointer-events: none;
}
.admin-hero-header > * { position: relative; z-index: 1; }

/* ──────── Sidebar styling ──────── */
.admin-sidebar {
  background: oklch(0.985 0.008 285 / 0.85);
  border-right: 1px solid var(--admin-glass-border);
  backdrop-filter: blur(20px) saturate(1.4);
}
.admin-sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.625rem;
  color: oklch(0.3 0.02 285);
  font-weight: 500;
  transition: background .15s ease, color .15s ease;
}
.admin-sidebar-item:hover {
  background: oklch(0.55 0.22 285 / 0.08);
  color: var(--admin-indigo);
}
.admin-sidebar-item[data-active="true"] {
  background: var(--admin-gradient-hero);
  color: oklch(1 0 0);
  box-shadow: var(--admin-glow-indigo);
}

/* ──────── Gradient text accent ──────── */
.admin-gradient-text {
  background: var(--admin-gradient-hero);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
}

/* ──────── Animations ──────── */
@keyframes admin-rise-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.admin-rise-up { animation: admin-rise-up .4s ease-out both; }
.admin-rise-up-delay-1 { animation-delay: .05s; }
.admin-rise-up-delay-2 { animation-delay: .10s; }
.admin-rise-up-delay-3 { animation-delay: .15s; }
.admin-rise-up-delay-4 { animation-delay: .20s; }

@keyframes admin-pulse-glow {
  0%, 100% { box-shadow: var(--admin-glow-indigo); }
  50%      { box-shadow: var(--admin-glow-gold); }
}
.admin-pulse-glow { animation: admin-pulse-glow 3s ease-in-out infinite; }
```

---

## STEP 2 — Create `src/components/admin/AdminLayout.tsx`

TanStack-Router version of the layout shell:

```tsx
import { useEffect } from 'react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard, ShoppingBag, Users, Package, Settings,
  type LucideIcon,
} from 'lucide-react';

interface NavItem { to: string; label: string; Icon: LucideIcon; }

const NAV: NavItem[] = [
  { to: '/admin',          label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/admin/orders',   label: 'Orders',    Icon: ShoppingBag },
  { to: '/admin/products', label: 'Products',  Icon: Package },
  { to: '/admin/customers',label: 'Customers', Icon: Users },
  { to: '/admin/settings', label: 'Settings',  Icon: Settings },
];

export function AdminLayout() {
  const { location } = useRouterState();

  // Activate admin background
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => document.body.classList.remove('admin-page');
  }, []);

  return (
    <div className="min-h-screen flex">
      <aside className="admin-sidebar w-60 hidden md:flex flex-col p-4 gap-1">
        <div className="px-2 py-4 mb-2">
          <h1 className="text-xl font-bold admin-gradient-text">Admin Panel</h1>
        </div>
        {NAV.map(({ to, label, Icon }) => {
          const active = location.pathname === to
            || (to !== '/admin' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className="admin-sidebar-item"
              data-active={active}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </aside>

      <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## STEP 3 — Create `src/components/admin/AdminHeroHeader.tsx`

Gradient banner with title + decorative icons:

```tsx
import type { LucideIcon } from 'lucide-react';

interface AdminHeroHeaderProps {
  title: string;
  section: string;
  Icon: LucideIcon;
  decorIcons?: LucideIcon[];
}

export function AdminHeroHeader({
  title, section, Icon, decorIcons = [],
}: AdminHeroHeaderProps) {
  return (
    <header className="admin-hero-header admin-rise-up mb-6">
      {/* Drifting decorative icons */}
      {decorIcons.map((D, i) => (
        <D
          key={i}
          className="absolute opacity-10 h-24 w-24"
          style={{
            top:  `${10 + i * 15}%`,
            right: `${5 + i * 12}%`,
            transform: `rotate(${i * 15}deg)`,
          }}
        />
      ))}
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-widest opacity-80">{section}</p>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        </div>
      </div>
    </header>
  );
}
```

---

## STEP 4 — Stat card example component

`src/components/admin/AdminStatCard.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  trend?: string;
  delay?: 1 | 2 | 3 | 4;
}

export function AdminStatCard({
  label, value, Icon, trend, delay = 1,
}: AdminStatCardProps) {
  return (
    <div className={`admin-stat-card admin-rise-up admin-rise-up-delay-${delay}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold admin-gradient-text">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 5 — Wire into TanStack Router

Create `src/routes/admin.tsx` (layout route):

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});
```

Then create child routes like `src/routes/admin/index.tsx`, `src/routes/admin/orders.tsx`, etc. Inside each child page, use:

```tsx
import { ShoppingBag, DollarSign, Users, Package } from 'lucide-react';
import { AdminHeroHeader } from '@/components/admin/AdminHeroHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';

export default function AdminDashboard() {
  return (
    <>
      <AdminHeroHeader
        title="Dashboard"
        section="Overview"
        Icon={ShoppingBag}
        decorIcons={[DollarSign, Users, Package]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Orders Today" value={42}    Icon={ShoppingBag} delay={1} />
        <AdminStatCard label="Revenue"      value="৳12k" Icon={DollarSign}  delay={2} />
        <AdminStatCard label="Customers"    value={318}   Icon={Users}       delay={3} />
        <AdminStatCard label="Low Stock"    value={7}     Icon={Package}     delay={4} />
      </div>
    </>
  );
}
```

---

## What you get

- ✅ White glassmorphism cards (24-28px blur, indigo border tint)
- ✅ Indigo → Gold gradient hero header with drifting decor icons
- ✅ Stat cards with hover lift + gradient glow ring
- ✅ Sidebar with active-state gradient highlight
- ✅ `admin-rise-up` entrance animation (mobile-safe, opacity-only)
- ✅ Aurora radial background only on `body.admin-page`
- ✅ Pure CSS — no extra dependencies needed

## Compatibility notes

| Concern | Status |
|---|---|
| Tailwind v4 (`@theme inline`) | ✅ Uses raw CSS vars, doesn't require token registration |
| oklch colors | ✅ All admin tokens already in oklch |
| TanStack Router | ✅ Uses `Link` + `useRouterState` (no react-router) |
| Existing Gharoya glass (`.glass`, `.glass-strong`) | ✅ Kept untouched — admin uses `.admin-glass` namespace |
| Aurora `body::before` | ✅ Untouched — admin layers its own radial on top |
