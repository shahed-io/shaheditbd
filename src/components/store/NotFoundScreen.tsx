import { Link } from 'react-router-dom';

interface NotFoundScreenProps {
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  code?: string; // shown behind OOPS! (e.g. "404")
}

/**
 * Shared "Primitive unplugged" not-found screen.
 * Playful caveman-with-disconnected-cable illustration —
 * used for 404 routes and product-not-found states.
 */
const NotFoundScreen = ({
  title = "Looks like you're lost",
  message = "The page you are looking for is currently unplugged from our digital cave.",
  ctaLabel = 'Go to Home',
  ctaHref = '/',
  code = '404',
}: NotFoundScreenProps) => {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-white p-6 sm:p-8 overflow-hidden"
      style={{ fontFamily: "'Arvo', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&display=swap');

        @keyframes nf-tug {
          0%, 100% { transform: translate(0,0) rotate(-2deg); }
          25%      { transform: translate(-3px,-2px) rotate(-6deg); }
          50%      { transform: translate(2px,1px)   rotate(3deg); }
          75%      { transform: translate(-2px,2px)  rotate(-4deg); }
        }
        @keyframes nf-tug-r {
          0%, 100% { transform: translate(0,0) rotate(2deg); }
          25%      { transform: translate(3px,-2px)  rotate(6deg); }
          50%      { transform: translate(-2px,1px)  rotate(-3deg); }
          75%      { transform: translate(2px,2px)   rotate(4deg); }
        }
        @keyframes nf-spark {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes nf-body-sway {
          0%, 100% { transform: rotate(-1deg); }
          50%      { transform: rotate(1deg); }
        }
        @keyframes nf-cable-wave {
          0%, 100% { d: path('M10 180 Q40 180 45 150'); }
          50%      { d: path('M10 182 Q38 170 45 150'); }
        }
        @keyframes nf-cable-wave-r {
          0%, 100% { d: path('M190 180 Q160 180 155 150'); }
          50%      { d: path('M190 182 Q162 170 155 150'); }
        }
        @keyframes nf-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-plug-l    { animation: nf-tug 1.6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .nf-plug-r    { animation: nf-tug-r 1.9s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .nf-spark-l   { animation: nf-spark 0.9s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .nf-spark-r   { animation: nf-spark 1.1s ease-in-out infinite 0.2s; transform-origin: center; transform-box: fill-box; }
        .nf-body      { animation: nf-body-sway 4s ease-in-out infinite; transform-origin: 100px 160px; transform-box: fill-box; }
        .nf-cable-l   { animation: nf-cable-wave 1.6s ease-in-out infinite; }
        .nf-cable-r   { animation: nf-cable-wave-r 1.9s ease-in-out infinite; }
        .nf-fade-up   { animation: nf-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="w-full max-w-sm flex flex-col items-center text-center nf-fade-up">
        {/* 404 header */}
        <div className="relative mb-4">
          <h1 className="text-8xl font-bold text-gray-800 opacity-10 animate-pulse leading-none">
            {code}
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-900 tracking-widest mt-4">
              OOPS!
            </span>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
          <div className="absolute bottom-12 w-48 h-12 bg-gray-100 rounded-full blur-xl" />
          <div className="absolute bottom-16 left-4 w-12 h-20 bg-gray-200 rounded-full" />
          <div className="absolute bottom-16 right-8 w-8 h-16 bg-gray-200 rounded-full" />

          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl z-10" aria-hidden="true">
            <g className="nf-body">
              {/* Body / Tunic */}
              <path d="M70 160 L130 160 L140 100 L60 100 Z" fill="#F59E0B" />
              <circle cx="80" cy="120" r="4" fill="#B45309" />
              <circle cx="110" cy="140" r="3" fill="#B45309" />
              <circle cx="90" cy="150" r="5" fill="#B45309" />

              {/* Head & Beard */}
              <circle cx="100" cy="85" r="25" fill="#78350F" />
              <circle cx="100" cy="80" r="18" fill="#FDE68A" />
              <rect x="85" y="90" width="30" height="15" rx="5" fill="#78350F" />

              {/* Eyes */}
              <circle cx="92" cy="78" r="3" fill="#000" />
              <circle cx="108" cy="78" r="3" fill="#000" />

              {/* Arms */}
              <path d="M60 110 Q40 120 45 150" stroke="#FDE68A" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M140 110 Q160 120 155 150" stroke="#FDE68A" strokeWidth="8" fill="none" strokeLinecap="round" />
            </g>

            {/* Cables (wavy, disconnected) */}
            <path className="nf-cable-l" d="M10 180 Q40 180 45 150" stroke="#1F2937" strokeWidth="4" fill="none" />
            <path className="nf-cable-r" d="M190 180 Q160 180 155 150" stroke="#1F2937" strokeWidth="4" fill="none" />

            {/* Cable ends — tugging */}
            <rect className="nf-plug-l" x="38" y="145" width="14" height="10" rx="2" fill="#4B5563" />
            <rect className="nf-plug-r" x="148" y="145" width="14" height="10" rx="2" fill="#4B5563" />

            {/* Sparks between the disconnected ends */}
            <circle className="nf-spark-l" cx="45" cy="140" r="2" fill="#60A5FA" />
            <circle className="nf-spark-r" cx="155" cy="140" r="2" fill="#60A5FA" />
            <circle className="nf-spark-l" cx="52" cy="135" r="1.2" fill="#FCD34D" />
            <circle className="nf-spark-r" cx="148" cy="135" r="1.2" fill="#FCD34D" />
          </svg>
        </div>

        {/* Copy */}
        <div className="space-y-3 px-4">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {title}
          </h2>
          <p className="text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <Link
            to={ctaHref}
            className="inline-block px-10 py-3 bg-[#44ad49] hover:bg-[#3a9a3f] text-white font-bold text-sm tracking-wide uppercase transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-200 rounded-md"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundScreen;
