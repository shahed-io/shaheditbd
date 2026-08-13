import { useEffect, useState } from 'react';
import { Wrench, Clock, MessageCircle, Mail, ShieldCheck } from 'lucide-react';
import type { MaintenanceSettings } from '@/hooks/useMaintenanceMode';

const MaintenanceScreen = ({ settings }: { settings: MaintenanceSettings }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t = window.setInterval(() => setDots(d => (d.length >= 3 ? '' : d + '.')), 500);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-16 relative overflow-hidden"
      style={{ background: 'radial-gradient(120% 100% at 50% 0%, hsl(0,0%,11%) 0%, hsl(0,0%,5%) 45%, hsl(0,0%,2%) 100%)' }}
    >
      {/* Glossy sheen */}
      <div
        className="absolute inset-x-0 top-0 h-[45vh] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, hsla(0,0%,100%,0.07) 0%, transparent 100%)' }}
      />
      {/* Ambient glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] max-w-[820px] max-h-[820px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'radial-gradient(circle, hsla(45,80%,60%,0.10) 0%, transparent 65%)' }}
      />
      {/* Fine grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(hsla(0,0%,100%,0.06) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.06) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(70% 60% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 40%, black, transparent)',
        }}
      />

      <div
        className="relative w-full max-w-[620px] rounded-[28px] px-7 py-12 sm:px-12 sm:py-14 text-center"
        style={{
          background: 'linear-gradient(160deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 40%, hsla(0,0%,100%,0.04) 100%)',
          border: '1px solid hsla(0,0%,100%,0.12)',
          boxShadow: '0 40px 90px -30px hsla(0,0%,0%,0.9), inset 0 1px 0 hsla(0,0%,100%,0.16)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {/* Top hairline */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(45,90%,70%,0.7), transparent)' }}
        />

        {/* Icon medallion */}
        <div
          className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
          style={{
            background: 'linear-gradient(150deg, hsla(0,0%,100%,0.14), hsla(0,0%,100%,0.03))',
            border: '1px solid hsla(0,0%,100%,0.16)',
            boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25), 0 18px 40px -18px hsla(45,90%,60%,0.35)',
          }}
        >
          <Wrench size={30} style={{ color: 'hsl(45,90%,70%)' }} strokeWidth={1.6} />
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.18em] uppercase mb-6"
          style={{
            background: 'hsla(45,90%,60%,0.10)',
            border: '1px solid hsla(45,90%,60%,0.28)',
            color: 'hsl(45,90%,72%)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(45,90%,65%)' }} />
          Maintenance
        </div>

        <h1
          className="text-[26px] sm:text-[34px] font-bold leading-tight mb-4"
          style={{
            background: 'linear-gradient(180deg, hsl(0,0%,100%) 0%, hsl(0,0%,72%) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {settings.title}
        </h1>

        <p className="text-[15px] leading-relaxed max-w-[440px] mx-auto" style={{ color: 'hsla(0,0%,100%,0.62)' }}>
          {settings.message}
        </p>

        {settings.eta && (
          <div
            className="inline-flex items-center gap-2 mt-7 px-4 py-2.5 rounded-xl text-[13px]"
            style={{
              background: 'hsla(0,0%,100%,0.05)',
              border: '1px solid hsla(0,0%,100%,0.10)',
              color: 'hsla(0,0%,100%,0.8)',
            }}
          >
            <Clock size={14} style={{ color: 'hsl(45,90%,70%)' }} />
            {settings.eta}
          </div>
        )}

        {/* Progress shimmer */}
        <div className="mt-9 h-[3px] w-full rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,100%,0.08)' }}>
          <div
            className="h-full w-1/3 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(45,90%,68%), transparent)',
              animation: 'maintenance-sweep 2.2s ease-in-out infinite',
            }}
          />
        </div>
        <div className="mt-3 text-[12px] tracking-wide" style={{ color: 'hsla(0,0%,100%,0.38)' }}>
          কাজ চলছে{dots}
        </div>

        {settings.showContact && (settings.whatsapp || settings.email) && (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, hsla(0,0%,100%,0.14), hsla(0,0%,100%,0.05))',
                  border: '1px solid hsla(0,0%,100%,0.16)',
                  color: 'hsl(0,0%,96%)',
                }}
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'hsla(0,0%,100%,0.04)',
                  border: '1px solid hsla(0,0%,100%,0.12)',
                  color: 'hsla(0,0%,100%,0.85)',
                }}
              >
                <Mail size={15} /> {settings.email}
              </a>
            )}
          </div>
        )}

        <div
          className="mt-10 pt-6 flex items-center justify-center gap-2 text-[11px] tracking-[0.14em] uppercase"
          style={{ borderTop: '1px solid hsla(0,0%,100%,0.08)', color: 'hsla(0,0%,100%,0.35)' }}
        >
          <ShieldCheck size={13} /> Shahed Store
        </div>
      </div>

      <style>{`
        @keyframes maintenance-sweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
      `}</style>
    </div>
  );
};

export default MaintenanceScreen;
