import logoIcon from '@/assets/logo-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const iconSize = size === 'sm' ? 36  : size === 'lg' ? 56  : 46;
  const textSize = size === 'sm' ? 'text-[1.1rem]' : size === 'lg' ? 'text-[1.9rem]' : 'text-[1.5rem]';
  const radius   = size === 'sm' ? 12  : size === 'lg' ? 16  : 13;

  return (
    <div className={`flex items-center gap-3 ${className}`}>

      {/* ── Icon — Adobe-style dark box with gradient border ring ── */}
      <div
        className="relative flex-shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Gradient border ring */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: radius + 2,
            padding: 1.5,
            background: 'linear-gradient(145deg, hsl(160,80%,52%) 0%, hsl(180,75%,45%) 35%, hsl(210,85%,55%) 65%, hsl(243,75%,58%) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Dark icon body */}
        <div
          className="absolute inset-[1.5px] flex items-center justify-center overflow-hidden"
          style={{
            borderRadius: radius,
            background: 'linear-gradient(150deg, hsl(215,30%,14%) 0%, hsl(220,35%,9%) 100%)',
            boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.07), inset 0 -1px 0 hsla(0,0%,0%,0.3)',
          }}
        >
          {/* Top gloss shine */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(160deg, hsla(0,0%,100%,0.09) 0%, transparent 45%)',
              borderRadius: radius,
            }}
          />

          <img
            src={logoIcon}
            alt="Shahed Store"
            className="object-contain relative z-10"
            style={{
              width: '66%',
              height: '66%',
              filter: 'drop-shadow(0 1px 5px hsla(0,0%,0%,0.65)) brightness(1.05)',
            }}
          />
        </div>
      </div>

      {/* ── Brand Text — two-color like reference ── */}
      <div className="leading-none select-none" style={{ fontFamily: 'Sora, sans-serif' }}>
        <span
          className={`${textSize} font-bold tracking-tight`}
        >
          {/* "Shahed" — teal/cyan */}
          <span style={{ color: 'hsl(168, 80%, 52%)' }}>Shahed </span>
          {/* "Store" — white */}
          <span style={{ color: 'hsl(0, 0%, 94%)' }}>Store</span>
        </span>
      </div>

    </div>
  );
};

export default BrandLogo;
