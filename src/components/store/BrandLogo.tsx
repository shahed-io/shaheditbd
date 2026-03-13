import logoIcon from '@/assets/logo-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const iconSize = size === 'sm' ? 'h-9 w-9'    : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  const textSize = size === 'sm' ? 'text-xl'    : size === 'lg' ? 'text-4xl'  : 'text-[1.6rem]';
  const subSize  = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs'   : 'text-[9px]';
  const outerBlur = size === 'sm' ? 'inset-[-6px]' : size === 'lg' ? 'inset-[-12px]' : 'inset-[-8px]';
  const ringInset = size === 'sm' ? 'inset-[-2px]' : size === 'lg' ? 'inset-[-3px]'  : 'inset-[-2.5px]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>

      {/* ── Glossy Icon ── */}
      <div className="relative flex-shrink-0 flex items-center justify-center">

        {/* Soft ambient halo — blends into dark navy bg */}
        <div className={`absolute ${outerBlur} rounded-3xl pointer-events-none`}
          style={{
            background: 'radial-gradient(ellipse at center, hsla(15,100%,50%,0.55) 0%, hsla(340,100%,45%,0.35) 45%, hsla(222,40%,8%,0) 100%)',
            filter: 'blur(10px)',
            animation: 'logoPulse 3s ease-in-out infinite',
          }} />

        {/* Crisp gradient border ring */}
        <div className={`absolute ${ringInset} rounded-[22px] pointer-events-none`}
          style={{
            padding: '1.5px',
            background: 'linear-gradient(135deg, hsl(340,100%,58%) 0%, hsl(20,100%,58%) 40%, hsl(38,100%,62%) 65%, hsl(210,90%,58%) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: 0.85,
          }} />

        {/* Icon container */}
        <div className={`${iconSize} rounded-2xl flex items-center justify-center relative overflow-hidden`}
          style={{
            /* Warm red-orange core that fades to dark at edges — matches ref image */
            background: 'radial-gradient(ellipse at 40% 35%, hsl(20,100%,50%) 0%, hsl(340,100%,40%) 45%, hsl(222,30%,14%) 100%)',
            boxShadow: [
              'inset 0 1px 1px hsla(0,0%,100%,0.25)',
              '0 0 18px 4px hsla(15,100%,48%,0.55)',
              '0 0 40px 8px hsla(340,100%,42%,0.3)',
              '0 0 70px 14px hsla(222,40%,6%,0.7)',
            ].join(', '),
          }}>

          {/* Top-left gloss sweep */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(145deg, hsla(0,0%,100%,0.5) 0%, hsla(0,0%,100%,0.08) 30%, transparent 55%)' }} />

          {/* Bottom deep shadow */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ boxShadow: 'inset 0 -6px 14px hsla(0,0%,0%,0.5)' }} />

          <img
            src={logoIcon}
            alt="Shahed Store"
            className="w-[76%] h-[76%] object-contain relative z-10"
            style={{ filter: 'drop-shadow(0 2px 8px hsla(0,0%,0%,0.7)) brightness(1.15)' }}
          />
        </div>
      </div>

      {/* ── Brand Text ── */}
      <div className="flex flex-col leading-none select-none">

        {/* Main name */}
        <div className={`${textSize} font-black flex items-baseline`}
          style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.025em' }}>

          {/* "Shahed" — amber-gold that pairs with the warm icon */}
          <span style={{
            background: 'linear-gradient(135deg, hsl(45,100%,92%) 0%, hsl(38,100%,72%) 40%, hsl(25,100%,60%) 75%, hsl(15,100%,52%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px hsla(20,100%,60%,0.75)) drop-shadow(0 2px 5px hsla(0,0%,0%,0.6))',
          }}>
            Shahed
          </span>

          {/* "Store" — cool indigo-blue complements dark navy bg */}
          <span className="ml-[0.3em]" style={{
            background: 'linear-gradient(135deg, hsl(210,100%,92%) 0%, hsl(210,100%,72%) 35%, hsl(222,90%,60%) 70%, hsl(243,85%,55%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px hsla(222,90%,65%,0.8)) drop-shadow(0 2px 5px hsla(0,0%,0%,0.6))',
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
              background: 'linear-gradient(90deg, hsl(38,100%,78%), hsl(210,90%,72%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            shahedstore.com.bd
          </span>
          <div className="h-[1.5px] w-5 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(222,90%,60%))' }} />
        </div>
      </div>
    </div>
  );
};

export default BrandLogo;
