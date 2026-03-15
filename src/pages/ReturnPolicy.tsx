import { RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle, MessageCircle, Mail, Phone } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { FloatingButtons } from '@/components/store/Extras';

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
        <span className="text-white">{icon}</span>
      </div>
      <h2 className="font-sora font-bold text-lg" style={{ color: 'hsl(226,35%,14%)' }}>{title}</h2>
    </div>
    <div className="pl-12 space-y-3 text-[14px] leading-relaxed" style={{ color: 'hsl(226,25%,38%)' }}>
      {children}
    </div>
  </div>
);

const Bullet = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <li className="flex items-start gap-2">
    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color || 'hsl(258,78%,55%)' }} />
    <span>{children}</span>
  </li>
);

const ReturnPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead title="Return Policy — Shahed Store" description="Shahed Store-এর রিটার্ন পলিসি জানুন। ডিজিটাল পণ্য রিটার্নের নিয়ম ও বিকল্প সমাধান।" />
    <Navbar />

    <div className="relative overflow-hidden pt-20 pb-14"
      style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)', borderBottom: '1px solid hsla(258,78%,55%,0.12)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
          style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.18)', color: 'hsl(258,78%,50%)' }}>
          <RotateCcw size={14} /> Return Guidelines
        </div>
        <h1 className="font-sora font-black text-4xl sm:text-5xl mb-4" style={{ color: 'hsl(226,35%,12%)' }}>Return Policy</h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(226,25%,42%)' }}>
          ডিজিটাল পণ্যের ক্ষেত্রে রিটার্ন নীতি ফিজিক্যাল পণ্যের চেয়ে ভিন্ন। আমাদের নীতি স্বচ্ছভাবে জানুন।
        </p>
        <p className="text-xs mt-4 font-fira" style={{ color: 'hsl(226,25%,55%)' }}>সর্বশেষ আপডেট: মার্চ ২০২৬</p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-3xl p-8 sm:p-12 mb-8"
        style={{ background: 'white', border: '1px solid hsla(258,78%,55%,0.10)', boxShadow: '0 4px 40px hsla(258,78%,55%,0.06)' }}>

        <div className="p-5 rounded-2xl mb-10"
          style={{ background: 'hsla(38,100%,55%,0.08)', border: '1px solid hsla(38,100%,55%,0.25)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} style={{ color: 'hsl(38,100%,42%)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-[14px] leading-relaxed" style={{ color: 'hsl(38,60%,28%)' }}>
              <strong>গুরুত্বপূর্ণ:</strong> ডিজিটাল পণ্য (সফটওয়্যার লাইসেন্স, সাবস্ক্রিপশন ইত্যাদি) একবার ডেলিভার ও ব্যবহার হয়ে গেলে সাধারণত রিটার্ন সম্ভব নয়। তবে নির্দিষ্ট পরিস্থিতিতে আমরা বিকল্প সমাধান প্রদান করি।
            </p>
          </div>
        </div>

        <Section icon={<CheckCircle size={16} />} title="১. রিটার্ন গ্রহণযোগ্য পরিস্থিতি">
          <ul className="space-y-2">
            <Bullet color="hsl(142,72%,40%)">পণ্য সম্পূর্ণ কাজ না করলে এবং আমাদের সাপোর্ট সমাধান দিতে না পারলে</Bullet>
            <Bullet color="hsl(142,72%,40%)">ডেলিভার হওয়া পণ্য অর্ডার করা পণ্যের সাথে না মিললে</Bullet>
            <Bullet color="hsl(142,72%,40%)">ইতিমধ্যে ব্যবহৃত/নষ্ট লাইসেন্স কী ডেলিভার হলে</Bullet>
            <Bullet color="hsl(142,72%,40%)">স্টক সমস্যার কারণে সঠিক পণ্য দেওয়া সম্ভব না হলে</Bullet>
          </ul>
        </Section>

        <Section icon={<XCircle size={16} />} title="২. রিটার্ন গ্রহণযোগ্য নয় যখন">
          <ul className="space-y-2">
            <Bullet color="hsl(0,72%,45%)">লাইসেন্স কী সফলভাবে অ্যাক্টিভেট করা হয়ে গেলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">পণ্য পাওয়ার ২৪ ঘণ্টার পরে অভিযোগ করলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">"মন পরিবর্তন" বা ভুল পণ্য নিজে কিনলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">ক্রেতার ডিভাইস/ইন্টারনেট সমস্যার কারণে কাজ না করলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">পণ্যের শর্তবিরুদ্ধ ব্যবহারের পরে সমস্যা হলে</Bullet>
          </ul>
        </Section>

        <Section icon={<RotateCcw size={16} />} title="৩. বিকল্প সমাধান (রিটার্নের পরিবর্তে)">
          <p>রিটার্ন সম্ভব না হলেও আমরা নিচের সমাধান দিতে সচেষ্ট:</p>
          <div className="space-y-3 mt-3">
            {[
              { icon: '🔄', title: 'প্রতিস্থাপন', desc: 'কাজ না করা পণ্যের পরিবর্তে নতুন কার্যকর পণ্য সরবরাহ' },
              { icon: '🛠️', title: 'টেকনিক্যাল সাপোর্ট', desc: 'আমাদের বিশেষজ্ঞ দল ব্যক্তিগতভাবে সমস্যা সমাধান করবে' },
              { icon: '💰', title: 'স্টোর ক্রেডিট', desc: 'রিফান্ডের পরিবর্তে পরবর্তী কেনাকাটায় ব্যবহারের জন্য ক্রেডিট' },
              { icon: '♻️', title: 'পণ্য বিনিময়', desc: 'সমতুল্য মূল্যের ভিন্ন পণ্যের সাথে বিনিময়ের সুবিধা' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: 'hsla(258,78%,55%,0.04)', border: '1px solid hsla(258,78%,55%,0.10)' }}>
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="font-bold text-[13px]" style={{ color: 'hsl(226,35%,18%)' }}>{item.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'hsl(226,25%,45%)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<Clock size={16} />} title="৪. রিটার্ন প্রক্রিয়া">
          <ul className="space-y-2">
            <Bullet>পণ্য পাওয়ার <strong>২৪ ঘণ্টার মধ্যে</strong> আমাদের জানান</Bullet>
            <Bullet>সমস্যার <strong>স্ক্রিনশট বা ভিডিও</strong> সহ অর্ডার নম্বর পাঠান</Bullet>
            <Bullet>আমাদের টিম <strong>৬ ঘণ্টার মধ্যে</strong> সাড়া দেবে</Bullet>
            <Bullet>যাচাইয়ের পরে রিটার্ন, বিনিময় বা রিফান্ড প্রক্রিয়া শুরু হবে</Bullet>
          </ul>
        </Section>

        <div className="mt-8 rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%), hsl(200,60%,96%))', border: '1px solid hsla(258,78%,55%,0.15)' }}>
          <h3 className="font-sora font-bold text-base mb-3" style={{ color: 'hsl(226,35%,14%)' }}>রিটার্ন রিকোয়েস্ট</h3>
          <div className="space-y-2 text-[13px]" style={{ color: 'hsl(226,25%,38%)' }}>
            <p className="flex items-center gap-2"><MessageCircle size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(258,78%,50%)' }}>WhatsApp: 01840-099853</a></p>
            <p className="flex items-center gap-2"><Mail size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="mailto:info@shahedstore.com.bd" style={{ color: 'hsl(258,78%,50%)' }}>info@shahedstore.com.bd</a></p>
            <p className="flex items-center gap-2"><Phone size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="tel:01840099853" style={{ color: 'hsl(258,78%,50%)' }}>01840-099853</a></p>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    <FloatingButtons />
  </div>
);

export default ReturnPolicy;
