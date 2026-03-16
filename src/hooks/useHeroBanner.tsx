import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SlideData = {
  id: string;
  tag: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  desc: string;
  price: string;
  original: string;
  off: string;
  badge: string;
  accentFrom: string;
  accentTo: string;
  emoji: string;
  features: string[];
  enabled: boolean;
};

export type BgSettings = {
  bgType: 'default' | 'gradient' | 'color';
  bgColor: string;
  bgGradientFrom: string;
  bgGradientTo: string;
};

export const useHeroBanner = () => {
  return useQuery({
    queryKey: ['hero-banner-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['hero_slides', 'hero_background']);

      const slidesRow = data?.find(r => r.key === 'hero_slides');
      const bgRow = data?.find(r => r.key === 'hero_background');

      const slides: SlideData[] | null = slidesRow?.value ? JSON.parse(slidesRow.value) : null;
      const bg: BgSettings | null = bgRow?.value ? JSON.parse(bgRow.value) : null;

      return { slides, bg };
    },
    staleTime: 1000 * 60 * 5,
  });
};
