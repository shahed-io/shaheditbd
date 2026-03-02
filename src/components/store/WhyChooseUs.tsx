import { Shield, Zap, Headphones, Award, Globe, BadgeCheck } from 'lucide-react';

const features = [
  {
    icon: <Zap size={22} />,
    title: 'Instant Delivery',
    desc: 'Get your license keys instantly after payment via email.',
    gradient: 'from-yellow-400/80 to-orange-500/80',
    glow: 'hsla(43,100%,60%,0.15)',
  },
  {
    icon: <Shield size={22} />,
    title: '100% Genuine',
    desc: 'All keys are 100% original and verified. No fake or cracked keys.',
    gradient: 'from-emerald-400/80 to-teal-600/80',
    glow: 'hsla(158,64%,52%,0.15)',
  },
  {
    icon: <Headphones size={22} />,
    title: '24/7 Support',
    desc: 'Round the clock customer support via WhatsApp, Telegram & Email.',
    gradient: 'from-sky-400/80 to-blue-600/80',
    glow: 'hsla(210,100%,60%,0.12)',
  },
  {
    icon: <BadgeCheck size={22} />,
    title: 'Govt. Certified',
    desc: 'বাংলাদেশ সরকারের নিবন্ধিত বিশ্বস্ত ডিজিটাল শপ। DBID: 586772174',
    gradient: 'from-violet-400/80 to-purple-600/80',
    glow: 'hsla(270,70%,60%,0.12)',
  },
  {
    icon: <Award size={22} />,
    title: 'Best Prices',
    desc: 'Lowest prices in Bangladesh with regular flash sales and exclusive deals.',
    gradient: 'from-rose-400/80 to-pink-600/80',
    glow: 'hsla(340,80%,60%,0.12)',
  },
  {
    icon: <Globe size={22} />,
    title: 'Trusted Store',
    desc: '5000+ happy customers. Trusted seller since 2020. Top-rated on all platforms.',
    gradient: 'from-teal-400/80 to-cyan-600/80',
    glow: 'hsla(180,70%,52%,0.12)',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-label justify-center">
            <span className="inline-block w-5 h-0.5 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
            Our Promise
            <span className="inline-block w-5 h-0.5 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
          </p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Why Choose <span className="gradient-text">Shahed Store?</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
            Bangladesh's most trusted digital software store since 2020. 5,000+ satisfied customers and counting.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl p-6 flex gap-4 cursor-default transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                animationDelay: `${i * 0.08}s`,
                animationFillMode: 'both',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${f.glow}`; (e.currentTarget as HTMLElement).style.borderColor = 'hsla(158,64%,52%,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
            >
              <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white shadow-md`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, hsla(158,64%,52%,0.06), hsla(43,100%,60%,0.04))', border: '1px solid hsla(158,64%,52%,0.12)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '5,000+', label: 'Happy Customers' },
              { num: '500+', label: 'Products Available' },
              { num: '99.9%', label: 'Satisfaction Rate' },
              { num: '24/7', label: 'Customer Support' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-3xl font-black gradient-text" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {stat.num}
                </div>
                <div className="text-muted-foreground text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
