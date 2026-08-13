import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const MAINTENANCE_KEY = 'maintenance_mode';

export type MaintenanceSettings = {
  enabled: boolean;
  title: string;
  message: string;
  eta: string;
  showContact: boolean;
  whatsapp: string;
  email: string;
};

export const MAINTENANCE_DEFAULT: MaintenanceSettings = {
  enabled: false,
  title: 'সাইট রক্ষণাবেক্ষণ চলছে',
  message: 'আমরা আমাদের ওয়েবসাইট আরও দ্রুত ও নিরাপদ করতে কাজ করছি। কিছুক্ষণের মধ্যেই আবার ফিরে আসছি।',
  eta: '',
  showContact: true,
  whatsapp: '',
  email: '',
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
