import { Shield, Zap, Headphones, Award, Globe, BadgeCheck } from 'lucide-react';

const features = [
  {
    icon: <Zap size={24} />,
    title: 'Instant Delivery',
    desc: 'Get your license keys instantly after payment via email.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: <Shield size={24} />,
    title: '100% Genuine',
    desc: 'All keys are 100% original and verified. No fake or cracked keys.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: <Headphones size={24} />,
    title: '24/7 Support',
    desc: 'Round the clock customer support via WhatsApp, Telegram & Email.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <BadgeCheck size={24} />,
    title: 'DBID: 586772174',
    desc: 'Government registered trusted digital shop in Bangladesh.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: <Award size={24} />,
    title: 'Best Prices',
    desc: 'Lowest prices in Bangladesh with regular flash sales.',
    color: 'from-red-500 to-pink-600',
  },
  {
    icon: <Globe size={24} />,
    title: 'Trusted Store',
    desc: '5000+ happy customers. Trusted seller since 2020.',
    color: 'from-teal-500 to-cyan-600',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-2">Our Promise</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Why Choose <span className="gradient-text">Shahed Store?</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Bangladesh's most trusted digital software store since 2020. 5000+ satisfied customers and counting.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card-hover rounded-2xl p-6 flex gap-4 group animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-6 glass-card rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '5,000+', label: 'Happy Customers' },
              { num: '500+', label: 'Products Available' },
              { num: '99.9%', label: 'Satisfaction Rate' },
              { num: '24/7', label: 'Customer Support' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold gradient-text mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {stat.num}
                </div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
