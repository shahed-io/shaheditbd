import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from "@/components/seo/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <SEOHead
        title="Page Not Found (404)"
        description="The page you are looking for does not exist on Shahed Store."
        noIndex
      />

      <style>{`
        @keyframes nf-character-sway {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes nf-cable-swing {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes nf-card-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nf-sway { animation: nf-character-sway 4s ease-in-out infinite; }
        .nf-swing { animation: nf-cable-swing 3s ease-in-out infinite; transform-origin: top center; }
        .nf-card { animation: nf-card-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .nf-arvo { font-family: 'Arvo', serif; }
        .nf-bengali { font-family: 'Hind Siliguri', sans-serif; }
      `}</style>

      <div className="nf-card max-w-[340px] w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-8 sm:p-10 flex flex-col items-center text-center border border-slate-100">
        <h1 className="nf-arvo text-7xl font-bold text-slate-800 tracking-tight mb-2">
          404
        </h1>

        <div className="relative w-full h-44 flex items-center justify-center my-4">
          <div className="absolute bottom-4 w-4/5 h-2 bg-slate-100 rounded-full" />

          <div className="nf-sway flex flex-col items-center relative z-10">
            <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20 30C20 15 35 5 45 10C55 5 70 15 70 30L75 45H15L20 30Z" fill="#4A3728" />
              <circle cx="45" cy="45" r="20" fill="#FFDBAC" />
              <circle cx="38" cy="42" r="2" fill="#333" />
              <circle cx="52" cy="42" r="2" fill="#333" />
              <path d="M30 65L20 95H70L60 65H30Z" fill="#FFA500" />
              <circle cx="40" cy="75" r="2" fill="#4A3728" />
              <circle cx="55" cy="85" r="2" fill="#4A3728" />
              <circle cx="35" cy="88" r="2" fill="#4A3728" />
              <path d="M30 75L15 85" stroke="#FFDBAC" strokeWidth="4" strokeLinecap="round" />
              <path d="M60 75L75 85" stroke="#FFDBAC" strokeWidth="4" strokeLinecap="round" />
            </svg>

            <div className="nf-swing absolute top-[78px] right-[-5px]">
              <svg width="30" height="40" viewBox="0 0 30 40" fill="none" aria-hidden="true">
                <path d="M2 2C2 2 15 5 15 25V35" stroke="#333" strokeWidth="2" strokeLinecap="round" />
                <rect x="10" y="32" width="10" height="6" rx="1" fill="#666" />
                <path d="M13 38V42M17 38V42" stroke="#999" strokeWidth="1" />
              </svg>
            </div>
          </div>

          <div className="absolute left-4 bottom-8 w-6 h-10 bg-slate-200 rounded-t-full opacity-60" />
          <div className="absolute right-6 bottom-6 w-8 h-12 bg-slate-200 rounded-t-full opacity-60" />
        </div>

        <div className="nf-bengali">
          <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-3">
            মনে হচ্ছে আপনি হারিয়ে গেছেন
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-8 px-2">
            আপনি যে পাতাটি খুঁজছেন তা সম্ভবত এখানে নেই অথবা সরানো হয়েছে।
          </p>
        </div>

        <Link
          to="/"
          className="nf-bengali block w-full py-3.5 bg-[#39ac31] hover:bg-[#2e8b28] text-white rounded-xl font-semibold text-base transition-all duration-300 shadow-[0_8px_20px_rgba(57,172,49,0.25)] active:scale-[0.98]"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
