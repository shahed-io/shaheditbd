import { useEffect, useState } from 'react';
import { Clock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import type { MaintenanceSettings } from '@/hooks/useMaintenanceMode';
import mascot from '@/assets/maintenance-mascot.png';

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.437-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
  </svg>
);

const MaintenanceScreen = ({ settings }: { settings: MaintenanceSettings }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t = window.setInterval(() => setDots(d => (d.length >= 3 ? '' : d + '.')), 500);
    return () => window.clearInterval(t);
  }, []);

  const waHref = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি Shahed Store-এ সাপোর্ট চাই।')}`
    : '';

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-5 py-14 relative overflow-hidden bg-[hsl(220,40%,98%)]">
      {/* Soft ambient blobs */}
      <div
        className="absolute -top-32 -left-24 w-[52vw] h-[52vw] max-w-[620px] max-h-[620px] rounded-full pointer-events-none blur-3xl opacity-70"
        style={{ background: 'radial-gradient(circle, hsla(258,90%,70%,0.18) 0%, transparent 68%)' }}
      />
      <div
        className="absolute -bottom-40 -right-24 w-[52vw] h-[52vw] max-w-[620px] max-h-[620px] rounded-full pointer-events-none blur-3xl opacity-70"
        style={{ background: 'radial-gradient(circle, hsla(186,90%,60%,0.18) 0%, transparent 68%)' }}
      />
      {/* Fine dotted grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(hsla(226,30%,60%,0.18) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(75% 65% at 50% 45%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(75% 65% at 50% 45%, black, transparent)',
        }}
      />

      <div
        className="relative w-full max-w-[640px] rounded-[32px] px-6 py-10 sm:px-12 sm:py-12 text-center maint-card"
        style={{
          background: 'hsla(0,0%,100%,0.78)',
          border: '1px solid hsla(226,30%,80%,0.55)',
          boxShadow: '0 30px 70px -30px hsla(226,45%,35%,0.28), inset 0 1px 0 hsla(0,0%,100%,0.9)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
        }}
      >
        {/* Gradient hairline */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-2/3 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(258,85%,66%), hsl(186,85%,55%), transparent)' }}
        />

        {/* Animated cartoon */}
        <div className="relative mx-auto w-[190px] sm:w-[230px] mb-6">
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-1 w-[62%] h-4 rounded-full blur-md maint-shadow"
            style={{ background: 'hsla(226,40%,45%,0.22)' }}
          />
          <img
            src={mascot}
            alt="Shahed Store maintenance mascot — a cartoon technician waving with a wrench"
            width={230}
            height={230}
            loading="eager"
            className="relative w-full h-auto maint-float select-none pointer-events-none"
            draggable={false}
          />
          {/* Sparkles */}
          <Sparkles size={18} className="absolute top-2 -left-1 text-[hsl(42,96%,55%)] maint-twinkle" />
          <Sparkles size={14} className="absolute top-10 -right-1 text-[hsl(258,80%,68%)] maint-twinkle maint-delay-1" />
          <Sparkles size={12} className="absolute bottom-14 -left-3 text-[hsl(186,80%,50%)] maint-twinkle maint-delay-2" />
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase mb-5"
          style={{
            background: 'hsla(258,85%,66%,0.10)',
            border: '1px solid hsla(258,85%,66%,0.28)',
            color: 'hsl(258,70%,52%)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(258,85%,62%)' }} />
          Maintenance
        </div>

        <h1 className="text-[24px] sm:text-[34px] font-extrabold leading-tight mb-3 text-[hsl(226,40%,16%)]">
          {settings.title}
        </h1>

        <p className="text-[15px] leading-relaxed max-w-[460px] mx-auto text-[hsl(226,18%,45%)]">
          {settings.message}
        </p>

        {settings.eta && (
          <div
            className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-xl text-[13px] font-medium"
            style={{
              background: 'hsla(42,96%,58%,0.12)',
              border: '1px solid hsla(42,96%,52%,0.3)',
              color: 'hsl(36,70%,36%)',
            }}
          >
            <Clock size={14} />
            {settings.eta}
          </div>
        )}

        {/* Progress shimmer */}
        <div className="mt-8 h-[6px] w-full rounded-full overflow-hidden" style={{ background: 'hsla(226,30%,88%,0.9)' }}>
          <div
            className="h-full w-1/3 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(258,85%,66%), hsl(186,85%,55%), transparent)',
              animation: 'maintenance-sweep 2.2s ease-in-out infinite',
            }}
          />
        </div>
        <div className="mt-3 text-[12px] tracking-wide text-[hsl(226,15%,58%)]">কাজ চলছে{dots}</div>

        {settings.showContact && settings.whatsapp && (
          <div className="mt-9">
            <p className="text-[14px] font-semibold text-[hsl(226,30%,25%)]">
              জরুরি প্রয়োজনে সরাসরি আমাদের WhatsApp নম্বরে যোগাযোগ করুন
            </p>
            <p className="mt-1 text-[13px] text-[hsl(226,18%,50%)]">
              অর্ডার, ডেলিভারি বা যেকোনো সহায়তার জন্য আমরা সবসময় প্রস্তুত।
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 maint-cta"
              style={{
                background: 'linear-gradient(135deg, hsl(142,70%,42%), hsl(152,68%,36%))',
                boxShadow: '0 16px 34px -14px hsla(142,70%,35%,0.75)',
              }}
            >
              <WhatsAppIcon size={20} />
              WhatsApp-এ যোগাযোগ করুন
            </a>
            <div className="mt-2 text-[13px] font-semibold tracking-wide text-[hsl(142,55%,32%)]">
              {settings.whatsapp}
            </div>
          </div>
        )}

        {settings.showContact && settings.email && (
          <div className="mt-5">
            <a
              href={`mailto:${settings.email}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
              style={{
                background: 'hsla(226,40%,96%,0.9)',
                border: '1px solid hsla(226,30%,82%,0.8)',
                color: 'hsl(226,25%,35%)',
              }}
            >
              <Mail size={15} /> {settings.email}
            </a>
          </div>
        )}

        <div
          className="mt-9 pt-6 flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ borderTop: '1px solid hsla(226,30%,88%,0.9)', color: 'hsl(226,15%,58%)' }}
        >
          <ShieldCheck size={13} /> Shahed Store
        </div>
      </div>

      <style>{`
        @keyframes maintenance-sweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
        @keyframes maint-float {
          0%, 100% { transform: translateY(0) rotate(-1.2deg); }
          50%      { transform: translateY(-12px) rotate(1.2deg); }
        }
        @keyframes maint-shadow {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: .45; }
          50%      { transform: translateX(-50%) scaleX(0.82); opacity: .25; }
        }
        @keyframes maint-twinkle {
          0%, 100% { opacity: .25; transform: scale(0.85) rotate(0deg); }
          50%      { opacity: 1;   transform: scale(1.15) rotate(15deg); }
        }
        @keyframes maint-card-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .maint-card    { animation: maint-card-in .6s ease-out both; }
        .maint-float   { animation: maint-float 4.5s ease-in-out infinite; }
        .maint-shadow  { animation: maint-shadow 4.5s ease-in-out infinite; }
        .maint-twinkle { animation: maint-twinkle 2.4s ease-in-out infinite; }
        .maint-delay-1 { animation-delay: .7s; }
        .maint-delay-2 { animation-delay: 1.4s; }
        .maint-cta     { animation: maint-card-in .6s ease-out .2s both; }
        @media (prefers-reduced-motion: reduce) {
          .maint-card, .maint-float, .maint-shadow, .maint-twinkle, .maint-cta { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MaintenanceScreen;
