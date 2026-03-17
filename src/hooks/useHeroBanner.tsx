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
  productSlug: string;
};

export type BgSettings = {
  bgType: 'default' | 'gradient' | 'color';
  bgColor: string;
  bgGradientFrom: string;
  bgGradientTo: string;
};

export type HeroStatCard  = { label: string; value: string; icon: string };
export type HeroFloatCard = { label: string; value: string; icon: string };
export type HeroTrustItem = { text: string; icon: string };

export const useHeroBanner = () => {
  return useQuery({
    queryKey: ['hero-banner-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['hero_slides', 'hero_background', 'hero_stats', 'hero_floating', 'hero_trust']);

      const get = (key: string) => data?.find(r => r.key === key)?.value;

      const slides:   SlideData[] | null  = get('hero_slides')     ? JSON.parse(get('hero_slides')!)     : null;
      const bg:       BgSettings | null   = get('hero_background') ? JSON.parse(get('hero_background')!) : null;
      const stats:    HeroStatCard[]|null  = get('hero_stats')      ? JSON.parse(get('hero_stats')!)      : null;
      const floating: HeroFloatCard[]|null = get('hero_floating')   ? JSON.parse(get('hero_floating')!)   : null;
      const trust:    HeroTrustItem[]|null = get('hero_trust')      ? JSON.parse(get('hero_trust')!)      : null;

      return { slides, bg, stats, floating, trust };
    },
    staleTime: 1000 * 60 * 5,
  });
};
