import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface FooterSection {
  id: string;
  title: string;
  icon: string;          // icon key (Package, Info, FileText, ...)
  accent: string;        // hsl color
  is_active: boolean;
  sort_order: number;
  links: FooterLink[];
}

const DEFAULT_SECTIONS: FooterSection[] = [
  {
    id: 'sec-products',
    title: 'Products',
    icon: 'Package',
    accent: 'hsl(258,78%,55%)',
    is_active: true,
    sort_order: 1,
    links: [
      { id: 'l-1', label: 'Windows Keys',     href: '/shop?category=windows', is_active: true, sort_order: 1 },
      { id: 'l-2', label: 'Office 365',       href: '/shop?category=office',  is_active: true, sort_order: 2 },
      { id: 'l-3', label: 'All Products',     href: '/shop',                  is_active: true, sort_order: 3 },
      { id: 'l-4', label: 'CID For Reseller', href: 'https://ss.shahedit.com/getcid/login.php', external: true, is_active: true, sort_order: 4 },
      { id: 'l-5', label: 'VPN & Security',   href: '/shop?category=vpn',     is_active: true, sort_order: 5 },
      { id: 'l-6', label: 'Free Tools',       href: '/free-tools',            is_active: true, sort_order: 6 },
    ],
  },
  {
    id: 'sec-info',
    title: 'Information',
    icon: 'Info',
    accent: 'hsl(200,90%,45%)',
    is_active: true,
    sort_order: 2,
    links: [
      { id: 'l-7',  label: 'FAQs',                   href: '/faqs',     is_active: true, sort_order: 1 },
      { id: 'l-8',  label: 'About Us',               href: '/about',    is_active: true, sort_order: 2 },
      { id: 'l-9',  label: 'My Account',             href: '/dashboard',is_active: true, sort_order: 3 },
      { id: 'l-10', label: 'Contact Us',             href: '/contact',  is_active: true, sort_order: 4 },
      { id: 'l-11', label: 'Blog',                   href: '/blog',     is_active: true, sort_order: 5 },
      { id: 'l-12', label: 'Software Download Link', href: '/link',     is_active: true, sort_order: 6 },
    ],
  },
  {
    id: 'sec-policies',
    title: 'Policies',
    icon: 'FileText',
    accent: 'hsl(162,72%,38%)',
    is_active: true,
    sort_order: 3,
    links: [
      { id: 'l-13', label: 'Privacy Policy',         href: '/privacy-policy',  is_active: true, sort_order: 1 },
      { id: 'l-14', label: 'Terms & Conditions',     href: '/terms-conditions',is_active: true, sort_order: 2 },
      { id: 'l-15', label: 'Refund & Return Policy', href: '/refund-policy',   is_active: true, sort_order: 3 },
      { id: 'l-16', label: 'Order & Cancellation',   href: '/order-policy',    is_active: true, sort_order: 4 },
      { id: 'l-17', label: 'Delivery Info',          href: '/delivery-info',   is_active: true, sort_order: 5 },
      { id: 'l-18', label: 'Refund Request',         href: '/refund-request',  is_active: true, sort_order: 6 },
    ],
  },
];

const FOOTER_MENU_KEY = 'footer_menu_sections';

export const useFooterMenu = () => {
  const { data: sections = DEFAULT_SECTIONS, isLoading } = useQuery<FooterSection[]>({
    queryKey: ['footer-menu'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', FOOTER_MENU_KEY)
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value) as FooterSection[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch { /* ignore */ }
      }
      return DEFAULT_SECTIONS;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const visibleSections = sections
    .filter(s => s.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(s => ({
      ...s,
      links: s.links
        .filter(l => l.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));

  return { sections: visibleSections, allSections: sections, isLoading };
};

export { DEFAULT_SECTIONS as FOOTER_MENU_DEFAULTS, FOOTER_MENU_KEY };
