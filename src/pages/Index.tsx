import Navbar from '@/components/store/Navbar';
import HeroBanner from '@/components/store/HeroBanner';
import Categories from '@/components/store/Categories';
import TopProducts from '@/components/store/TopProducts';
import FlashSale from '@/components/store/FlashSale';
import WhyChooseUs from '@/components/store/WhyChooseUs';
import Testimonials from '@/components/store/Testimonials';
import Footer from '@/components/store/Footer';
import { TickerBanner, WhatsAppButton } from '@/components/store/Extras';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroBanner />
      <TickerBanner />
      <Categories />
      <TopProducts />
      <FlashSale />
      <WhyChooseUs />
      <Testimonials />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
