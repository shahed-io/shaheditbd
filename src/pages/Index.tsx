import { useEffect, useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/store/Navbar';
import HeroBanner from '@/components/store/HeroBanner';
import TopProducts from '@/components/store/TopProducts';
import { TickerBanner, FloatingButtons } from '@/components/store/Extras';
import SEOHead from '@/components/seo/SEOHead';
import { organizationSchema, websiteSchema } from '@/components/seo/schemas';
import AuthModal from '@/components/store/AuthModal';
import Footer from '@/components/store/Footer';

// Below-fold sections — lazy loaded after hero renders
const FlashSale    = lazy(() => import('@/components/store/FlashSale'));
const WhyChooseUs  = lazy(() => import('@/components/store/WhyChooseUs'));
const Testimonials = lazy(() => import('@/components/store/Testimonials'));
const PopupBanner  = lazy(() => import('@/components/store/PopupBanner'));
const WelcomeDiscount = lazy(() => import('@/components/store/WelcomeDiscount'));

// Lightweight skeleton placeholders
const SectionSkeleton = () => (
  <div className="py-16 container-fluid">
    <div className="h-8 w-48 rounded-xl bg-muted/40 animate-pulse mb-8 mx-auto" />
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-48 rounded-2xl bg-muted/30 animate-pulse" />
      ))}
    </div>
  </div>
);

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
      <TickerBanner />
      <TopProducts />

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
      <Footer />

      <FloatingButtons />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <Suspense fallback={null}>
        <PopupBanner />
      </Suspense>
      <Suspense fallback={null}>
        <WelcomeDiscount />
      </Suspense>
    </div>
  );
};

export default Index;
