/**
 * usePrefetchRoute — Instant Navigation System
 * 
 * Mimics Next.js `<Link prefetch>` behavior on Vite + React Router.
 * Prefetches lazy-loaded route chunks on hover/touch so when the user
 * actually clicks, the JS is already cached → instant navigation.
 *
 * Also exposes `prefetchOnIdle` for warming critical routes during browser idle time.
 */
import { useCallback, useEffect, useRef } from 'react';

// Cache of started prefetches — never re-fetch the same chunk
const _prefetchedKeys = new Set<string>();

/** Map of route key → dynamic import factory. Add new routes here as needed. */
const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  '/':              () => import('@/pages/Index'),
  '/shop':          () => import('@/pages/Shop'),
  '/checkout':      () => import('@/pages/Checkout'),
  '/blog':          () => import('@/pages/Blog'),
  '/free-tools':    () => import('@/pages/FreeTools'),
  '/dashboard':     () => import('@/pages/UserDashboard'),
  '/contact':       () => import('@/pages/ContactUs'),
  '/about':         () => import('@/pages/AboutUs'),
  '/faqs':          () => import('@/pages/FAQs'),
  '/privacy-policy':() => import('@/pages/PrivacyPolicy'),
  '/terms-conditions':() => import('@/pages/TermsConditions'),
  '/refund-policy': () => import('@/pages/RefundPolicy'),
  '/order-policy':  () => import('@/pages/OrderPolicy'),
  '/delivery-info': () => import('@/pages/DeliveryInfo'),
  '/return-policy': () => import('@/pages/ReturnPolicy'),
  '/refund-request':() => import('@/pages/RefundRequest'),
  '/install':       () => import('@/pages/InstallApp'),
  
  // Dynamic routes — keyed by prefix
  '/product/':      () => import('@/pages/ProductDetail'),
  '/blog/':         () => import('@/pages/BlogPost'),
  '/link':          () => import('@/pages/HelpCenter'),
};

/** Match a path to a loader. Supports dynamic prefixes like /product/:slug. */
function getLoader(path: string): (() => Promise<unknown>) | null {
  if (ROUTE_LOADERS[path]) return ROUTE_LOADERS[path];
  // Dynamic match
  if (path.startsWith('/product/')) return ROUTE_LOADERS['/product/'];
  if (path.startsWith('/blog/'))    return ROUTE_LOADERS['/blog/'];
  if (path.startsWith('/link'))     return ROUTE_LOADERS['/link'];
  return null;
}

/** Trigger prefetch for a path (idempotent). */
export function prefetchRoute(path: string): void {
  if (typeof window === 'undefined') return;
  if (_prefetchedKeys.has(path)) return;

  const loader = getLoader(path);
  if (!loader) return;

  _prefetchedKeys.add(path);
  // Fire-and-forget; errors are silent (chunk will load normally on actual nav)
  loader().catch(() => _prefetchedKeys.delete(path));
}

/** Schedule a prefetch during idle CPU time (after first paint). */
export function prefetchOnIdle(paths: string[], delayMs = 1500): void {
  if (typeof window === 'undefined') return;
  const run = () => paths.forEach(prefetchRoute);
  // Wait for initial render to settle before warming routes
  if ('requestIdleCallback' in window) {
    setTimeout(() => (window as any).requestIdleCallback(run, { timeout: 2500 }), delayMs);
  } else {
    setTimeout(run, delayMs + 500);
  }
}

/**
 * Hook returning hover/touch handlers for an interactive element.
 * Usage: <Link {...usePrefetchHandlers('/shop')} to="/shop">Shop</Link>
 */
export function usePrefetchHandlers(path: string | undefined) {
  const onMouseEnter = useCallback(() => path && prefetchRoute(path), [path]);
  const onTouchStart = useCallback(() => path && prefetchRoute(path), [path]);
  const onFocus      = useCallback(() => path && prefetchRoute(path), [path]);
  return { onMouseEnter, onTouchStart, onFocus };
}

/**
 * IntersectionObserver-based prefetch — fire when element scrolls into viewport.
 * Useful for product cards in long lists.
 */
export function usePrefetchInView(path: string | undefined) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!path || !ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          prefetchRoute(path);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' } // Start prefetching 200px before visible
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [path]);
  return ref;
}
