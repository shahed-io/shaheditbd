import { useState, useEffect, useRef } from 'react';
import { X, Download, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'install_banner_dismissed';

const InstallBanner = () => {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only on mobile
    if (window.innerWidth >= 768) return;
    // Already standalone
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Already dismissed recently (24h)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    if (ios) {
      // iOS: show after 3s
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') setShow(false);
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] px-3 pb-3 animate-in slide-in-from-bottom duration-400">
      <div
        className="relative mx-auto max-w-md rounded-2xl p-3.5 flex items-center gap-3 shadow-xl"
        style={{
          background: 'hsla(258, 78%, 18%, 0.85)',
          backdropFilter: 'blur(16px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
          border: '1px solid hsla(258, 78%, 55%, 0.25)',
        }}
      >
        {/* App icon */}
        <img
          src="/favicon.png"
          alt="Shahed Store"
          className="w-11 h-11 rounded-xl flex-shrink-0"
          style={{ boxShadow: '0 2px 12px hsla(258,78%,55%,0.4)' }}
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-semibold leading-tight truncate">
            Shahed Store অ্যাপ ইন্সটল করুন
          </p>
          <p className="text-white/55 text-[11px] mt-0.5 leading-tight">
            দ্রুত অ্যাক্সেস ও অর্ডার নোটিফিকেশন পান
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,45%))',
            boxShadow: '0 2px 10px hsla(258,78%,55%,0.4)',
          }}
        >
          <Download size={13} />
          ইন্সটল
        </button>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/15 text-white/70 hover:bg-white/25 transition-colors"
          aria-label="Close"
        >
          <X size={11} />
        </button>
      </div>

      {/* iOS tip tooltip */}
      {showIOSTip && (
        <div
          className="mx-auto max-w-md mt-2 rounded-xl p-3 text-white text-[12px] leading-relaxed animate-in fade-in duration-300"
          style={{
            background: 'hsla(258, 78%, 15%, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid hsla(258, 78%, 55%, 0.2)',
          }}
        >
          <p className="font-semibold mb-1.5 flex items-center gap-1.5">
            <Share2 size={13} /> iOS-এ ইন্সটল করুন:
          </p>
          <p className="flex items-center gap-1.5 text-white/70">
            1. নিচের <Share2 size={12} className="text-blue-400" /> Share বাটনে ক্লিক করুন
          </p>
          <p className="flex items-center gap-1.5 text-white/70 mt-1">
            2. <PlusSquare size={12} className="text-blue-400" /> "Add to Home Screen" সিলেক্ট করুন
          </p>
        </div>
      )}
    </div>
  );
};

export default InstallBanner;
