import { Shield, Zap, Headphones, BadgeCheck, Award, Globe } from 'lucide-react';

const FEATURES = [
  { icon: <Zap size={18} />,        title: 'Instant Delivery',   desc: 'পেমেন্টের পরেই ইমেইলে কি পাঠানো হয়।',              n: '01' },
  { icon: <Shield size={18} />,     title: '100% Genuine Keys',  desc: 'সব কি ১০০% অরিজিনাল এবং ভেরিফাইড।',             n: '02' },
  { icon: <Headphones size={18} />, title: '24/7 Support',       desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',     n: '03' },
  { icon: <BadgeCheck size={18} />, title: 'Govt. Registered',   desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',        n: '04' },
  { icon: <Award size={18} />,      title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।', n: '05' },
  { icon: <Globe size={18} />,      title: '5,000+ Customers',   desc: '২০২০ সাল থেকে ৫০০০+ সন্তুষ্ট গ্রাহক।',           n: '06' },
];

const STEPS = [
  { n: '01', title: 'প্রোডাক্ট বেছে নিন',   desc: 'আমাদের কালেকশন থেকে পছন্দের সফটওয়্যার বা সাবস্ক্রিপশন সিলেক্ট করুন।' },
  { n: '02', title: 'পেমেন্ট করুন',         desc: 'বিকাশ, নগদ বা রকেটে নিরাপদে পেমেন্ট করুন।' },
  { n: '03', title: 'ডেলিভারি পান',         desc: 'মিনিটের মধ্যে ইমেইলে লাইসেন্স কি বা সাবস্ক্রিপশন পাঠানো হবে।' },
  { n: '04', title: 'Activate করুন',        desc: 'প্রোডাক্ট অ্যাক্টিভেট করুন এবং যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন।' },
];

const WhyChooseUs = () => (
  <section className="py-20 px-4 sm:px-6" style={{ borderTop: '1px solid hsl(var(--border))' }}>
    <div className="max-w-screen-xl mx-auto">

      {/* ── Features ── */}
      <div className="mb-20">
        <div className="mb-10">
          <p className="section-eyebrow mb-2">// Why Choose Us</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Why <span style={{ color: 'var(--gold)' }}>Shahed Store?</span>
          </h2>
          <span className="divider-gold" />
          <p className="text-muted-foreground mt-4 max-w-lg text-sm leading-relaxed">
            Bangladesh's most trusted digital software marketplace since 2020.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex gap-4 p-5 rounded-lg transition-all duration-250 cursor-default"
              style={{ backgroundColor: 'var(--surface-1)', border: '1px solid hsl(var(--border))' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--gold)';
                el.style.boxShadow = 'inset 0 0 0 1px var(--gold)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'hsl(var(--border))';
                el.style.boxShadow = 'none';
              }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center mt-0.5"
                style={{ backgroundColor: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid hsla(38,90%,52%,0.25)' }}>
                {f.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>{f.title}</h3>
                  <span className="text-[10px] font-bold ml-2 flex-shrink-0"
                    style={{ fontFamily: 'DM Mono, monospace', color: 'hsl(var(--border))' }}>{f.n}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How to Order ── */}
      <div className="mb-16">
        <div className="mb-10">
          <p className="section-eyebrow mb-2" style={{ color: 'var(--crimson)' }}>// Process</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
            অর্ডার করবেন <span style={{ color: 'var(--gold)' }}>কিভাবে?</span>
          </h2>
          <span className="divider-gold" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div key={i} className="relative p-6 rounded-lg overflow-hidden transition-all duration-250"
              style={{ backgroundColor: 'var(--surface-1)', border: '1px solid hsl(var(--border))' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--gold)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'hsl(var(--border))'; }}
            >
              {/* Big watermark number */}
              <div className="absolute -bottom-2 -right-1 text-8xl font-black select-none pointer-events-none leading-none"
                style={{ fontFamily: 'Syne, sans-serif', color: 'hsla(38,90%,52%,0.06)' }}>{step.n}</div>

              <div className="relative z-10">
                <div className="tag-gold mb-4">Step {step.n}</div>
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>

              {/* Connector line (not for last) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px z-20"
                  style={{ backgroundColor: 'var(--gold)', opacity: 0.4 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="rounded-lg p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        style={{ backgroundColor: 'var(--surface-1)', border: '1px solid hsl(var(--border))' }}>
        {[
          { n: '5,000+', l: 'Happy Customers' },
          { n: '500+',   l: 'Products' },
          { n: '99.9%',  l: 'Satisfaction' },
          { n: '24/7',   l: 'Support' },
        ].map((s, i) => (
          <div key={i}>
            <div className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--gold)' }}>{s.n}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider" style={{ fontFamily: 'DM Mono, monospace' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
