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

    // @ts-expect-error - startViewTransition is not yet in TS lib but well-supported
    if (typeof document !== 'undefined' && document.startViewTransition) {
      // Trigger view transition on next paint to capture the new DOM state
      // @ts-expect-error
      document.startViewTransition(() => {
        // No-op: React has already rendered. The browser snapshots old/new DOM.
      });
    }
  }, [location.pathname, navType]);

  return null;
};
