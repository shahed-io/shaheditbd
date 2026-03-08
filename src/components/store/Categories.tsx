import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const CATS = [
  { icon: '🪟', label: 'Windows OS',     desc: 'Win 10 & 11 Pro/Home',  count: 12, colorClass: 'bg-blue-50 border-blue-200',    iconBg: 'bg-blue-100',    badge: 'bg-blue-100 text-blue-700' },
  { icon: '📦', label: 'Microsoft 365',  desc: 'Office & Personal',     count: 8,  colorClass: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100',  badge: 'bg-orange-100 text-orange-700' },
  { icon: '🎨', label: 'Adobe Creative', desc: 'Photoshop, Illustrator', count: 6,  colorClass: 'bg-red-50 border-red-200',      iconBg: 'bg-red-100',     badge: 'bg-red-100 text-red-700' },
  { icon: '🛡️', label: 'Antivirus',      desc: 'Norton, Kaspersky',     count: 10, colorClass: 'bg-green-50 border-green-200',  iconBg: 'bg-green-100',   badge: 'bg-green-100 text-green-700' },
  { icon: '🎬', label: 'Streaming',      desc: 'Netflix, Prime, Disney', count: 9,  colorClass: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100', badge: 'bg-purple-100 text-purple-700' },
  { icon: '🔒', label: 'VPN & Security', desc: 'NordVPN, ExpressVPN',   count: 5,  colorClass: 'bg-cyan-50 border-cyan-200',    iconBg: 'bg-cyan-100',    badge: 'bg-cyan-100 text-cyan-700' },
  { icon: '🎵', label: 'Music & Audio',  desc: 'Spotify, ElevenLabs',   count: 7,  colorClass: 'bg-pink-50 border-pink-200',    iconBg: 'bg-pink-100',    badge: 'bg-pink-100 text-pink-700' },
  { icon: '🤖', label: 'AI Tools',       desc: 'ChatGPT, Midjourney',   count: 4,  colorClass: 'bg-yellow-50 border-yellow-200', iconBg: 'bg-yellow-100', badge: 'bg-yellow-100 text-yellow-700' },
];

const Categories = () => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="py-20 bg-surface-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="section-label">Browse Store</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-3">
              Shop by{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Category
              </span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Premium digital licenses across all major software categories — all at unbeatable prices.
            </p>
          </div>
          <a href="/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-indigo hover:gap-3 transition-all flex-shrink-0">
            View All <ArrowRight size={15} />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATS.map((cat, i) => (
            <a key={cat.label} href={`/category/${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`cat-card p-5 flex flex-col gap-3 ${cat.colorClass} border-2 anim-rise`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl cat-icon ${cat.iconBg} shadow-soft`}>
                {cat.icon}
              </div>
              <div>
                <h3 className="font-sora font-bold text-sm text-foreground leading-tight">{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cat.badge}`}>{cat.count} items</span>
                <ArrowRight size={14}
                  className={`text-muted-foreground transition-all duration-200 ${hovered === i ? 'translate-x-1 text-brand-indigo' : ''}`} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;

