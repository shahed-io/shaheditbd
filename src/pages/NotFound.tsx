import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Home, Search, ArrowLeft, Sparkles, Compass, ShoppingBag, LifeBuoy } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";

const FUN_LINES = [
  {
    title: "ইশ! পেজটা মনে হয় ছুটিতে গেছে 🌴",
    sub: "আমরা সব কোণায় খুঁজলাম — কিন্তু এই পেজটা এখন কোথাও নেই। হয়তো লিংকটা পুরোনো, অথবা টাইপিং-এ একটু এদিক-সেদিক হয়ে গেছে।",
  },
  {
    title: "এই পেজটা হারিয়ে গেছে ডিজিটাল মহাকাশে 🚀",
    sub: "চিন্তার কিছু নেই — নিচের যেকোনো বাটনে ক্লিক করে আপনি ঠিক জায়গায় ফিরে যেতে পারবেন।",
  },
  {
    title: "আরে! এখানে তো কিছু নেই 👀",
    sub: "মনে হচ্ছে আপনি এমন এক ঠিকানায় এসেছেন যেটা আমাদের ম্যাপে নেই। চলুন আপনাকে সঠিক পথে ফিরিয়ে নিয়ে যাই।",
  },
  {
    title: "৪০৪ — পেজটা চা খেতে গেছে ☕",
    sub: "ফিরে আসতে একটু দেরি হবে। ততক্ষণে চলুন আমাদের জনপ্রিয় প্রোডাক্টগুলো একবার দেখে আসি।",
  },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const line = useMemo(() => FUN_LINES[Math.floor(Math.random() * FUN_LINES.length)], []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <SEOHead title="Page Not Found (404)" description="The page you are looking for does not exist on Shahed Store." noIndex />

      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Glass card */}
        <div className="relative rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-12">
          {/* Floating sparkle badge */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border border-white/40 bg-white/70 px-4 py-1.5 text-xs font-semibold text-primary shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Shahed Store
            </span>
          </div>

          {/* Big gradient 404 */}
          <div className="text-center">
            <h1
              className="select-none bg-gradient-to-br from-primary via-primary/70 to-accent bg-clip-text text-[6rem] font-black leading-none tracking-tighter text-transparent drop-shadow-sm sm:text-[9rem]"
              aria-label="404"
            >
              4<span className="inline-block animate-pulse">0</span>4
            </h1>

            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {line.title}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              {line.sub}
            </p>

            {/* Path display */}
            <div className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <code className="truncate font-mono">{location.pathname}</code>
            </div>

            {/* Primary actions */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate(-1)}
                variant="outline"
                className="rounded-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                পিছনে যাই
              </Button>
              <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/30">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  হোমে ফিরে যান
                </Link>
              </Button>
            </div>

            {/* Quick links */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                to="/shop"
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">শপ দেখুন</div>
                  <div className="text-xs text-muted-foreground">সব প্রোডাক্ট</div>
                </div>
              </Link>
              <Link
                to="/search"
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">খুঁজে দেখুন</div>
                  <div className="text-xs text-muted-foreground">প্রোডাক্ট সার্চ</div>
                </div>
              </Link>
              <Link
                to="/help"
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">সাহায্য চাই</div>
                  <div className="text-xs text-muted-foreground">২৪/৭ সাপোর্ট</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          লিংকে ভুল মনে হলে আমাদের জানান — আমরা ঠিক করে দেব ✨
        </p>
      </div>
    </div>
  );
};

export default NotFound;
