import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Loads redirect rules from site_settings and enforces them client-side.
 * Add this once at the App level (already in RedirectEnforcer component).
 */
const useRedirects = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'redirects').maybeSingle()
      .then(({ data }) => {
        try {
          if (!data?.value) return;
          const rules: { from_path: string; to_path: string; type: string }[] = JSON.parse(data.value);
          const match = rules.find(r => r.from_path === location.pathname);
          if (match) {
            navigate(match.to_path, { replace: match.type === '301' });
          }
        } catch {}
      });
  }, [location.pathname, navigate]);
};

const RedirectEnforcer = () => {
  useRedirects();
  return null;
};

export default RedirectEnforcer;
