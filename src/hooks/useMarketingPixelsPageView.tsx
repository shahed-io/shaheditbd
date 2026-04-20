import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { mTrackPageView, loadMarketingPixels } from '@/components/store/MarketingPixels';

/**
 * Fires PageView event on every SPA route change for all enabled
 * social pixels (TikTok, Snapchat, Pinterest, LinkedIn, Twitter).
 */
export const useMarketingPixelsPageView = () => {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadMarketingPixels();
      if (cancelled) return;
      // Slight delay so the page DOM has settled
      setTimeout(() => mTrackPageView(), 300);
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);
};
