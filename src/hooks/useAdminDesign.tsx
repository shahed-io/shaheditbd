import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  ADMIN_DESIGN_KEY, AdminDesignConfig, DEFAULT_ADMIN_DESIGN,
  applyAdminDesign, mergeDesign,
} from '@/lib/adminDesign';

const CACHE_KEY = 'admin_design_cache';

/**
 * Loads the stored admin design configuration and applies it as CSS overrides.
 * Cached in localStorage so the admin shell never flashes the default look.
 */
export const useAdminDesign = () => {
  const [config, setConfig] = useState<AdminDesignConfig>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return mergeDesign(JSON.parse(cached));
    } catch { /* ignore */ }
    return DEFAULT_ADMIN_DESIGN;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { applyAdminDesign(config); }, [config]);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', ADMIN_DESIGN_KEY)
      .maybeSingle();
    const next = mergeDesign(data?.value ?? null);
    setConfig(next);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setLoading(false);
    return next;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (next: AdminDesignConfig) => {
    const payload = { ...mergeDesign(next), updated_at: new Date().toISOString() };
    const { error } = await supabase.from('site_settings').upsert(
      { key: ADMIN_DESIGN_KEY, value: payload as never, category: 'appearance' },
      { onConflict: 'key' },
    );
    if (error) throw error;
    setConfig(payload);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
    return payload;
  }, []);

  return { config, setConfig, loading, refresh, save };
};
