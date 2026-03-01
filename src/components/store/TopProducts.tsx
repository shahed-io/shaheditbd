import { useState } from 'react';
import { topProducts } from '@/data/products';
import ProductCard from './ProductCard';

const tabs = ['All Products', 'Windows', 'Office', 'Software', 'Subscription'];

const TopProducts = () => {
  const [activeTab, setActiveTab] = useState('All Products');

  const filtered =
    activeTab === 'All Products'
      ? topProducts
      : topProducts.filter((p) => p.category === activeTab);

  return (
    <section className="py-16 px-4 relative">
      {/* Background orb */}
      <div className="orb orb-2 opacity-10" style={{ top: '20%', right: '-10%' }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-1">Featured</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Top <span className="gradient-text">Selling Products</span>
            </h2>
          </div>
          <a href="#" className="text-primary text-sm hover:underline self-start sm:self-auto">
            View All Products →
          </a>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'btn-glow'
                  : 'glass-card text-muted-foreground hover:text-primary hover:border-primary/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} delay={i * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopProducts;
