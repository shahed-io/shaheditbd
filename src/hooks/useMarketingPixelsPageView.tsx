import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fires PageView event on every SPA route change for all enabled
 * social pixels (TikTok, Snapchat, Pinterest, LinkedIn, Twitter).
 */
export const useMarketingPixelsPageView = () => {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { loadMarketingPixels, mTrackPageView } = await import('@/components/store/MarketingPixels');
      await loadMarketingPixels();
      if (cancelled) return;
      // Slight delay so the page DOM has settled
      setTimeout(() => mTrackPageView(), 300);
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);
};
