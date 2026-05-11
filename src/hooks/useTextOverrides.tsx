import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRegistryEntry } from '@/lib/textRegistry';

export interface TextOverrideRow {
  id: string;
  key: string;
  value: string;
  default_value: string;
  category: string;
  description: string | null;
  updated_at: string;
}

/**
 * Loads ALL text overrides from the database, once, cached for 10 minutes.
 * Returns a Map<key, value> for O(1) lookups by <T id="..."/>.
 */
export const useTextOverrides = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['text-overrides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('text_overrides')
        .select('key, value');
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach((r: { key: string; value: string }) => {
        if (r.value && r.value.length > 0) map.set(r.key, r.value);
      });
      return map;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return { overrides: data || new Map<string, string>(), isLoading };
};

/**
 * Hook to read a single text by key. Falls back to registry default.
 */
export const useText = (key: string, fallback?: string) => {
  const { overrides } = useTextOverrides();
  const override = overrides.get(key);
  if (override) return override;
  if (fallback !== undefined) return fallback;
  return getRegistryEntry(key)?.defaultValue ?? key;
};
