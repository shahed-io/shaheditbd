const BrandLoader = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const dims = { sm: { logo: 32, ring: 44 }, md: { logo: 48, ring: 64 }, lg: { logo: 56, ring: 76 } }[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative" style={{ width: dims.ring, height: dims.ring }}>
        {/* Orbiting ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'hsl(258,78%,55%)',
            borderRightColor: 'hsla(42,96%,58%,0.4)',
            animation: 'brand-orbit 1s linear infinite',
          }}
        />
        {/* Logo */}
        <img
          src="/pwa-512.png"
          alt=""
          className="absolute rounded-xl object-cover"
          style={{
            width: dims.logo,
            height: dims.logo,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'brand-breathe 1.6s ease-in-out infinite',
            filter: 'drop-shadow(0 0 8px hsla(258,78%,55%,0.25))',
          }}
        />
      </div>
      <style>{`
        @keyframes brand-orbit { to { transform: rotate(360deg); } }
        @keyframes brand-breathe {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.85; }
          50% { transform: translate(-50%,-50%) scale(1.06); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BrandLoader;
