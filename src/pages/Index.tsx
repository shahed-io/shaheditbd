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

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="ডিজিটাল প্রোডাক্ট শপ"
        description="Shahed Store — Windows, Office, Adobe, Antivirus, Subscription সহ সব ডিজিটাল প্রোডাক্ট সেরা দামে। ৳ পেমেন্টে তাৎক্ষণিক ডেলিভারি।"
        ogType="website"
        schema={[organizationSchema(), websiteSchema()]}
      />
      <Navbar />
      <HeroBanner />
      <TickerBanner />
      <Categories />
      <TopProducts />
      <FlashSale />
      <WhyChooseUs />
      <Testimonials />
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
