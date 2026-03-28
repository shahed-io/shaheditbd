import { useState, useEffect } from 'react';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('fade'), 1800);
    const t3 = setTimeout(() => onFinish(), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(145deg, hsl(258, 78%, 20%) 0%, hsl(226, 35%, 10%) 50%, hsl(258, 78%, 15%) 100%)',
      }}
    >
      {/* Glow backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(258, 78%, 55%), transparent 70%)',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Logo */}
      <div
        className={`relative transition-all duration-700 ease-out ${
          phase === 'logo' ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="relative">
          {/* Ring animation */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{
              border: '2px solid hsl(42, 96%, 58%)',
              animationDuration: '1.5s',
              margin: '-8px',
            }}
          />
          <img
            src="/favicon.png"
            alt="Shahed Store"
            className="w-24 h-24 rounded-2xl shadow-2xl"
            style={{
              boxShadow: '0 0 40px hsl(258, 78%, 55%, 0.4), 0 0 80px hsl(258, 78%, 55%, 0.2)',
            }}
          />
        </div>
      </div>

      {/* Brand name */}
      <div
        className={`mt-6 transition-all duration-500 delay-200 ${
          phase === 'text' || phase === 'fade' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1
          className="text-2xl font-black tracking-tight"
          style={{
            fontFamily: 'Sora, sans-serif',
            background: 'linear-gradient(135deg, #fff 0%, hsl(42, 96%, 65%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Shahed Store
        </h1>
        <p className="text-center text-xs mt-1 text-white/50 tracking-widest uppercase">
          Your Trusted Digital Shop
        </p>
      </div>

      {/* Loading dots */}
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
