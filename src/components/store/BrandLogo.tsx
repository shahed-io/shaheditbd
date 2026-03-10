interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const badge = size === 'sm' ? 'w-8 h-8 text-[15px]' : size === 'lg' ? 'w-12 h-12 text-[22px]' : 'w-10 h-10 text-[18px]';
  const name  = size === 'sm' ? 'text-[16px]' : size === 'lg' ? 'text-[26px]' : 'text-[21px]';
  const sub   = size === 'sm' ? 'text-[9px]'  : size === 'lg' ? 'text-[13px]' : 'text-[11px]';

  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      {/* Glowing S badge */}
      <div
        className={`relative ${badge} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))',
          boxShadow: '0 4px 18px hsla(243,75%,59%,0.55)',
        }}
      >
        <span
          className="text-white font-black leading-none relative z-10"
          style={{ fontFamily: 'Sora, sans-serif', textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}
        >
          S
        </span>
        {/* shine */}
        <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 55%)' }} />
      </div>

      {/* Text block */}
      <div className="flex flex-col leading-none gap-[3px]">
        <span
          className={`font-black tracking-tight leading-none ${name}`}
          style={{
            fontFamily: 'Sora, sans-serif',
            background: 'linear-gradient(90deg, hsl(260,80%,78%) 0%, hsl(220,90%,88%) 45%, hsl(38,100%,64%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Shahed
        </span>
        <span
          className={`font-bold tracking-[0.22em] uppercase leading-none ${sub}`}
          style={{ fontFamily: 'Fira Code, monospace', color: 'hsla(255,60%,80%,0.65)' }}
        >
          Store
        </span>
      </div>

      {/* amber spark */}
      <span
        className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
        style={{ background: 'hsl(38,100%,58%)', boxShadow: '0 0 7px hsl(38,100%,58%)' }}
      />
    </div>
  );
};

export default BrandLogo;
