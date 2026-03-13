import logoIcon from '@/assets/logo-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const iconSize  = size === 'sm' ? 'h-9 w-9'     : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  const textSize  = size === 'sm' ? 'text-lg'      : size === 'lg' ? 'text-3xl'  : 'text-[1.45rem]';
  const subSize   = size === 'sm' ? 'text-[7.5px]' : size === 'lg' ? 'text-[11px]' : 'text-[9px]';
  const radius    = size === 'sm' ? 'rounded-xl'   : size === 'lg' ? 'rounded-2xl' : 'rounded-[14px]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>

      {/* ── Icon box — dark rounded square, like reference ── */}
      <div
        className={`${iconSize} ${radius} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}
        style={{
          background: 'linear-gradient(145deg, hsl(222,25%,14%) 0%, hsl(222,30%,10%) 100%)',
          boxShadow: '0 0 0 1px hsla(0,0%,100%,0.08), 0 4px 16px hsla(222,40%,5%,0.55)',
        }}
      >
        {/* subtle inner gloss top */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(160deg, hsla(0,0%,100%,0.07) 0%, transparent 50%)' }} />

        <img
          src={logoIcon}
          alt="Shahed Store"
          className="w-[68%] h-[68%] object-contain relative z-10"
          style={{ filter: 'drop-shadow(0 1px 4px hsla(0,0%,0%,0.6))' }}
        />
      </div>

      {/* ── Brand Text ── */}
      <div className="flex flex-col leading-none select-none gap-[5px]">

        {/* Main name — single clean gradient like ref */}
        <span
          className={`${textSize} font-bold tracking-tight`}
          style={{
            fontFamily: 'Sora, sans-serif',
            background: 'linear-gradient(90deg, hsl(38,95%,70%) 0%, hsl(25,100%,64%) 40%, hsl(210,90%,68%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Shahed Store
        </span>

        {/* Sub tagline */}
        <span
          className={`${subSize} tracking-[0.18em] uppercase font-medium`}
          style={{
            fontFamily: 'Fira Code, monospace',
            color: 'hsla(210,60%,70%,0.65)',
            letterSpacing: '0.16em',
          }}
        >
          shahedstore.com.bd
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;
