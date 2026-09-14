import { useEffect, useState } from 'react';
import { ArrowRight, Bolt, Code2, Palette, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const stats = [
  { value: '150+', label: 'Projects' },
  { value: '98%', label: 'Satisfaction' },
  { value: '5+', label: 'Years' },
  { value: '24/7', label: 'Support' },
];

const offerEndsAt = Date.now() + (6 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (54 * 1000);

const getTimeLeft = () => {
  const remaining = Math.max(0, offerEndsAt - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    mins: Math.floor((remaining / 60_000) % 60),
    secs: Math.floor((remaining / 1_000) % 60),
  };
};

const services = [
  {
    title: 'Web Development',
    note: 'Custom websites built for growth',
    price: '৳৫,০০০',
    previous: '৳১০,০০০',
    badge: '#1 BEST SELLER',
    href: '/shop?category=web-development',
    icon: Code2,
    tone: 'violet',
  },
  {
    title: 'Graphics Design',
    note: 'Brand visuals that make an impact',
    price: '৳১,৫০০',
    previous: '৳৩,৫০০',
    badge: 'TRENDING',
    href: '/shop?category=graphics-design',
    icon: Palette,
    tone: 'pink',
  },
] as const;

const HeroBanner = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.mins, label: 'Mins' },
    { value: timeLeft.secs, label: 'Secs' },
  ];

  return (
  <section className="hero-reference relative mt-[64px] overflow-hidden bg-hero-canvas text-hero-foreground lg:mt-[54px]" aria-labelledby="hero-heading">
    <div className="hero-grid-pattern" aria-hidden="true" />
    <div className="hero-ambient hero-ambient-left" aria-hidden="true" />
    <div className="hero-ambient hero-ambient-right" aria-hidden="true" />

    <div className="container-fluid relative z-10 grid min-h-[615px] max-w-[1210px] grid-cols-1 items-center gap-10 pb-12 pt-[148px] md:py-16 lg:grid-cols-12 lg:gap-14 lg:py-[70px]">
      <div className="lg:col-span-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-hero-border bg-hero-glass px-4 py-2 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-hero-pink shadow-hero-pink" />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-hero-muted sm:text-[10px]">Professional IT Agency — Bangladesh</span>
        </div>

        <h2 id="hero-heading" className="mt-8 max-w-[420px] text-5xl font-extrabold leading-[1.04] text-hero-foreground sm:text-6xl lg:text-[3.75rem]">
          Build Your
          <span className="mt-1 block bg-hero-title bg-clip-text text-transparent">Digital</span>
          <span className="block bg-hero-title bg-clip-text text-transparent">Empire</span>
        </h2>

        <p className="mt-6 max-w-xl text-sm leading-7 text-hero-muted sm:text-base">
          Premium web development, graphic design &amp; digital marketing solutions for modern businesses — crafted to convert, impress &amp; grow.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-[48px] rounded-lg bg-hero-action px-6 text-hero-action-foreground shadow-hero-action hover:opacity-90">
            <Link to="/contact-us"><Bolt aria-hidden="true" />Start Your Project</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[48px] rounded-lg border-hero-border bg-hero-glass px-6 text-hero-foreground hover:bg-hero-glass-strong hover:text-hero-foreground">
            <Link to="/shop"><Play aria-hidden="true" />View Portfolio</Link>
          </Button>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-6 border-t border-hero-border pt-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-extrabold text-hero-foreground sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase text-hero-subtle sm:text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 lg:col-span-6">
        <div className="rounded-[22px] border border-hero-border bg-hero-glass p-5 shadow-hero-card backdrop-blur-2xl sm:p-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-hero-online shadow-hero-online" />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-hero-muted">Special offer ends in</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
            {countdown.map((item) => (
              <div key={item.label} className="rounded-xl border border-hero-border bg-hero-panel px-2 py-4 text-center">
                <div className="text-2xl font-extrabold tabular-nums text-hero-foreground">{String(item.value).padStart(2, '0')}</div>
                <div className="mt-1 text-[7px] font-semibold uppercase tracking-[0.14em] text-hero-subtle sm:text-[8px]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link key={service.title} to={service.href} className={`hero-service-card hero-service-${service.tone} group block`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span className="hero-service-icon"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-hero-foreground sm:text-lg">{service.title}</h3>
                    <p className="mt-1 truncate text-[9px] text-hero-subtle">{service.title === 'Web Development' ? '92% booked this month' : '87% booked this month'}</p>
                  </div>
                </div>
                <span className="hero-service-badge shrink-0">{service.badge}</span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-hero-border pt-4">
                <div>
                  <div className="text-[9px] font-bold uppercase text-hero-subtle">Starting From</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-hero-foreground sm:text-2xl">{service.price}</span>
                    <span className="text-xs text-hero-subtle line-through">{service.previous}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-hero-accent sm:text-xs">
                  Order now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
  );
};

export default HeroBanner;