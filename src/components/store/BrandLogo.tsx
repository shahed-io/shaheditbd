import logoIcon from '@/assets/logo-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const iconSize = size === 'sm' ? 'h-8 w-8'   : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  const textSize = size === 'sm' ? 'text-lg'   : size === 'lg' ? 'text-3xl'  : 'text-xl';
  const subSize  = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs'  : 'text-[9px]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Icon */}
      <img
        src={logoIcon}
        alt="Shahed Store"
        className={`${iconSize} object-contain flex-shrink-0`}
      />

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span
          className={`${textSize} font-extrabold tracking-tight`}
          style={{
            fontFamily: 'Sora, sans-serif',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #fff 0%, hsl(10,90%,60%) 55%, hsl(210,90%,60%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Shahed Store
        </span>
        <span
          className={`${subSize} font-bold tracking-widest uppercase mt-0.5`}
          style={{ color: 'hsl(210,80%,65%)', fontFamily: 'Fira Code, monospace' }}
        >
          .com.bd
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;
