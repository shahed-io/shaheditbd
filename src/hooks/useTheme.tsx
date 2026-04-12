import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeId = 'clean-white' | 'dark-cyber' | 'ocean-blue' | 'rose-gold';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  nameBn: string;
  description: string;
  preview: {
    bg: string;
    primary: string;
    accent: string;
    text: string;
  };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'clean-white',
    name: 'Clean White',
    nameBn: 'ক্লিন হোয়াইট',
    description: 'পরিষ্কার সাদা ব্যাকগ্রাউন্ড, রয়্যাল ইন্ডিগো প্রাইমারি',
    preview: { bg: '#ffffff', primary: '#7c3aed', accent: '#f59e0b', text: '#1e293b' },
  },
  {
    id: 'dark-cyber',
    name: 'Dark Cyber',
    nameBn: 'ডার্ক সাইবার',
    description: 'গাঢ় কালো ব্যাকগ্রাউন্ড, নিয়ন ভায়োলেট গ্লো ইফেক্ট',
    preview: { bg: '#0f0a1a', primary: '#a78bfa', accent: '#06b6d4', text: '#e2e8f0' },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    nameBn: 'ওশান ব্লু',
    description: 'শান্ত নীল টোন, প্রফেশনাল এবং ট্রাস্টেড লুক',
    preview: { bg: '#f0f9ff', primary: '#0284c7', accent: '#10b981', text: '#0c4a6e' },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    nameBn: 'রোজ গোল্ড',
    description: 'উষ্ণ গোলাপি-সোনালি টোন, প্রিমিয়াম ফিল',
    preview: { bg: '#fff7f5', primary: '#e11d48', accent: '#d97706', text: '#44403c' },
  },
];

const THEME_KEY = 'active_theme';

export const useTheme = () => {
  const [activeTheme, setActiveTheme] = useState<ThemeId>('clean-white');
  const [loading, setLoading] = useState(true);

  // Apply theme to document
  const applyTheme = (themeId: ThemeId) => {
    document.documentElement.setAttribute('data-theme', themeId);
    setActiveTheme(themeId);
  };

  // Fetch from DB
  useEffect(() => {
    const cached = localStorage.getItem('site_theme');
    if (cached && THEMES.some(t => t.id === cached)) {
      applyTheme(cached as ThemeId);
    }

    supabase
      .from('site_settings')
      .select('value')
      .eq('key', THEME_KEY)
      .maybeSingle()
      .then(({ data }) => {
        const val = data?.value as ThemeId | null;
        if (val && THEMES.some(t => t.id === val)) {
          applyTheme(val);
          localStorage.setItem('site_theme', val);
        }
        setLoading(false);
      });
  }, []);

  // Save theme
  const saveTheme = async (themeId: ThemeId) => {
    applyTheme(themeId);
    localStorage.setItem('site_theme', themeId);
    await supabase.from('site_settings').upsert(
      { key: THEME_KEY, value: themeId, category: 'appearance' },
      { onConflict: 'key' }
    );
  };

  return { activeTheme, loading, applyTheme, saveTheme, themes: THEMES };
};
