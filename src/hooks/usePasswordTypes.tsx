import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PasswordType = {
  id: string;        // unique slug, e.g. 'temporary'
  label: string;     // display label
  emoji: string;     // emoji shown in delivery
  color: string;     // tailwind color hint, e.g. 'orange'
  description?: string;
};

const SETTING_KEY = 'license_password_types';

export const DEFAULT_PASSWORD_TYPES: PasswordType[] = [
  { id: 'temporary', label: 'Temporary', emoji: '⏱️', color: 'orange', description: 'অস্থায়ী পাসওয়ার্ড — পরিবর্তন করতে হবে' },
  { id: 'permanent', label: 'Permanent', emoji: '♾️', color: 'green', description: 'স্থায়ী পাসওয়ার্ড — পরিবর্তন করার দরকার নেই' },
  { id: 'one_time', label: 'One-Time', emoji: '🔂', color: 'blue', description: 'একবার ব্যবহারযোগ্য' },
  { id: 'lifetime', label: 'Lifetime', emoji: '💎', color: 'purple', description: 'আজীবন বৈধ' },
  { id: 'trial', label: 'Trial', emoji: '🎁', color: 'pink', description: 'ট্রায়াল অ্যাকাউন্ট' },
];

export function usePasswordTypes() {
  const qc = useQueryClient();

  const { data: types = DEFAULT_PASSWORD_TYPES, isLoading } = useQuery({
    queryKey: ['license-password-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTING_KEY)
        .maybeSingle();
      if (!data?.value) return DEFAULT_PASSWORD_TYPES;
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as PasswordType[];
      } catch {
        // fallback
      }
      return DEFAULT_PASSWORD_TYPES;
    },
    staleTime: 60_000,
  });

  const saveMut = useMutation({
    mutationFn: async (next: PasswordType[]) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key: SETTING_KEY, value: JSON.stringify(next), category: 'general' },
          { onConflict: 'key' },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['license-password-types'] }),
  });

  function getType(id: string | null | undefined): PasswordType | null {
    if (!id) return null;
    return types.find(t => t.id === id) || null;
  }

  return { types, isLoading, save: saveMut.mutateAsync, saving: saveMut.isPending, getType };
}
