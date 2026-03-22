import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

const STORAGE_KEY = 'popup_banner_last_shown';

const PopupBanner = () => {
  const [visible, setVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    fetchAndDecide();
  }, []);

  const fetchAndDecide = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['popup_enabled', 'popup_image_url', 'popup_link_url', 'popup_show_frequency']);

      if (!data) return;

      const map: Record<string, string> = {};
      data.forEach(r => { map[r.key] = r.value ?? ''; });

      if (map['popup_enabled'] !== 'true') return;
      if (!map['popup_image_url']) return;

      const frequency = map['popup_show_frequency'] ?? 'once_per_day';
      const stored = localStorage.getItem(STORAGE_KEY);

      let shouldShow = false;

      if (frequency === 'always') {
        shouldShow = true;
      } else if (frequency === 'once_per_session') {
        shouldShow = !sessionStorage.getItem(STORAGE_KEY);
      } else if (frequency === 'once_per_day') {
        if (!stored) {
          shouldShow = true;
        } else {
          const lastShown = new Date(stored);
          const now = new Date();
          const diffMs = now.getTime() - lastShown.getTime();
          shouldShow = diffMs > 24 * 60 * 60 * 1000;
        }
      }

      if (shouldShow) {
        setImageUrl(map['popup_image_url']);
        setLinkUrl(map['popup_link_url'] ?? '');
        // Small delay so page loads first
        setTimeout(() => setVisible(true), 1000);
      }
    } catch {
      // silently fail
    }
  };

  const handleClose = () => {
    setVisible(false);
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    sessionStorage.setItem(STORAGE_KEY, now);
  };

  if (!visible || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={handleClose}
    >
      <div
        className="relative max-w-md w-full animate-in zoom-in-95 fade-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-110"
          style={{ background: 'hsl(258,78%,55%)', color: 'white' }}
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Banner image */}
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '2px solid hsla(258,78%,75%,0.25)' }}>
          {linkUrl ? (
            <a href={linkUrl} onClick={handleClose} target={linkUrl.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
              <img
                src={imageUrl}
                alt="Promotional Banner"
                className="w-full block cursor-pointer"
                loading="eager"
              />
            </a>
          ) : (
            <img
              src={imageUrl}
              alt="Promotional Banner"
              className="w-full block"
              loading="eager"
            />
          )}
        </div>

        {/* Click outside hint */}
        <p className="text-center text-white/50 text-[11px] mt-3">
          বাইরে ক্লিক করলে বন্ধ হবে
        </p>
      </div>
    </div>
  );
};

export default PopupBanner;
