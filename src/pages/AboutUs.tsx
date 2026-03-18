import { Shield, Zap, HeadphonesIcon, Star, Users, Package, Award, Heart } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { FloatingButtons } from '@/components/store/Extras';
import { GlassCard, SectionCard } from '@/components/store/PolicyLayout';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const STATS = [
  { icon: '🛒', value: '৫০,০০০+', label: 'সফল অর্ডার' },
  { icon: '⭐', value: '৪.৯/৫', label: 'গড় রেটিং' },
  { icon: '👥', value: '৮০,০০০+', label: 'সন্তুষ্ট গ্রাহক' },
  { icon: '⚡', value: '৯৮%', label: 'ডেলিভারি সাফল্য' },
];

const VALUES = [
  { icon: <Shield size={20} />, title: 'বিশ্বস্ততা', desc: 'শুধুমাত্র অরিজিনাল ও যাচাইকৃত পণ্য বিক্রি করি। কোনো নকল বা মেয়াদোত্তীর্ণ লাইসেন্স নেই।', color: 'hsl(142,72%,38%)' },
  { icon: <Zap size={20} />, title: 'দ্রুত সেবা', desc: 'বেশিরভাগ অর্ডার ৫–৩০ মিনিটের মধ্যে ডেলিভার করা হয়। আপনার সময় আমাদের কাছে মূল্যবান।', color: A },
  { icon: <HeadphonesIcon size={20} />, title: '২৪/৭ সাপোর্ট', desc: 'যেকোনো সমস্যায় আমাদের টিম সর্বদা প্রস্তুত। WhatsApp, ইমেইল বা সাপোর্ট টিকেটের মাধ্যমে যোগাযোগ করুন।', color: B },
  { icon: <Heart size={20} />, title: 'গ্রাহক প্রথম', desc: 'আমাদের প্রতিটি সিদ্ধান্তের কেন্দ্রে আপনি। সর্বোত্তম অভিজ্ঞতা নিশ্চিত করাই আমাদের লক্ষ্য।', color: 'hsl(329,86%,56%)' },
];

const TEAM = [
  {
    name: 'সেলস টিম',
    role: 'Sales & Order Management',
    emoji: '🛍️',
    badge: '৫০,০০০+ অর্ডার সম্পন্ন',
    desc: 'আমাদের দক্ষ সেলস টিম প্রতিদিন শত শত অর্ডার নিখুঁতভাবে প্রসেস করে। সঠিক পণ্য, সঠিক সময়ে পৌঁছে দেওয়াই আমাদের প্রতিশ্রুতি।',
    highlight: 'hsl(142,72%,38%)',
  },
  {
    name: 'সাপোর্ট টিম',
    role: '২৪/৭ Customer Support',
    emoji: '🎧',
    badge: 'গড় রেসপন্স < ৫ মিনিট',
    desc: 'যেকোনো সমস্যায় আমরা মাত্র কয়েক মিনিটের মধ্যে সাড়া দিই। WhatsApp, লাইভ চ্যাট বা ইমেইলে — আমরা সর্বদা আপনার পাশে আছি।',
    highlight: 'hsl(258,78%,55%)',
  },
  {
    name: 'টেক টিম',
    role: 'Technical Support Experts',
    emoji: '⚙️',
    badge: 'ইনস্টলেশন গ্যারান্টি',
    desc: 'সফটওয়্যার ইনস্টলেশন, অ্যাক্টিভেশন ও কনফিগারেশনে আমাদের টেক বিশেষজ্ঞরা স্ক্রিন শেয়ারের মাধ্যমেও সহায়তা করতে সক্ষম।',
    highlight: 'hsl(200,90%,45%)',
  },
  {
    name: 'কোয়ালিটি টিম',
    role: 'Product Verification',
    emoji: '✅',
    badge: '১০০% যাচাইকৃত পণ্য',
    desc: 'প্রতিটি পণ্য বিক্রির আগে আমাদের কোয়ালিটি টিম যাচাই করে নেয়। কোনো মেয়াদোত্তীর্ণ বা নকল কী আমাদের কাছে নেই — গ্যারান্টি।',
    highlight: 'hsl(329,86%,56%)',
  },
];

const MILESTONES = [
  { year: '২০২২', title: 'যাত্রা শুরু', desc: 'ছোট পরিসরে ডিজিটাল সফটওয়্যার বিক্রি শুরু করি উদ্যম ও স্বপ্ন নিয়ে' },
  { year: '২০২৩', title: 'দ্রুত বিস্তার', desc: '১০,০০০+ গ্রাহক অর্জন ও অটোমেটেড ডেলিভারি সিস্টেম চালু' },
  { year: '২০২৪', title: 'নতুন উচ্চতা', desc: '৫০,০০০+ অর্ডার সম্পন্ন, ২৪/৭ সাপোর্ট টিম গঠন ও নতুন পণ্য লাইনআপ' },
  { year: '২০২৫', title: 'শীর্ষে', desc: '৮০,০০০+ বিশ্বস্ত গ্রাহক — বাংলাদেশের অন্যতম সেরা ডিজিটাল স্টোর' },
];

export default function AboutUs() {
  return (
    <div
      className="min-h-screen text-foreground"
      style={{ background: 'linear-gradient(145deg, hsl(258,55%,97%) 0%, hsl(220,40%,96%) 40%, hsl(200,50%,96%) 100%)' }}
    >
      <SEOHead
        title="About Shahed Store – Trusted Digital Software Shop in Bangladesh"
        description="Learn about Shahed Store – Bangladesh's most trusted digital software shop since 2020. Our mission, team, and commitment to delivering 100% genuine software at the best price."
        canonical="https://shahedstore.com.bd/about"
      />
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px]"
            style={{ background: `radial-gradient(circle, ${A}18, transparent 65%)` }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px]"
            style={{ background: `radial-gradient(circle, ${B}12, transparent 65%)` }} />
          <div className="absolute inset-0"
            style={{ backgroundImage: `radial-gradient(circle, ${A}0f 1px, transparent 1px)`, backgroundSize: '26px 26px' }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold mb-5"
            style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: `1px solid ${A}35`, color: A, boxShadow: `0 4px 16px ${A}20` }}>
            <Heart size={13} /> Our Story
          </div>

          <div className="inline-block px-8 py-5 rounded-3xl mb-5"
            style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.80), rgba(255,255,255,0.55))', backdropFilter: 'blur(32px)', border: '1.5px solid rgba(255,255,255,0.80)', boxShadow: `0 12px 50px ${A}18` }}>
            <h1 className="font-sora font-black text-4xl sm:text-5xl leading-none"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              About Us
            </h1>
          </div>

          <p className="text-[14px] max-w-lg mx-auto leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>
            বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার স্টোর। আমরা অরিজিনাল সফটওয়্যার সেরা দামে, ইনস্ট্যান্ট ডেলিভারি সহ প্রদান করি।
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="rounded-2xl p-5 text-center transition-all hover:-translate-y-1"
              style={{
                background: 'linear-gradient(155deg, rgba(255,255,255,0.80), rgba(255,255,255,0.55))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsla(258,78%,75%,0.22)',
                boxShadow: '0 4px 20px hsla(258,78%,55%,0.08)',
              }}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="font-sora font-black text-xl" style={{ background: `linear-gradient(135deg, ${A}, ${B})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
              <p className="text-[12px] mt-0.5 font-semibold" style={{ color: 'hsl(226,25%,50%)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Who We Are */}
        <GlassCard className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid hsla(258,78%,75%,0.15)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})`, boxShadow: `0 4px 12px ${A}50` }}>
              <Package size={16} className="text-white" />
            </div>
            <h2 className="font-sora font-black text-lg" style={{ color: 'hsl(226,35%,12%)' }}>আমরা কে?</h2>
          </div>
          <div className="space-y-4 text-[13.5px] leading-relaxed" style={{ color: 'hsl(226,25%,38%)' }}>
            <p>
              <strong style={{ color: 'hsl(226,35%,18%)' }}>Shahed Store</strong> বাংলাদেশের একটি বিশ্বস্ত ডিজিটাল সফটওয়্যার মার্কেটপ্লেস। আমরা <strong style={{ color: 'hsl(258,78%,50%)' }}>২০২২ সাল</strong> থেকে গ্রাহকদের কাছে অরিজিনাল উইন্ডোজ, অফিস, অ্যাডোবি, স্ট্রিমিং সাবস্ক্রিপশন, ভিপিএন এবং এআই টুলস সরবরাহ করে আসছি।
            </p>
            <p>
              আমাদের লক্ষ্য সহজ — প্রতিটি বাংলাদেশি ব্যবহারকারীর কাছে অরিজিনাল সফটওয়্যার সাশ্রয়ী মূল্যে এবং তাৎক্ষণিকভাবে পৌঁছে দেওয়া। কোনো হ্যাসেল নেই, কোনো ঝামেলা নেই — শুধু দ্রুত, নিরাপদ ও নির্ভরযোগ্য সেবা।
            </p>
            <p>
              আমরা বিশ্বাস করি, ডিজিটাল পণ্যের বাজারে স্বচ্ছতা ও বিশ্বাসযোগ্যতাই সবচেয়ে বড় সম্পদ। তাই আমরা প্রতিটি পণ্য যাচাই করে বিক্রি করি এবং বিক্রয়োত্তর সেবায় কোনো আপোষ করি না।
            </p>
          </div>
        </GlassCard>

        {/* Mission & Vision */}
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              icon: <Star size={16} />, title: 'আমাদের মিশন',
              text: 'বাংলাদেশের প্রতিটি ব্যবহারকারীর কাছে অরিজিনাল ডিজিটাল পণ্য সাশ্রয়ী মূল্যে ও তাৎক্ষণিকভাবে পৌঁছে দেওয়া। প্রযুক্তির সুবিধা সকলের নাগালে আনাই আমাদের মূল লক্ষ্য।',
              color: A,
            },
            {
              icon: <Award size={16} />, title: 'আমাদের ভিশন',
              text: 'দক্ষিণ এশিয়ার সবচেয়ে বিশ্বস্ত ও গ্রাহকবান্ধব ডিজিটাল সফটওয়্যার মার্কেটপ্লেস হিসেবে নিজেদের প্রতিষ্ঠিত করা। যেখানে প্রতিটি লেনদেন হবে স্বচ্ছ, নিরাপদ ও সন্তোষজনক।',
              color: B,
            },
          ].map(item => (
            <div key={item.title} className="rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45))', backdropFilter: 'blur(20px)', border: '1px solid hsla(258,78%,75%,0.22)', boxShadow: '0 2px 16px hsla(258,78%,55%,0.06)' }}>
              <div className="flex items-center gap-3 px-6 py-4"
                style={{ background: `linear-gradient(135deg, hsla(258,78%,55%,0.07), hsla(200,90%,45%,0.05))`, borderBottom: '1px solid hsla(258,78%,75%,0.15)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${B})`, boxShadow: `0 4px 12px ${item.color}50` }}>
                  <span className="text-white">{item.icon}</span>
                </div>
                <h2 className="font-sora font-bold text-[15px]" style={{ color: 'hsl(226,35%,14%)' }}>{item.title}</h2>
              </div>
              <div className="px-6 py-5 text-[13.5px] leading-relaxed" style={{ color: 'hsl(226,25%,38%)' }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>

        {/* Core Values */}
        <SectionCard icon={<Shield size={15} />} title="আমাদের মূল্যবোধ" accentFrom={A} accentTo={B}>
          <div className="grid sm:grid-cols-2 gap-3 mt-1">
            {VALUES.map(v => (
              <div key={v.title} className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: 'hsla(258,78%,55%,0.04)', border: '1px solid hsla(258,78%,75%,0.14)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${v.color}15`, border: `1px solid ${v.color}30` }}>
                  <span style={{ color: v.color }}>{v.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-[13px] mb-1" style={{ color: 'hsl(226,35%,16%)' }}>{v.title}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(226,25%,48%)' }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Team */}
        <SectionCard icon={<Users size={15} />} title="আমাদের টিম" accentFrom={A} accentTo={B}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
            {TEAM.map(member => (
              <div key={member.name} className="rounded-xl p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.70), rgba(255,255,255,0.40))', border: `1px solid ${member.highlight}25`, boxShadow: `0 2px 16px ${member.highlight}10` }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl"
                  style={{ background: `linear-gradient(135deg, ${member.highlight}18, ${member.highlight}08)`, border: `1px solid ${member.highlight}25` }}>
                  {member.emoji}
                </div>
                <p className="font-sora font-black text-[13.5px]" style={{ color: 'hsl(226,35%,14%)' }}>{member.name}</p>
                <p className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 mb-2"
                  style={{ background: `${member.highlight}15`, color: member.highlight }}>{member.role}</p>
                <div className="text-[10.5px] font-bold px-2 py-1 rounded-lg mb-3"
                  style={{ background: `${member.highlight}10`, color: member.highlight, border: `1px solid ${member.highlight}20` }}>
                  🏆 {member.badge}
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: 'hsl(226,25%,48%)' }}>{member.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Timeline */}
        <SectionCard icon={<Award size={15} />} title="আমাদের যাত্রা" accentFrom={A} accentTo={B}>
          <div className="relative mt-2">
            <div className="absolute left-[19px] top-2 bottom-2 w-px" style={{ background: `linear-gradient(to bottom, ${A}40, ${B}40)` }} />
            <div className="space-y-4">
              {MILESTONES.map((m, i) => (
                <div key={m.year} className="flex items-start gap-4 pl-1">
                  <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-sora font-black text-[10px] text-white"
                    style={{ background: `linear-gradient(135deg, ${A}, ${B})`, boxShadow: `0 4px 12px ${A}40` }}>
                    {i + 1}
                  </div>
                  <div className="rounded-xl px-4 py-3 flex-1"
                    style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,75%,0.15)' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${A}15`, color: A }}>{m.year}</span>
                      <span className="font-sora font-bold text-[13px]" style={{ color: 'hsl(226,35%,16%)' }}>{m.title}</span>
                    </div>
                    <p className="text-[12px]" style={{ color: 'hsl(226,25%,48%)' }}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* CTA */}
        <div className="rounded-2xl p-6 text-center"
          style={{ background: `linear-gradient(135deg, ${A}10, ${B}08)`, border: `1px solid ${A}25` }}>
          <p className="font-sora font-black text-lg mb-2" style={{ color: 'hsl(226,35%,14%)' }}>আমাদের সাথে কেনাকাটা শুরু করুন</p>
          <p className="text-[13px] mb-5" style={{ color: 'hsl(226,25%,45%)' }}>৮০,০০০+ সন্তুষ্ট গ্রাহকের বিশ্বাসের অংশীদার হন</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/shop"
              className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})`, boxShadow: `0 6px 20px ${A}35` }}>
              পণ্য দেখুন →
            </a>
            <a href="/contact"
              className="px-6 py-2.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.70)', border: `1px solid ${A}30`, color: A, backdropFilter: 'blur(12px)' }}>
              যোগাযোগ করুন
            </a>
          </div>
        </div>

      </div>

      <Footer />
      <FloatingButtons />
    </div>
  );
}
