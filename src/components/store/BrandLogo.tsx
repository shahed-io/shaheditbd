import logoIcon from '@/assets/logo-icon.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const iconSize  = size === 'sm' ? 'h-8 w-8'   : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  const textSize  = size === 'sm' ? 'text-lg'   : size === 'lg' ? 'text-3xl'  : 'text-2xl';
  const subSize   = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-sm'  : 'text-[10px]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon */}
      <div className={`${iconSize} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}
        style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
        <img
          src={logoIcon}
          alt="Shahed Store Icon"
          className="w-[75%] h-[75%] object-contain"
        />
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className={`${textSize} font-extrabold tracking-tight text-white`}
          style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}>
          Shahed
          <span className="ml-1.5" style={{ color: 'hsl(243,75%,70%)' }}>Store</span>
        </span>
        <span className={`${subSize} font-semibold tracking-widest uppercase mt-0.5`}
          style={{ color: 'hsl(243,75%,65%)', fontFamily: 'Fira Code, monospace' }}>
          .com.bd
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;
