import { RefreshCw, CheckCircle, XCircle, Clock, MessageCircle, Mail, Phone, AlertTriangle } from 'lucide-react';
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

const RefundPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead title="Refund Policy — Shahed Store" description="Shahed Store-এর রিফান্ড পলিসি জানুন। কখন ও কীভাবে রিফান্ড পাবেন তা বিস্তারিত পড়ুন।" />
    <Navbar />

    <div className="relative overflow-hidden pt-20 pb-14"
      style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)', borderBottom: '1px solid hsla(258,78%,55%,0.12)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
          style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.18)', color: 'hsl(258,78%,50%)' }}>
          <RefreshCw size={14} /> Customer Protection
        </div>
        <h1 className="font-sora font-black text-4xl sm:text-5xl mb-4" style={{ color: 'hsl(226,35%,12%)' }}>Refund Policy</h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(226,25%,42%)' }}>
          আমরা আমাদের গ্রাহকদের সন্তুষ্টিকে সর্বোচ্চ অগ্রাধিকার দিই। আমাদের রিফান্ড নীতি স্বচ্ছ ও ন্যায্য।
        </p>
        <p className="text-xs mt-4 font-fira" style={{ color: 'hsl(226,25%,55%)' }}>সর্বশেষ আপডেট: মার্চ ২০২৬</p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-3xl p-8 sm:p-12 mb-8"
        style={{ background: 'white', border: '1px solid hsla(258,78%,55%,0.10)', boxShadow: '0 4px 40px hsla(258,78%,55%,0.06)' }}>

        {/* Quick summary cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="rounded-2xl p-5 flex items-start gap-3"
            style={{ background: 'hsla(142,72%,50%,0.07)', border: '1px solid hsla(142,72%,50%,0.20)' }}>
            <CheckCircle size={22} style={{ color: 'hsl(142,72%,40%)', flexShrink: 0 }} />
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: 'hsl(142,50%,25%)' }}>রিফান্ড পাবেন</p>
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(142,30%,35%)' }}>পণ্য কাজ না করলে বা ভুল ডেলিভারি হলে ২৪ ঘণ্টার মধ্যে রিপোর্ট করুন।</p>
            </div>
          </div>
          <div className="rounded-2xl p-5 flex items-start gap-3"
            style={{ background: 'hsla(0,72%,50%,0.07)', border: '1px solid hsla(0,72%,50%,0.20)' }}>
            <XCircle size={22} style={{ color: 'hsl(0,72%,45%)', flexShrink: 0 }} />
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: 'hsl(0,50%,30%)' }}>রিফান্ড পাবেন না</p>
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(0,30%,40%)' }}>পণ্য ব্যবহার করার পরে বা ২৪ ঘণ্টার পরে সাধারণত রিফান্ড প্রযোজ্য নয়।</p>
            </div>
          </div>
        </div>

        <Section icon={<CheckCircle size={16} />} title="১. রিফান্ড পাওয়ার যোগ্য পরিস্থিতি">
          <ul className="space-y-2">
            <Bullet color="hsl(142,72%,40%)">ডেলিভার করা লাইসেন্স কী সম্পূর্ণ কাজ না করলে</Bullet>
            <Bullet color="hsl(142,72%,40%)">অর্ডার করা পণ্যের বদলে ভিন্ন পণ্য ডেলিভার হলে</Bullet>
            <Bullet color="hsl(142,72%,40%)">পেমেন্ট সফল হলেও ৩ ঘণ্টার মধ্যে পণ্য না পেলে</Bullet>
            <Bullet color="hsl(142,72%,40%)">একই অর্ডারের জন্য ডাবল পেমেন্ট হয়ে গেলে</Bullet>
            <Bullet color="hsl(142,72%,40%)">পণ্যটি স্টক শেষ হওয়ায় সরবরাহ করা সম্ভব না হলে</Bullet>
          </ul>
        </Section>

        <Section icon={<XCircle size={16} />} title="২. রিফান্ড প্রযোজ্য নয় যখন">
          <ul className="space-y-2">
            <Bullet color="hsl(0,72%,45%)">লাইসেন্স কী সফলভাবে ব্যবহার করা হয়ে গেলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">পণ্য ডেলিভারির ২৪ ঘণ্টার পরে অভিযোগ করলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">ক্রেতার নিজের ভুলে পণ্য ইনস্টল বা ব্যবহার করতে না পারলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">ইন্টারনেট সংযোগ বা ডিভাইস সমস্যার কারণে পণ্য কাজ না করলে</Bullet>
            <Bullet color="hsl(0,72%,45%)">পণ্যটি ক্রয়ের পর "মন পরিবর্তন" হলে (change of mind)</Bullet>
            <Bullet color="hsl(0,72%,45%)">শর্তের বাইরে ব্যবহারের পর সমস্যা হলে</Bullet>
          </ul>
        </Section>

        <Section icon={<Clock size={16} />} title="৩. রিফান্ড প্রক্রিয়া ও সময়সীমা">
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,55%,0.12)' }}>
              <p className="font-bold text-sm mb-2" style={{ color: 'hsl(226,35%,20%)' }}>ধাপ ১: অভিযোগ দাখিল (২৪ ঘণ্টার মধ্যে)</p>
              <p className="text-xs">WhatsApp/ইমেইলে অর্ডার নম্বর, সমস্যার বিবরণ ও স্ক্রিনশট পাঠান।</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,55%,0.12)' }}>
              <p className="font-bold text-sm mb-2" style={{ color: 'hsl(226,35%,20%)' }}>ধাপ ২: যাচাই (১–৬ ঘণ্টা)</p>
              <p className="text-xs">আমাদের টিম সমস্যাটি যাচাই করবে এবং সমাধান বা রিফান্ড অনুমোদন করবে।</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,55%,0.12)' }}>
              <p className="font-bold text-sm mb-2" style={{ color: 'hsl(226,35%,20%)' }}>ধাপ ৩: রিফান্ড প্রদান (১–৩ কার্যদিবস)</p>
              <p className="text-xs">অনুমোদিত রিফান্ড মূল পেমেন্ট মাধ্যমে ফেরত দেওয়া হবে (bKash/Nagad ইত্যাদি)।</p>
            </div>
          </div>
        </Section>

        <Section icon={<AlertTriangle size={16} />} title="৪. বিশেষ ক্ষেত্র">
          <ul className="space-y-2">
            <Bullet>সাবস্ক্রিপশন পণ্যের ক্ষেত্রে: অব্যবহৃত মাসের সমানুপাতিক রিফান্ড বিবেচনা করা হয়</Bullet>
            <Bullet>কম্বো/বান্ডেল অফারের ক্ষেত্রে: শুধুমাত্র সমস্যাযুক্ত পণ্যের রিফান্ড প্রযোজ্য</Bullet>
            <Bullet>ডিসকাউন্ট মূল্যে কেনা পণ্যে রিফান্ড হলে ডিসকাউন্ট মূল্যই ফেরত দেওয়া হবে</Bullet>
          </ul>
        </Section>

        <div className="mt-8 rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%), hsl(200,60%,96%))', border: '1px solid hsla(258,78%,55%,0.15)' }}>
          <h3 className="font-sora font-bold text-base mb-3 flex items-center gap-2" style={{ color: 'hsl(226,35%,14%)' }}>
            <MessageCircle size={16} style={{ color: 'hsl(258,78%,50%)' }} /> রিফান্ড রিকোয়েস্ট করুন
          </h3>
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

export default RefundPolicy;
