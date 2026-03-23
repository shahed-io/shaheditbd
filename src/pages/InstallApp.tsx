import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Download, Smartphone, Star, Shield, Zap, ChevronRight, CheckCircle2, Share2, PlusSquare, Menu } from "lucide-react";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installing, setInstalling] = useState(false);
  const promptCaptured = useRef(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));

    // Check already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      if (!promptCaptured.current) {
        promptCaptured.current = true;
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: "দ্রুত লোডিং", desc: "অ্যাপটি ইনস্টল করলে আরও দ্রুত লোড হবে" },
    { icon: Shield, title: "নিরাপদ", desc: "আপনার তথ্য সম্পূর্ণ সুরক্ষিত থাকবে" },
    { icon: Star, title: "অফলাইনে কাজ করে", desc: "ইন্টারনেট ছাড়াও কিছু কন্টেন্ট দেখা যাবে" },
    { icon: Smartphone, title: "নেটিভ অ্যাপের মতো", desc: "হোম স্ক্রিন থেকে সরাসরি খুলুন" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 pt-16 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Smartphone className="w-4 h-4" />
            মোবাইল অ্যাপ ইনস্টল করুন
          </div>

          {/* App Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-primary/70 shadow-2xl flex items-center justify-center">
              <img
                src="/favicon.png"
                alt="Shahed Store"
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-4xl font-black text-primary-foreground hidden">S</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Shahed Store অ্যাপ
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            আপনার মোবাইলের হোম স্ক্রিনে ইনস্টল করুন এবং যেকোনো সময় সহজে কেনাকাটা করুন।
          </p>

          {/* Install CTA */}
          {installed ? (
            <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-600 px-6 py-3 rounded-full text-lg font-medium">
              <CheckCircle2 className="w-5 h-5" />
              অ্যাপটি ইতিমধ্যে ইনস্টল হয়েছে!
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
            >
              <Download className="w-5 h-5" />
              {installing ? "ইনস্টল হচ্ছে..." : "এখনই ইনস্টল করুন"}
            </button>
          ) : isIOS ? (
            <div className="bg-card border rounded-2xl p-6 max-w-sm mx-auto text-left">
              <p className="font-semibold text-foreground mb-4 text-center">iPhone / iPad-এ ইনস্টল করুন</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">১</span>
                  <span>Safari ব্রাউজারে নিচের <Share2 className="inline w-4 h-4" /> Share বাটনে ট্যাপ করুন</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">২</span>
                  <span><PlusSquare className="inline w-4 h-4" /> "Add to Home Screen" সিলেক্ট করুন</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">৩</span>
                  <span>"Add" বাটনে ট্যাপ করুন — শেষ!</span>
                </li>
              </ol>
            </div>
          ) : isAndroid ? (
            <div className="bg-card border rounded-2xl p-6 max-w-sm mx-auto text-left">
              <p className="font-semibold text-foreground mb-4 text-center">Android-এ ইনস্টল করুন</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">১</span>
                  <span>Chrome ব্রাউজারে উপরে <Menu className="inline w-4 h-4" /> মেনু (৩টি ডট) ট্যাপ করুন</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">২</span>
                  <span>"Add to Home screen" বা "Install app" সিলেক্ট করুন</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">৩</span>
                  <span>"Install" বাটনে ট্যাপ করুন — শেষ!</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="bg-card border rounded-2xl p-5 max-w-sm mx-auto text-center">
              <p className="text-muted-foreground text-sm">
                Chrome/Edge এ <strong>ব্রাউজার মেনু → Install App</strong> অপশন ব্যবহার করুন অথবা মোবাইলে ভিজিট করুন।
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-foreground mb-10">অ্যাপ ব্যবহারের সুবিধা</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border rounded-2xl p-5 text-center hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps overview */}
      <section className="py-8 pb-20 max-w-2xl mx-auto px-4 text-center">
        <p className="text-muted-foreground mb-6">এটি কোনো App Store থেকে ডাউনলোড করতে হবে না।<br />সরাসরি ব্রাউজার থেকে ইনস্টল করুন — সম্পূর্ণ বিনামূল্যে।</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
        >
          স্টোরে ফিরে যান <ChevronRight className="w-4 h-4" />
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default InstallApp;
