import { useEffect, useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/store/Navbar';
import HeroBanner from '@/components/store/HeroBanner';
import SEOHead from '@/components/seo/SEOHead';
import { organizationSchema, websiteSchema } from '@/components/seo/schemas';
import AuthModal from '@/components/store/AuthModal';

// Below-fold sections — lazy loaded after hero renders
const TopProducts  = lazy(() => import('@/components/store/TopProducts'));
const FlashSale    = lazy(() => import('@/components/store/FlashSale'));
const WhyChooseUs  = lazy(() => import('@/components/store/WhyChooseUs'));
const Testimonials = lazy(() => import('@/components/store/Testimonials'));
const Footer       = lazy(() => import('@/components/store/Footer'));
const PopupBanner  = lazy(() => import('@/components/store/PopupBanner'));
const TickerBanner = lazy(() => import('@/components/store/Extras').then(m => ({ default: m.TickerBanner })));
const FloatingButtons = lazy(() => import('@/components/store/Extras').then(m => ({ default: m.FloatingButtons })));

// Lightweight skeleton placeholders
const SectionSkeleton = () => (
  <div className="py-16 px-4 max-w-7xl mx-auto">
    <div className="h-8 w-48 rounded-xl bg-muted/40 animate-pulse mb-8 mx-auto" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-48 rounded-2xl bg-muted/30 animate-pulse" />
      ))}
    </div>
  </div>
);

const TickerSkeleton = () => <div className="h-10 bg-muted/20 animate-pulse" />;

const Index = () => {
  const [searchParams] = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);

  // Auto-open signup modal when ?ref= is in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      const timer = setTimeout(() => setAuthOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Buy Windows, Office, Adobe, Antivirus & Digital Software – Best Price Bangladesh"
        description="Shahed Store – Bangladesh's most trusted digital software shop. Buy Windows 11, Microsoft Office 365, Adobe Creative Cloud, Antivirus, VPN & subscriptions at the lowest price. 100% genuine. Instant delivery."
        ogType="website"
        canonical="https://shahedstore.com.bd/"
        schema={[organizationSchema(), websiteSchema()]}
      />
      {/* Critical above-fold content — eager */}
      <Navbar />
      <HeroBanner />

      {/* Ticker — lazy but very small, loads immediately after hero paint */}
      <Suspense fallback={<TickerSkeleton />}>
        <TickerBanner />
      </Suspense>

      {/* Top Products — lazy loaded */}
      <Suspense fallback={<SectionSkeleton />}>
        <TopProducts />
      </Suspense>

      {/* Below-fold — lazy loaded */}
      <Suspense fallback={<SectionSkeleton />}>
        <FlashSale />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <WhyChooseUs />
      </Suspense>
      <Suspense fallback={<div className="py-12" />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<div className="py-8" />}>
        <Footer />
      </Suspense>

      <Suspense fallback={null}>
        <FloatingButtons />
      </Suspense>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <Suspense fallback={null}>
        <PopupBanner />
      </Suspense>
    </div>
  );
};

export default Index;
