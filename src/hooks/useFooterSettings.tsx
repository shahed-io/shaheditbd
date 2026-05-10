import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FooterSettings {
  cert_title: string;
  cert_id: string;
  status_text: string;
  payment_methods: string; // comma-separated: "BKash,Nagad,Rocket"
  phone: string;
  email: string;
  address: string;
  website_url: string;
  store_name: string;
  tagline: string;
  facebook_url: string;
  whatsapp_url: string;
  instagram_url: string;
  telegram_url: string;
}

const DEFAULTS: FooterSettings = {
  cert_title: 'Certificate of Digital Business Identity (DBID)',
  cert_id: 'DBID: 586772174',
  status_text: 'Trusted Digital Product Store',
  payment_methods: 'BKash,Nagad,Rocket,Upay,BKash Merchant',
  phone: '01840-099853',
  email: 'info@shahedstore.com.bd',
  address: 'Ishwardi, Pabna',
  website_url: 'https://www.shahedstore.com.bd',
  store_name: 'Shahed Store',
  tagline: 'বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার স্টোর। অরিজিনাল সফটওয়্যার, সেরা দামে, ইনস্ট্যান্ট ডেলিভারি।',
  facebook_url: 'https://www.facebook.com/Shahed.Store365',
  whatsapp_url: 'https://wa.me/shahedstore',
  instagram_url: 'https://www.instagram.com/shahedstore.com.bd/',
  telegram_url: 'https://t.me/Shahed_Store',
};

const SETTINGS_KEY = 'footer_settings';

export const useFooterSettings = () => {
  const { data: settings = DEFAULTS, isLoading } = useQuery<FooterSettings>({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();
      if (data?.value) {
        try {
          return { ...DEFAULTS, ...JSON.parse(data.value) } as FooterSettings;
        } catch { /* fall through */ }
      }
      return DEFAULTS;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return { settings, isLoading };
};

export { DEFAULTS as FOOTER_DEFAULTS, SETTINGS_KEY as FOOTER_SETTINGS_KEY };
