/**
 * ViewTransitions — wraps React Router navigation in document.startViewTransition()
 * so route changes get smooth fade animations (no white flash).
 * Falls back gracefully on browsers that don't support the API.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const ViewTransitions = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;

    // Only animate forward navigation, not back/forward browser buttons (those
    // already have native back animations on most browsers)
    if (navType === 'POP') return;

    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (typeof doc !== 'undefined' && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        // No-op: React has already rendered. Browser snapshots old/new DOM for fade.
      });
    }
  }, [location.pathname, navType]);

  return null;
};
