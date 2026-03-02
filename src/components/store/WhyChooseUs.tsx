import { Shield, Zap, Headphones, Award, Globe, BadgeCheck } from 'lucide-react';

const features = [
  {
    icon: <Zap size={22} />,
    title: 'Instant Delivery',
    desc: 'Get your license keys instantly after payment via email.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
  },
  {
    icon: <Shield size={22} />,
    title: '100% Genuine',
    desc: 'All keys are 100% original and verified. No fake or cracked keys.',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
  },
  {
    icon: <Headphones size={22} />,
    title: '24/7 Support',
    desc: 'Round the clock customer support via WhatsApp, Telegram & Email.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    icon: <BadgeCheck size={22} />,
    title: 'DBID: 586772174',
    desc: 'Government registered trusted digital shop in Bangladesh.',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
  },
  {
    icon: <Award size={22} />,
    title: 'Best Prices',
    desc: 'Lowest prices in Bangladesh with regular flash sales.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10 border-rose-400/20',
  },
  {
    icon: <Globe size={22} />,
    title: 'Trusted Store',
    desc: '5000+ happy customers. Trusted seller since 2020.',
    color: 'text-teal-400',
    bg: 'bg-teal-400/10 border-teal-400/20',
  },
];

const steps = [
  { num: '01', title: 'Choose Product', desc: 'Browse our collection and select your desired software or subscription.' },
  { num: '02', title: 'Make Payment', desc: 'Pay securely via bKash, Nagad, or Rocket mobile banking.' },
  { num: '03', title: 'Get Delivery', desc: 'Receive your license key or subscription via email within minutes.' },
  { num: '04', title: 'Enjoy & Support', desc: 'Activate your product and get lifetime customer support from us.' },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm">◈</span>
            <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Why Us</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Why Choose <span className="gradient-text">Shahed Store?</span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Bangladesh's most trusted digital software store since 2020. 5000+ satisfied customers and counting.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {features.map((f, i) => (
            <div
              key={i}
              className="group flex gap-4 p-5 rounded-2xl border border-border/40 bg-card/40 hover:border-primary/30 hover:bg-card/70 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
            >
              <div className={`flex-shrink-0 w-11 h-11 rounded-xl border ${f.bg} flex items-center justify-center ${f.color}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1 text-sm">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works - shahedit process style */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-5 py-2 mb-4">
            <span className="text-accent text-sm">◈</span>
            <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">Our Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            How to <span className="gradient-text">Order</span>
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
          <p className="text-muted-foreground mt-3 text-sm">
            4 simple steps to get your digital product from Shahed Store.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl border border-border/40 bg-card/40 text-center group hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'both' }}
            >
              <div className="text-5xl font-black gradient-text opacity-20 absolute top-3 right-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {step.num}
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-[10px] text-primary font-semibold tracking-wider mb-3">
                  Step {step.num}
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{step.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '5,000+', label: 'Happy Customers' },
              { num: '500+', label: 'Products Available' },
              { num: '99.9%', label: 'Satisfaction Rate' },
              { num: '24/7', label: 'Customer Support' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
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
