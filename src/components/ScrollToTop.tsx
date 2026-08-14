/**
 * ScrollToTop — on every forward navigation (PUSH/REPLACE) scroll the window
 * back to the top so a new page (e.g. product detail) always starts at the
 * top instead of keeping the previous scroll position (footer area).
 * Back/forward (POP) keeps the browser's native scroll restoration.
 */
import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();
  const navType = useNavigationType();
  const prevKey = useRef(`${pathname}${search}`);

  useLayoutEffect(() => {
    const key = `${pathname}${search}`;
    const changed = prevKey.current !== key;
    prevKey.current = key;

    if (!changed) return;
    if (navType === 'POP') return;
    if (hash) return; // let anchor links work

    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    toTop();
    // Re-assert after lazy content/images mount and shift layout
    const r1 = requestAnimationFrame(toTop);
    const t1 = window.setTimeout(toTop, 60);
    const t2 = window.setTimeout(toTop, 200);

    return () => {
      cancelAnimationFrame(r1);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname, search, hash, navType]);

  return null;
};
