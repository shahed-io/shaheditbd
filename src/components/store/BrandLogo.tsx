import logoIcon from '@/assets/logo-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const iconSize = size === 'sm' ? 'h-9 w-9'    : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  const textSize = size === 'sm' ? 'text-xl'    : size === 'lg' ? 'text-4xl'  : 'text-2xl';
  const subSize  = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs'   : 'text-[9px]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Glossy Icon Wrapper */}
      <div className="relative flex-shrink-0" style={{ width: iconSize.split(' ')[1]?.replace('w-', '') }}>
        <div
          className={`${iconSize} rounded-2xl flex items-center justify-center relative overflow-hidden`}
          style={{
            background: 'linear-gradient(145deg, hsl(355,90%,55%), hsl(10,100%,48%), hsl(210,90%,50%))',
            boxShadow: '0 0 20px hsla(355,90%,55%,0.6), 0 0 40px hsla(210,90%,55%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.3)',
          }}
        >
          {/* Gloss top shine */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(160deg, hsla(0,0%,100%,0.35) 0%, hsla(0,0%,100%,0.05) 45%, transparent 100%)',
            }}
          />
          <img
            src={logoIcon}
            alt="Shahed Store"
            className="w-[80%] h-[80%] object-contain relative z-10 drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 2px 4px hsla(0,0%,0%,0.4))' }}
          />
        </div>
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: '0 0 0 1px hsla(0,0%,100%,0.15)',
          }}
        />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none select-none">
        <div className={`${textSize} font-black tracking-tight flex items-baseline gap-0`}
          style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #fff 0%, hsl(10,100%,75%) 40%, hsl(355,95%,65%) 70%, hsl(15,100%,60%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 8px hsla(10,100%,60%,0.5))',
            }}
          >
            Shahed
          </span>
          <span
            className="ml-2"
            style={{
              background: 'linear-gradient(135deg, hsl(200,100%,75%) 0%, hsl(210,95%,65%) 50%, hsl(225,90%,70%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 8px hsla(210,100%,60%,0.5))',
            }}
          >
            Store
          </span>
        </div>

        {/* Sub label */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-px flex-1 max-w-[18px] rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(355,80%,60%), transparent)' }} />
          <span
            className={`${subSize} font-bold tracking-[0.18em] uppercase`}
            style={{
              fontFamily: 'Fira Code, monospace',
              background: 'linear-gradient(90deg, hsl(355,80%,70%), hsl(210,80%,70%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            www.shahedstore.com.bd
          </span>
          <div className="h-px flex-1 max-w-[18px] rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(210,80%,60%))' }} />
        </div>
      </div>
    </div>
  );
};

export default BrandLogo;
