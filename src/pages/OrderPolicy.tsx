import { ShoppingCart, CreditCard, Clock, Package, AlertTriangle, CheckCircle, Mail, Phone, MessageCircle } from 'lucide-react';
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

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'hsl(258,78%,55%)' }} />
    <span>{children}</span>
  </li>
);

const Step = ({ num, title, desc }: { num: string; title: string; desc: string }) => (
  <div className="flex items-start gap-4">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-sora font-black text-sm text-white"
      style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>{num}</div>
    <div>
      <p className="font-bold text-sm mb-1" style={{ color: 'hsl(226,35%,18%)' }}>{title}</p>
      <p className="text-[13px]" style={{ color: 'hsl(226,25%,42%)' }}>{desc}</p>
    </div>
  </div>
);

const OrderPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead title="Order Policy — Shahed Store" description="Shahed Store-এ অর্ডার করার নিয়মকানুন ও প্রক্রিয়া জানুন।" />
    <Navbar />

    <div className="relative overflow-hidden pt-20 pb-14"
      style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)', borderBottom: '1px solid hsla(258,78%,55%,0.12)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
          style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.18)', color: 'hsl(258,78%,50%)' }}>
          <ShoppingCart size={14} /> Order Guidelines
        </div>
        <h1 className="font-sora font-black text-4xl sm:text-5xl mb-4" style={{ color: 'hsl(226,35%,12%)' }}>Order Policy</h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(226,25%,42%)' }}>
          অর্ডার দেওয়া থেকে পণ্য পাওয়া পর্যন্ত সম্পূর্ণ প্রক্রিয়া এবং নিয়মকানুন জানুন।
        </p>
        <p className="text-xs mt-4 font-fira" style={{ color: 'hsl(226,25%,55%)' }}>সর্বশেষ আপডেট: মার্চ ২০২৬</p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-3xl p-8 sm:p-12 mb-8"
        style={{ background: 'white', border: '1px solid hsla(258,78%,55%,0.10)', boxShadow: '0 4px 40px hsla(258,78%,55%,0.06)' }}>

        <Section icon={<ShoppingCart size={16} />} title="১. অর্ডার করার ধাপ">
          <div className="space-y-4 mt-2">
            <Step num="১" title="পণ্য বেছে নিন" desc="আমাদের স্টোর থেকে পছন্দের পণ্যটি কার্টে যোগ করুন বা সরাসরি Buy Now-এ ক্লিক করুন।" />
            <Step num="২" title="পেমেন্ট করুন" desc="bKash, Nagad, Rocket বা অন্য মাধ্যমে পেমেন্ট করুন এবং ট্রানজেকশন আইডি সংগ্রহ করুন।" />
            <Step num="৩" title="অর্ডার কনফার্ম করুন" desc="চেকআউটে ট্রানজেকশন আইডি এবং আপনার ইমেইল দিয়ে অর্ডার সম্পন্ন করুন।" />
            <Step num="৪" title="পণ্য পান" desc="পেমেন্ট যাচাইয়ের পর সাধারণত ৫–৩০ মিনিটের মধ্যে ইমেইলে/অ্যাকাউন্টে পণ্য পাঠানো হবে।" />
          </div>
        </Section>

        <Section icon={<CreditCard size={16} />} title="২. পেমেন্ট নির্দেশিকা">
          <p>পেমেন্ট করার আগে নিচের তথ্যগুলো জেনে নিন:</p>
          <ul className="space-y-2 mt-2">
            <Bullet>পেমেন্টের পরে ট্রানজেকশন আইডি (TrxID) অবশ্যই সংরক্ষণ করুন</Bullet>
            <Bullet>পেমেন্ট সফল হলে SMS/নোটিফিকেশন আসবে — স্ক্রিনশট রাখুন</Bullet>
            <Bullet>bKash থেকে পাঠাতে হবে: <strong>01820060046</strong></Bullet>
            <Bullet>Nagad/Rocket/উপায় থেকে পাঠাতে হবে: <strong>01840099853</strong></Bullet>
            <Bullet>পেমেন্টের পরে ৩ ঘণ্টার মধ্যে পণ্য না পেলে আমাদের জানান</Bullet>
          </ul>
        </Section>

        <Section icon={<Clock size={16} />} title="৩. অর্ডার যাচাই প্রক্রিয়া">
          <ul className="space-y-2">
            <Bullet>পেমেন্ট যাচাই করতে সাধারণত ৫–১৫ মিনিট সময় লাগে</Bullet>
            <Bullet>পিক আওয়ারে (রাত ৮টা–১২টা) সময় বাড়তে পারে (সর্বোচ্চ ২ ঘণ্টা)</Bullet>
            <Bullet>ছুটির দিনেও আমাদের সার্ভিস চালু থাকে</Bullet>
            <Bullet>অর্ডার স্ট্যাটাস My Account থেকে ট্র্যাক করতে পারবেন</Bullet>
          </ul>
        </Section>

        <Section icon={<Package size={16} />} title="৪. অর্ডার বাতিল নীতি">
          <ul className="space-y-2">
            <Bullet>পণ্য ডেলিভারের আগে অর্ডার বাতিল করতে পারবেন — সম্পূর্ণ রিফান্ড পাবেন</Bullet>
            <Bullet>পণ্য ডেলিভারের পরে অর্ডার বাতিল সাধারণত সম্ভব নয় (Refund Policy দেখুন)</Bullet>
            <Bullet>যদি আমাদের কারণে ডেলিভারি না হয়, স্বয়ংক্রিয়ভাবে অর্ডার বাতিল ও রিফান্ড দেওয়া হবে</Bullet>
          </ul>
        </Section>

        <Section icon={<CheckCircle size={16} />} title="৫. অর্ডার সংক্রান্ত গুরুত্বপূর্ণ তথ্য">
          <ul className="space-y-2">
            <Bullet>অর্ডার নম্বর সংরক্ষণ করুন — সাপোর্টে যোগাযোগের সময় প্রয়োজন হবে</Bullet>
            <Bullet>ইমেইল ঠিকানা সঠিক দিন — ডেলিভারি ইমেইলে যাবে</Bullet>
            <Bullet>স্প্যাম ফোল্ডার চেক করুন যদি ইমেইল না আসে</Bullet>
            <Bullet>একটি অর্ডারে একাধিক পণ্য কিনতে পারবেন</Bullet>
          </ul>
        </Section>

        <Section icon={<AlertTriangle size={16} />} title="৬. অর্ডার প্রতারণা প্রতিরোধ">
          <ul className="space-y-2">
            <Bullet>জালিয়াতি পেমেন্ট শনাক্ত হলে অর্ডার বাতিল ও আইনগত পদক্ষেপ নেওয়া হবে</Bullet>
            <Bullet>চার্জব্যাক করলে অ্যাকাউন্ট স্থায়ীভাবে ব্যান করা হবে</Bullet>
            <Bullet>একই পণ্যের একাধিক অর্ডার করলে অতিরিক্ত অর্ডার বাতিল হতে পারে</Bullet>
          </ul>
        </Section>

        <div className="mt-8 rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%), hsl(200,60%,96%))', border: '1px solid hsla(258,78%,55%,0.15)' }}>
          <h3 className="font-sora font-bold text-base mb-3" style={{ color: 'hsl(226,35%,14%)' }}>অর্ডার সমস্যায় যোগাযোগ</h3>
          <div className="space-y-2 text-[13px]" style={{ color: 'hsl(226,25%,38%)' }}>
            <p className="flex items-center gap-2"><MessageCircle size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(258,78%,50%)' }}>WhatsApp: 01840-099853 (সবচেয়ে দ্রুত)</a></p>
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

export default OrderPolicy;
