import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/store/Navbar';
import HeroBanner from '@/components/store/HeroBanner';
import Categories from '@/components/store/Categories';
import TopProducts from '@/components/store/TopProducts';
import FlashSale from '@/components/store/FlashSale';
import WhyChooseUs from '@/components/store/WhyChooseUs';
import Testimonials from '@/components/store/Testimonials';
import Footer from '@/components/store/Footer';
import { TickerBanner, FloatingButtons } from '@/components/store/Extras';
import SEOHead from '@/components/seo/SEOHead';
import { organizationSchema, websiteSchema } from '@/components/seo/schemas';
import AuthModal from '@/components/store/AuthModal';

const Index = () => {
  const [searchParams] = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);

  // Auto-open signup modal when ?ref= is in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Small delay so page loads first
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
      <Navbar />
      <HeroBanner />
      <TickerBanner />
      {/* <Categories /> */}
      <TopProducts />
      <FlashSale />
      <WhyChooseUs />
      <Testimonials />
      <Footer />
      <FloatingButtons />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Index;
