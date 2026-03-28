import { useState, useEffect } from 'react';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<'enter' | 'glow' | 'text' | 'fade'>('enter');

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('glow'), 300);
    const t1 = setTimeout(() => setPhase('text'), 900);
    const t2 = setTimeout(() => setPhase('fade'), 2200);
    const t3 = setTimeout(() => onFinish(), 2700);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(145deg, hsl(258, 78%, 18%) 0%, hsl(226, 40%, 8%) 50%, hsl(258, 78%, 14%) 100%)',
      }}
    >
      {/* Animated glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-3xl transition-all duration-1000"
          style={{
            width: '320px', height: '320px',
            background: 'radial-gradient(circle, hsla(258, 78%, 55%, 0.35), transparent 70%)',
            top: '25%', left: '50%',
            transform: `translate(-50%, -50%) scale(${phase === 'enter' ? 0.5 : 1})`,
            opacity: phase === 'enter' ? 0 : 0.6,
          }}
        />
        <div
          className="absolute rounded-full blur-3xl transition-all duration-1200 delay-300"
          style={{
            width: '200px', height: '200px',
            background: 'radial-gradient(circle, hsla(42, 96%, 58%, 0.15), transparent 70%)',
            top: '55%', left: '35%',
            transform: `translate(-50%, -50%) scale(${phase === 'enter' ? 0.3 : 1})`,
            opacity: phase === 'enter' ? 0 : 0.5,
          }}
        />
      </div>

      {/* Logo with proper sizing and no clipping */}
      <div
        className="relative transition-all duration-700 ease-out"
        style={{
          transform: phase === 'enter' ? 'scale(0.6)' : 'scale(1)',
          opacity: phase === 'enter' ? 0 : 1,
        }}
      >
        {/* Rotating ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: '-14px',
            border: '2px solid transparent',
            borderTopColor: 'hsla(42, 96%, 58%, 0.6)',
            borderRightColor: 'hsla(258, 78%, 65%, 0.3)',
            borderRadius: '50%',
            animation: 'splash-ring-spin 2s linear infinite',
          }}
        />
        {/* Pulsing glow behind logo */}
        <div
          className="absolute rounded-2xl"
          style={{
            inset: '-6px',
            background: 'linear-gradient(135deg, hsla(258, 78%, 55%, 0.4), hsla(42, 96%, 58%, 0.2))',
            filter: 'blur(16px)',
            animation: 'splash-pulse 2s ease-in-out infinite',
          }}
        />
        <img
          src="/favicon.png"
          alt="Shahed Store"
          className="relative w-[88px] h-[88px] rounded-2xl object-contain"
          style={{
            boxShadow: '0 0 30px hsla(258, 78%, 55%, 0.5), 0 0 60px hsla(258, 78%, 55%, 0.2)',
            background: 'linear-gradient(135deg, hsl(258, 78%, 22%), hsl(226, 40%, 15%))',
            padding: '8px',
          }}
        />
      </div>

      {/* Brand name */}
      <div
        className="mt-7 transition-all duration-600 ease-out"
        style={{
          opacity: phase === 'text' || phase === 'fade' ? 1 : 0,
          transform: phase === 'text' || phase === 'fade' ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        <h1
          className="text-[22px] font-black tracking-tight text-center"
          style={{
            fontFamily: 'Sora, sans-serif',
            background: 'linear-gradient(135deg, #ffffff 30%, hsl(42, 96%, 65%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Shahed Store
        </h1>
        <p className="text-center text-[10px] mt-1.5 tracking-[0.25em] uppercase"
          style={{ color: 'hsla(0, 0%, 100%, 0.45)' }}>
          Your Trusted Digital Shop
        </p>
      </div>

      {/* Beautiful wave loader */}
      <div className="mt-10 flex items-end gap-[3px]" style={{
        opacity: phase === 'text' || phase === 'fade' ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: '3px',
              background: `linear-gradient(to top, hsla(258, 78%, 65%, 0.8), hsla(42, 96%, 58%, 0.6))`,
              animation: 'splash-wave 1s ease-in-out infinite',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes splash-ring-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes splash-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes splash-wave {
          0%, 100% { height: 8px; }
          50% { height: 22px; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
