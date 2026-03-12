import logoIcon from '@/assets/logo-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const iconSize = size === 'sm' ? 'h-9 w-9'    : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  const textSize = size === 'sm' ? 'text-xl'    : size === 'lg' ? 'text-4xl'  : 'text-[1.6rem]';
  const subSize  = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs'   : 'text-[9px]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>

      {/* ── Glossy Icon ── */}
      <div className={`${iconSize} rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0`}
        style={{
          background: 'linear-gradient(145deg, hsl(340,100%,50%) 0%, hsl(15,100%,52%) 40%, hsl(35,100%,55%) 70%, hsl(210,100%,52%) 100%)',
          boxShadow: '0 0 0 1.5px hsla(0,0%,100%,0.25), 0 4px 20px hsla(10,100%,55%,0.7), 0 8px 40px hsla(210,100%,55%,0.4)',
        }}>
        {/* Top shine */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(160deg, hsla(0,0%,100%,0.45) 0%, hsla(0,0%,100%,0.08) 40%, transparent 100%)' }} />
        {/* Bottom inner shadow */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ boxShadow: 'inset 0 -4px 10px hsla(0,0%,0%,0.3)' }} />
        <img
          src={logoIcon}
          alt="Shahed Store"
          className="w-[78%] h-[78%] object-contain relative z-10"
          style={{ filter: 'drop-shadow(0 2px 6px hsla(0,0%,0%,0.5)) brightness(1.05)' }}
        />
      </div>

      {/* ── Brand Text ── */}
      <div className="flex flex-col leading-none select-none">

        {/* Main name */}
        <div className={`${textSize} font-black flex items-baseline`}
          style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.025em' }}>

          {/* "Shahed" — bright white with warm gold shimmer */}
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #ffe0b2 45%, #ffab40 75%, #ff6d00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 10px hsla(25,100%,65%,0.8)) drop-shadow(0 2px 4px hsla(0,0%,0%,0.5))',
          }}>
            Shahed
          </span>

          {/* "Store" — vivid electric blue */}
          <span className="ml-2" style={{
            background: 'linear-gradient(135deg, #e0f7ff 0%, #40c4ff 40%, #0091ea 75%, #0057e7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 10px hsla(200,100%,60%,0.9)) drop-shadow(0 2px 4px hsla(0,0%,0%,0.5))',
          }}>
            Store
          </span>
        </div>

        {/* Sub tagline */}
        <div className="flex items-center gap-1.5 mt-[5px]">
          <div className="h-[1.5px] w-4 rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(25,100%,60%), transparent)' }} />
          <span className={`${subSize} font-semibold tracking-[0.15em] uppercase`}
            style={{
              fontFamily: 'Fira Code, monospace',
              color: 'hsl(40,100%,80%)',
              textShadow: '0 0 8px hsla(40,100%,60%,0.7)',
            }}>
            shahedstore.com.bd
          </span>
          <div className="h-[1.5px] w-4 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(200,100%,60%))' }} />
        </div>
      </div>
    </div>
  );
};

export default BrandLogo;
