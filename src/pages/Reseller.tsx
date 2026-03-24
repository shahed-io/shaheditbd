import { useState } from 'react';
import { ExternalLink, Users, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

const CID_URL = 'https://shahedstore.com.bd/getcid/login.php';

const Reseller = () => {
  const [iframeError, setIframeError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                  Reseller Portal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: 'Sora, sans-serif' }}>
                CID For Reseller
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                রিসেলার অ্যাকাউন্টে লগইন করুন এবং আপনার CID ম্যানেজ করুন।
              </p>
            </div>

            <a
              href={CID_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                bg-primary text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg w-fit"
            >
              <ExternalLink className="w-4 h-4" />
              নতুন ট্যাবে খুলুন
            </a>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { icon: ShieldCheck, label: 'সিকিউর লগইন' },
              { icon: Zap, label: 'ইনস্ট্যান্ট CID' },
              { icon: Users, label: 'রিসেলার প্যানেল' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                bg-primary/10 text-primary border border-primary/20">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Iframe area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {iframeError ? (
          /* Fallback when iframe is blocked */
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-8 sm:p-12 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  পোর্টালটি সরাসরি এখানে লোড হচ্ছে না
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  নিরাপত্তার কারণে CID পোর্টাল সরাসরি এই পেজে লোড করা যাচ্ছে না।
                  নিচের বাটনে ক্লিক করে নতুন ট্যাবে খুলুন।
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={CID_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold
                    bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  CID Portal খুলুন
                </a>
                <button
                  onClick={() => { setIframeError(false); setLoading(true); }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold
                    border border-border text-foreground hover:bg-muted/50 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  আবার চেষ্টা করুন
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card" style={{ minHeight: '80vh' }}>
            {loading && (
              <div className="flex items-center justify-center py-20 gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-muted-foreground text-sm">লোড হচ্ছে...</span>
              </div>
            )}
            <iframe
              src={CID_URL}
              title="CID For Reseller"
              className="w-full border-0 block"
              style={{
                minHeight: '80vh',
                display: loading ? 'none' : 'block',
              }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setIframeError(true); }}
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Reseller;
