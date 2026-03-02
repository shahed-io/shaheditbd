import Navbar from '@/components/store/Navbar';
import HeroBanner from '@/components/store/HeroBanner';
import Categories from '@/components/store/Categories';
import TopProducts from '@/components/store/TopProducts';
import FlashSale from '@/components/store/FlashSale';
import WhyChooseUs from '@/components/store/WhyChooseUs';

import Footer from '@/components/store/Footer';
import { TickerBanner, FloatingButtons } from '@/components/store/Extras';

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
      
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
