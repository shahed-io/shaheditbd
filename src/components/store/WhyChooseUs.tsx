import { Shield, Zap, Headphones, Award, Globe, BadgeCheck } from 'lucide-react';

const features = [
  { icon: <Zap size={20} />, title: 'Instant Delivery', desc: 'Get your license keys instantly after payment via email.', hue: 45 },
  { icon: <Shield size={20} />, title: '100% Genuine', desc: 'All keys are 100% original and verified. No fake or cracked keys.', hue: 140 },
  { icon: <Headphones size={20} />, title: '24/7 Support', desc: 'Round the clock customer support via WhatsApp, Telegram & Email.', hue: 180 },
  { icon: <BadgeCheck size={20} />, title: 'DBID: 586772174', desc: 'Government registered trusted digital shop in Bangladesh.', hue: 265 },
  { icon: <Award size={20} />, title: 'Best Prices', desc: 'Lowest prices in Bangladesh with regular flash sales.', hue: 0 },
  { icon: <Globe size={20} />, title: 'Trusted Store', desc: '5000+ happy customers. Trusted seller since 2020.', hue: 200 },
];

const steps = [
  { num: '01', title: 'Choose Product', desc: 'Browse our collection and select your desired software or subscription.' },
  { num: '02', title: 'Make Payment', desc: 'Pay securely via bKash, Nagad, or Rocket mobile banking.' },
  { num: '03', title: 'Get Delivery', desc: 'Receive your license key or subscription via email within minutes.' },
  { num: '04', title: 'Enjoy & Support', desc: 'Activate your product and get lifetime customer support from us.' },
];

const SectionBadge = ({ text, hue = 180 }: { text: string; hue?: number }) => (
  <div
    className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-4 text-xs font-semibold tracking-[0.2em] uppercase"
    style={{
      background: `hsla(${hue},100%,50%,0.08)`,
      border: `1px solid hsla(${hue},100%,50%,0.2)`,
      color: `hsl(${hue},100%,60%)`,
    }}
  >
    <span>◈</span>
    <span>{text}</span>
  </div>
);

const WhyChooseUs = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="orb orb-3 opacity-[0.07]" style={{ top: '10%', right: '-5%' }} />
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Section header */}
        <div className="text-center mb-14">
          <SectionBadge text="Why Us" hue={180} />
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Why Choose <span className="gradient-text">Shahed Store?</span>
          </h2>
          <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'var(--gradient-primary)' }} />
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm">
            Bangladesh's most trusted digital software store since 2020. 5000+ satisfied customers and counting.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map((f, i) => (
            <div
              key={i}
              className="group flex gap-4 p-5 rounded-2xl transition-all duration-300 animate-slide-up cursor-default"
              style={{
                animationDelay: `${i * 0.08}s`,
                animationFillMode: 'both',
                background: 'hsla(228,28%,10%,0.6)',
                border: '1px solid hsla(180,100%,42%,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `hsla(${f.hue},80%,55%,0.35)`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px hsla(${f.hue},80%,50%,0.1)`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.1)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `hsla(${f.hue},80%,55%,0.12)`,
                  border: `1px solid hsla(${f.hue},80%,55%,0.2)`,
                  color: `hsl(${f.hue},80%,60%)`,
                }}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'hsl(var(--foreground))' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How to Order */}
        <div className="text-center mb-10">
          <SectionBadge text="Our Process" hue={265} />
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            How to <span className="gradient-text">Order</span>
          </h2>
          <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ background: 'var(--gradient-primary)' }} />
          <p className="text-muted-foreground mt-3 text-sm">
            4 simple steps to get your digital product from Shahed Store.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl text-center animate-slide-up transition-all duration-300"
              style={{
                animationDelay: `${i * 0.12}s`,
                animationFillMode: 'both',
                background: 'hsla(228,28%,10%,0.65)',
                border: '1px solid hsla(180,100%,42%,0.12)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.35)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px hsla(180,100%,42%,0.1)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.12)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div className="text-6xl font-black opacity-[0.07] absolute top-2 right-3 gradient-text select-none"
                style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {step.num}
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider mb-3"
                  style={{ background: 'hsla(180,100%,42%,0.1)', border: '1px solid hsla(180,100%,42%,0.2)', color: 'hsl(var(--primary))' }}>
                  Step {step.num}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'hsl(var(--foreground))' }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="rounded-2xl p-8" style={{ background: 'hsla(228,28%,10%,0.7)', border: '1px solid hsla(180,100%,42%,0.15)' }}>
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
