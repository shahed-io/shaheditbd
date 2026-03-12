import logoMain from '@/assets/logo-main.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const height = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-14' : 'h-11';

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoMain}
        alt="Shahed Store"
        className={`${height} w-auto object-contain`}
        style={{
          filter: size === 'lg'
            ? 'drop-shadow(0 0 18px hsla(15,100%,55%,0.55)) drop-shadow(0 0 40px hsla(243,75%,59%,0.35)) brightness(1.08)'
            : 'drop-shadow(0 0 10px hsla(15,100%,55%,0.5)) drop-shadow(0 0 24px hsla(243,75%,59%,0.3)) brightness(1.05)',
        }}
      />
    </div>
  );
};

export default BrandLogo;
