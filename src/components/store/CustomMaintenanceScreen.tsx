import type { MaintenanceSettings } from '@/hooks/useMaintenanceMode';

/**
 * Admin-uploaded custom maintenance design.
 * - mode "html": renders the raw HTML/CSS the admin wrote (admin-only authored content)
 * - mode "theme": renders a simple, fully colour/text-configurable layout
 */
const CustomMaintenanceScreen = ({ settings }: { settings: MaintenanceSettings }) => {
  if (settings.customMode === 'html') {
    return (
      <div className="min-h-screen w-full">
        {settings.customCss && <style>{settings.customCss}</style>}
        <div dangerouslySetInnerHTML={{ __html: settings.customHtml || '' }} />
      </div>
    );
  }

  const btnHref =
    settings.customButtonUrl ||
    (settings.whatsapp
      ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          settings.whatsappMessage || 'Hello, I need support.'
        )}`
      : '');

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-14"
      style={{
        background: `linear-gradient(160deg, ${settings.customBgFrom}, ${settings.customBgTo})`,
        color: settings.customTextColor,
        fontFamily: settings.customFont || undefined,
      }}
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      <div
        className="w-full max-w-[640px] text-center px-6 py-12 sm:px-12"
        style={{
          background: settings.customCardBg,
          borderRadius: `${settings.customRadius ?? 28}px`,
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 30px 80px -40px rgba(0,0,0,0.6)',
        }}
      >
        {settings.customShowLogo && settings.customLogo && (
          <img
            src={settings.customLogo}
            alt="Maintenance"
            className="mx-auto mb-7 max-h-[160px] w-auto object-contain"
            loading="eager"
          />
        )}

        {settings.badge && (
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase mb-5"
            style={{ background: `${settings.customAccent}22`, border: `1px solid ${settings.customAccent}55`, color: settings.customAccent }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: settings.customAccent }} />
            {settings.badge}
          </div>
        )}

        {settings.customHeadline && (
          <h1 className="text-[26px] sm:text-[36px] font-extrabold leading-tight mb-4">{settings.customHeadline}</h1>
        )}

        {settings.customBody && (
          <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: settings.customMutedColor }}>
            {settings.customBody}
          </p>
        )}

        {btnHref && settings.customButtonLabel && (
          <a
            href={btnHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center px-8 py-4 rounded-2xl text-[15px] font-bold transition-transform hover:-translate-y-0.5"
            style={{ background: settings.customAccent, color: '#fff', boxShadow: `0 18px 38px -16px ${settings.customAccent}` }}
          >
            {settings.customButtonLabel}
          </a>
        )}

        {settings.customFooter && (
          <div className="mt-10 text-[12px]" style={{ color: settings.customMutedColor }}>
            {settings.customFooter}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomMaintenanceScreen;
