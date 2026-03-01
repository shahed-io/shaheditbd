import { categories } from '@/data/products';

const Categories = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-1">Browse By</p>
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Product <span className="gradient-text">Categories</span>
            </h2>
          </div>
          <a href="#" className="text-primary text-sm hover:underline flex items-center gap-1">
            View All →
          </a>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className="category-card animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-lg mb-1`}>
                {cat.icon}
              </div>
              <span className="text-foreground font-semibold text-sm">{cat.name}</span>
              <span className="text-muted-foreground text-xs">{cat.count} Products</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
