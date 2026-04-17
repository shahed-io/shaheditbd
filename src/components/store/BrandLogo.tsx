import { forwardRef } from 'react';
import logoIcon from '@/assets/logo-icon.webp';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = forwardRef<HTMLDivElement, BrandLogoProps>(({ size = 'md', className = '' }, ref) => {
  const iconSize = size === 'sm' ? 'h-9 w-9'    : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  const textSize = size === 'sm' ? 'text-xl'    : size === 'lg' ? 'text-4xl'  : 'text-[1.6rem]';
  const subSize  = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs'   : 'text-[9px]';

  return (
    <div ref={ref} className={`flex items-center gap-3 ${className}`}>

      {/* ── Icon ── */}
      <div className="relative flex-shrink-0 flex items-center justify-center">

        {/* Subtle colored ring */}
        <div className="absolute inset-[-2px] rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, hsl(42,96%,58%), hsl(25,100%,55%), hsl(258,78%,60%), hsl(210,90%,60%))',
            borderRadius: '18px',
            padding: '1.5px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }} />

        {/* Icon container — white glass with soft gradient */}
        <div className={`${iconSize} rounded-2xl flex items-center justify-center relative overflow-hidden`}
          style={{
            background: 'linear-gradient(145deg, hsl(0,0%,100%) 0%, hsl(42,80%,96%) 40%, hsl(258,60%,96%) 100%)',
            boxShadow: '0 4px 20px hsla(258,60%,60%,0.15), 0 1px 6px hsla(42,96%,58%,0.12), inset 0 1px 0 hsla(0,0%,100%,0.9)',
            border: '1px solid hsla(258,60%,80%,0.2)',
          }}>

          {/* Top-left gloss */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(145deg, hsla(0,0%,100%,0.45) 0%, hsla(0,0%,100%,0.06) 35%, transparent 55%)' }} />

          <img
            src={logoIcon}
            alt="Shahed Store"
            width={48}
            height={48}
            decoding="async"
            fetchPriority="high"
            className="w-[76%] h-[76%] object-contain relative z-10"
            style={{ filter: 'brightness(0.9) saturate(1.2) drop-shadow(0 1px 3px hsla(258,78%,40%,0.25))' }}
          />
        </div>
      </div>

      {/* ── Brand Text ── */}
      <div className="flex flex-col leading-none select-none">

        {/* Main name */}
        <div className={`${textSize} font-black flex items-baseline`}
          style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.025em' }}>

          {/* "Shahed" — warm orange-amber */}
          <span style={{
            background: 'linear-gradient(135deg, hsl(25,100%,58%) 0%, hsl(38,100%,52%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Shahed
          </span>

          {/* "Store" — indigo-blue */}
          <span className="ml-[0.3em]" style={{
            background: 'linear-gradient(135deg, hsl(210,90%,52%) 0%, hsl(243,80%,55%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Store
          </span>
        </div>

        {/* Sub tagline */}
        <div className="flex items-center gap-1.5 mt-[5px]">
          <div className="h-[1.5px] w-5 rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(20,100%,58%), transparent)' }} />
          <span className={`${subSize} font-semibold tracking-[0.14em] uppercase`}
            style={{
              fontFamily: 'Fira Code, monospace',
              color: 'hsl(220,15%,52%)',
            }}>
            shahedstore.com.bd
          </span>
          <div className="h-[1.5px] w-5 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(222,90%,60%))' }} />
        </div>
      </div>
    </div>
  );
});

BrandLogo.displayName = 'BrandLogo';

export default BrandLogo;
