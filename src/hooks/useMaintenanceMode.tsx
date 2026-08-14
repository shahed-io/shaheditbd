import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const MAINTENANCE_KEY = 'maintenance_mode';

export type MaintenanceSettings = {
  enabled: boolean;
  /** 'all' = whole website, 'selected' = only the areas listed below */
  scope: 'all' | 'selected';
  areas: string[];
  badge: string;
  title: string;
  message: string;
  eta: string;
  showProgress: boolean;
  progressText: string;
  showContact: boolean;
  contactHeading: string;
  contactSubtext: string;
  whatsappLabel: string;
  whatsappMessage: string;
  whatsapp: string;
  email: string;
  phone: string;
  address: string;
  showSocial: boolean;
  facebook: string;
  website: string;
  footerText: string;
};

export const MAINTENANCE_AREAS: { key: string; label: string; hint: string; prefixes: string[] }[] = [
  { key: 'home', label: 'Homepage', hint: '/', prefixes: ['/'] },
  { key: 'shop', label: 'Shop & Products', hint: '/shop, /product/...', prefixes: ['/shop', '/product'] },
  { key: 'checkout', label: 'Cart & Checkout', hint: '/checkout, /cart', prefixes: ['/checkout', '/cart'] },
  { key: 'dashboard', label: 'Customer Dashboard', hint: '/dashboard', prefixes: ['/dashboard'] },
  { key: 'blog', label: 'Blog', hint: '/blog', prefixes: ['/blog'] },
  { key: 'tools', label: 'Free Tools & CID', hint: '/free-tools, /get-cid, /check-key', prefixes: ['/free-tools', '/get-cid', '/check-key'] },
  { key: 'offers', label: 'Offers & Winners', hint: '/offers, /winners', prefixes: ['/offer', '/winners'] },
  { key: 'affiliate', label: 'Affiliate Portal', hint: '/affiliate', prefixes: ['/affiliate'] },
  { key: 'support', label: 'Support & Contact', hint: '/contact, /help, /refund-request', prefixes: ['/contact', '/help', '/refund-request'] },
  { key: 'pages', label: 'Info & Policy Pages', hint: '/about, /faqs, /privacy...', prefixes: ['/about', '/faqs', '/privacy', '/terms', '/refund-policy', '/return-policy', '/order-policy', '/delivery'] },
  { key: 'payments', label: 'Payment Links', hint: '/pay/...', prefixes: ['/pay', '/payment'] },
];

/** Should this path show the maintenance screen? */
export const isPathUnderMaintenance = (s: MaintenanceSettings, pathname: string) => {
  if (!s.enabled) return false;
  if (s.scope !== 'selected') return true;
  const path = pathname.replace(/\/+$/, '') || '/';
  return (s.areas || []).some((key) => {
    const area = MAINTENANCE_AREAS.find(a => a.key === key);
    if (!area) return false;
    return area.prefixes.some(pre => (pre === '/' ? path === '/' : path === pre || path.startsWith(pre + '/')));
  });
};

export const MAINTENANCE_DEFAULT: MaintenanceSettings = {
  enabled: false,
  scope: 'all',
  areas: [],
  badge: 'Maintenance',
  title: 'We’ll be back very soon',
  message:
    'আমরা আমাদের ওয়েবসাইট আরও দ্রুত, নিরাপদ ও smooth করতে কাজ করছি। কিছুক্ষণের মধ্যেই সব service আবার চালু হয়ে যাবে — আপনার order, license ও wallet সম্পূর্ণ নিরাপদ আছে।',
  eta: 'Expected back online: ১-২ ঘণ্টার মধ্যে',
  showProgress: true,
  progressText: 'কাজ চলছে',
  showContact: true,
  contactHeading: 'Need help right now? সরাসরি WhatsApp-এ যোগাযোগ করুন',
  contactSubtext: 'Order, delivery, license key বা payment — যেকোনো সহায়তার জন্য আমরা 24/7 প্রস্তুত।',
  whatsappLabel: 'Chat on WhatsApp',
  whatsappMessage: 'আসসালামু আলাইকুম, আমি Shahed Store-এ সাপোর্ট চাই।',
  whatsapp: '8801840099853',
  email: 'info@shahedstore.com.bd',
  phone: '01840-099853',
  address: 'Dhaka, Bangladesh',
  showSocial: true,
  facebook: 'https://facebook.com/shahedstorebd',
  website: 'www.shahedstore.com.bd',
  footerText: 'Shahed Store — Genuine Software & Digital Licenses',
};

export const parseMaintenance = (raw?: string | null): MaintenanceSettings => {
  if (!raw) return MAINTENANCE_DEFAULT;
  try {
    return { ...MAINTENANCE_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return MAINTENANCE_DEFAULT;
  }
};

export const useMaintenanceMode = () => {
  const [settings, setSettings] = useState<MaintenanceSettings>(MAINTENANCE_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', MAINTENANCE_KEY)
        .maybeSingle();
      if (!alive) return;
      setSettings(parseMaintenance(data?.value));
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel('maintenance-mode-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: `key=eq.${MAINTENANCE_KEY}` },
        (payload: any) => {
          setSettings(parseMaintenance(payload?.new?.value));
        }
      )
      .subscribe();

    const bc = 'BroadcastChannel' in window ? new BroadcastChannel('maintenance-mode') : null;
    if (bc) bc.onmessage = (e) => { if (e.data) setSettings(parseMaintenance(JSON.stringify(e.data))); };

    const poll = window.setInterval(load, 60000);

    return () => {
      alive = false;
      supabase.removeChannel(channel);
      bc?.close();
      window.clearInterval(poll);
    };
  }, []);

  return { settings, loading };
};
