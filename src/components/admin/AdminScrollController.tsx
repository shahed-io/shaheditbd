import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Global horizontal-scroll helper for the admin panel.
 *
 * - Finds every horizontally-scrollable element inside `.admin-root`
 *   (elements with `overflow-x: auto/scroll` whose scrollWidth > clientWidth).
 * - Enables mouse drag-to-scroll on them (touch already works natively).
 * - Renders a floating ← → pill that scrolls the currently-visible
 *   scrollable element so admins on small screens can reach off-screen
 *   columns/buttons without a scrollbar.
 */
const SCROLL_STEP_RATIO = 0.7; // scroll ~70% of visible width per click
const ATTR = 'data-admin-scroll-attached';

function isHorizontallyScrollable(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const style = getComputedStyle(el);
  const ox = style.overflowX;
  if (ox !== 'auto' && ox !== 'scroll') return false;
  return el.scrollWidth - el.clientWidth > 4;
}

function attachDragScroll(el: HTMLElement) {
  if (el.getAttribute(ATTR)) return;
  el.setAttribute(ATTR, '1');

  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  const onDown = (e: PointerEvent) => {
    // Only left button / primary pointer; ignore when starting on interactive controls
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, a, input, textarea, select, [role="button"], [data-no-drag]')) return;
    isDown = true;
    moved = false;
    startX = e.clientX;
    startScroll = el.scrollLeft;
  };
  const onMove = (e: PointerEvent) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) {
      moved = true;
      el.scrollLeft = startScroll - dx;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    }
  };
  const onUp = () => {
    if (moved) {
      el.style.cursor = '';
      el.style.userSelect = '';
    }
    isDown = false;
  };

  el.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

const AdminScrollController = () => {
  const [visible, setVisible] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const updateState = useCallback(() => {
    const el = targetRef.current;
    if (!el || !document.body.contains(el)) {
      setVisible(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const onScreen = rect.top < vh - 40 && rect.bottom > 80;
    const hasOverflow = el.scrollWidth - el.clientWidth > 4;
    setVisible(onScreen && hasOverflow);
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const pickTarget = useCallback(() => {
    const root = document.querySelector('.admin-root') as HTMLElement | null;
    if (!root) return;
    const candidates = Array.from(root.querySelectorAll<HTMLElement>('*')).filter(isHorizontallyScrollable);
    if (candidates.length === 0) {
      targetRef.current = null;
      setVisible(false);
      return;
    }
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const viewportCenter = vh / 2;
    // Choose the scrollable element whose vertical center is closest to the viewport center.
    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 80 || r.top > vh - 40) continue; // fully off-screen
      const center = (r.top + r.bottom) / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
    targetRef.current = best;
    // Attach drag-scroll to all candidates opportunistically.
    for (const el of candidates) attachDragScroll(el);
    updateState();
  }, [updateState]);

  const schedule = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      pickTarget();
    });
  }, [pickTarget]);

  useEffect(() => {
    const root = document.querySelector('.admin-root') as HTMLElement | null;
    if (!root) return;

    schedule();

    const mo = new MutationObserver(() => schedule());
    mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });

    const onScrollOrResize = () => schedule();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    const iv = window.setInterval(schedule, 800); // safety net for dynamic content

    return () => {
      mo.disconnect();
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      window.clearInterval(iv);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [schedule]);

  const scrollBy = (dir: -1 | 1) => {
    const el = targetRef.current;
    if (!el) return;
    const step = Math.max(120, Math.floor(el.clientWidth * SCROLL_STEP_RATIO));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
    // update arrows after animation
    window.setTimeout(updateState, 320);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-full border border-violet-200/70 dark:border-violet-800/50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-lg px-1 py-1"
      style={{
        right: 'max(12px, env(safe-area-inset-right))',
        bottom: 'calc(max(84px, env(safe-area-inset-bottom)) + 8px)',
      }}
      data-no-drag
      aria-label="Scroll table horizontally"
    >
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={!canLeft}
        aria-label="Scroll left"
        className="w-9 h-9 rounded-full flex items-center justify-center text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={!canRight}
        aria-label="Scroll right"
        className="w-9 h-9 rounded-full flex items-center justify-center text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default AdminScrollController;
