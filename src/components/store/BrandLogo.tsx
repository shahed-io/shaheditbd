import logoMain from '@/assets/logo-main.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const height = size === 'sm' ? 'h-10' : size === 'lg' ? 'h-16' : 'h-12';

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoMain}
        alt="Shahed Store"
        className={`${height} w-auto object-contain`}
      />
    </div>
  );
};

export default BrandLogo;
