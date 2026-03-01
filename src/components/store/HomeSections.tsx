import { Shield, Zap, Award, HeadphonesIcon, Clock, CreditCard, CheckCircle2, Star, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const trustBadges = [
  { icon: <Shield size={20} />, title: 'DBID Verified', sub: 'সরকার নিবন্ধিত' },
  { icon: <CheckCircle2 size={20} />, title: '১০০% অরিজিনাল', sub: 'জেনুইন পণ্য' },
  { icon: <Zap size={20} />, title: 'দ্রুত ডেলিভারি', sub: '১-৬ ঘণ্টায়' },
  { icon: <HeadphonesIcon size={20} />, title: '২৪/৭ সাপোর্ট', sub: 'সবসময় পাশে' },
];

const steps = [
  { num: '01', title: 'পণ্য বেছে নিন', desc: 'আপনার পছন্দের সফটওয়্যার বা সাবস্ক্রিপশন সিলেক্ট করুন' },
  { num: '02', title: 'পেমেন্ট করুন', desc: 'বিকাশ, নগদ বা রকেটে পেমেন্ট করুন ও ট্রানজেকশন আইডি দিন' },
  { num: '03', title: 'ডেলিভারি পান', desc: '১-৬ ঘণ্টার মধ্যে ইমেইলে লাইসেন্স কি পাঠানো হবে' },
];

const testimonials = [
  { name: 'Rakib Hossain', rating: 5, text: 'Windows 11 Pro নিলাম, মাত্র ২ ঘণ্টায় কি পেয়ে গেলাম। ১০০% কাজ করছে! অসাধারণ সার্ভিস।', date: '২ সপ্তাহ আগে' },
  { name: 'Farhan Ahmed', rating: 5, text: 'Adobe Creative Cloud এর দাম অন্যদের চেয়ে অনেক কম। অরিজিনাল প্রোডাক্ট পাওয়া গেছে, ধন্যবাদ।', date: '১ মাস আগে' },
  { name: 'Tasnim Islam', rating: 5, text: 'Office 365 নিয়েছিলাম। ইনস্টলেশনে একটু সমস্যা হচ্ছিল, WhatsApp সাপোর্ট তুরন্ত সমাধান দিয়েছে!', date: '৩ সপ্তাহ আগে' },
  { name: 'Maruf Khan', rating: 5, text: 'নেটফ্লিক্স সাবস্ক্রিপশন নিলাম, দাম একদম কম। সবাইকে রেকমেন্ড করব।', date: '৫ দিন আগে' },
];

const HomeSections = () => (
  <>
    {/* Trust Badges */}
    <section className="py-10 px-4 border-b border-border/50">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        {trustBadges.map((b, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              {b.icon}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{b.title}</p>
              <p className="text-muted-foreground text-xs">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* How it works */}
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">প্রক্রিয়া</span>
          <h2 className="text-3xl font-bold text-foreground mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            কীভাবে কাজ করে?
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 relative">
          <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
          {steps.map((step, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 text-center hover:border-primary/40 transition-all relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background font-bold text-xl mx-auto mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {step.num}
              </div>
              <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="py-16 px-4 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">রিভিউ</span>
          <h2 className="text-3xl font-bold text-foreground mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            গ্রাহকরা কী বলছেন
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 hover:border-primary/40 transition-all">
              <div className="flex mb-2">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={13} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background text-xs font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <span className="text-foreground text-xs font-medium">{t.name}</span>
                </div>
                <span className="text-muted-foreground text-[10px]">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Support Banner */}
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border border-primary/20 relative overflow-hidden">
          <div className="orb orb-1 -top-20 -right-20 opacity-10" />
          <div className="orb orb-2 -bottom-20 -left-20 opacity-10" />
          <div className="relative z-10">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              সাহায্য দরকার?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              আমাদের বিশেষজ্ঞ টিম সবসময় আপনার পাশে আছে। WhatsApp বা সাপোর্ট টিকেটের মাধ্যমে যোগাযোগ করুন।
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="https://wa.me/8801840099853"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                <MessageCircle size={18} />
                WhatsApp সাপোর্ট
              </a>
              <Link
                to="/support"
                className="flex items-center gap-2 glass-card px-6 py-3 rounded-xl font-medium text-foreground hover:border-primary/50 transition-all"
              >
                টিকেট সাবমিট করুন
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default HomeSections;
