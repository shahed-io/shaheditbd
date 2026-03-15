import { Zap, Mail, Clock, Package, CheckCircle, AlertTriangle, MessageCircle, Phone } from 'lucide-react';
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

const DeliveryInfo = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead title="Delivery Info — Shahed Store" description="Shahed Store-এর ডেলিভারি প্রক্রিয়া, সময়সীমা ও পদ্ধতি সম্পর্কে বিস্তারিত জানুন।" />
    <Navbar />

    <div className="relative overflow-hidden pt-20 pb-14"
      style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)', borderBottom: '1px solid hsla(258,78%,55%,0.12)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
          style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.18)', color: 'hsl(258,78%,50%)' }}>
          <Zap size={14} /> Instant Digital Delivery
        </div>
        <h1 className="font-sora font-black text-4xl sm:text-5xl mb-4" style={{ color: 'hsl(226,35%,12%)' }}>Delivery Info</h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(226,25%,42%)' }}>
          আমরা সম্পূর্ণ ডিজিটাল ডেলিভারি প্রদান করি। কোনো ফিজিক্যাল শিপমেন্ট নেই — পণ্য সরাসরি আপনার ইনবক্সে পৌঁছে যায়।
        </p>
        <p className="text-xs mt-4 font-fira" style={{ color: 'hsl(226,25%,55%)' }}>সর্বশেষ আপডেট: মার্চ ২০২৬</p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-3xl p-8 sm:p-12 mb-8"
        style={{ background: 'white', border: '1px solid hsla(258,78%,55%,0.10)', boxShadow: '0 4px 40px hsla(258,78%,55%,0.06)' }}>

        {/* Delivery time cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '⚡', time: '৫–৩০ মিনিট', label: 'সাধারণ অর্ডার', color: 'hsl(142,72%,40%)' },
            { icon: '🌙', time: '৩০ মিনিট–২ ঘণ্টা', label: 'পিক আওয়ার (রাত ৮–১২টা)', color: 'hsl(38,100%,48%)' },
            { icon: '🕐', time: 'সর্বোচ্চ ২৪ ঘণ্টা', label: 'বিশেষ পরিস্থিতিতে', color: 'hsl(258,78%,55%)' },
          ].map(card => (
            <div key={card.label} className="rounded-2xl p-5 text-center"
              style={{ background: 'hsla(258,78%,55%,0.04)', border: '1px solid hsla(258,78%,55%,0.12)' }}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <p className="font-sora font-black text-lg mb-1" style={{ color: card.color }}>{card.time}</p>
              <p className="text-[11px] font-semibold" style={{ color: 'hsl(226,25%,48%)' }}>{card.label}</p>
            </div>
          ))}
        </div>

        <Section icon={<Mail size={16} />} title="১. ডেলিভারি পদ্ধতি">
          <p>আমাদের সমস্ত পণ্য ডিজিটাল ফরম্যাটে সরবরাহ করা হয়:</p>
          <ul className="space-y-2 mt-2">
            <Bullet><strong>ইমেইল ডেলিভারি:</strong> লাইসেন্স কী, অ্যাক্টিভেশন গাইড ও প্রয়োজনীয় নির্দেশনা সহ</Bullet>
            <Bullet><strong>অ্যাকাউন্ট ডেলিভারি:</strong> My Account → My Orders থেকে সরাসরি ডাউনলোড</Bullet>
            <Bullet><strong>WhatsApp:</strong> কিছু ক্ষেত্রে সরাসরি WhatsApp-এও পাঠানো হতে পারে</Bullet>
          </ul>
        </Section>

        <Section icon={<Package size={16} />} title="২. পণ্য অনুযায়ী ডেলিভারি বিবরণ">
          <div className="space-y-3 mt-2">
            {[
              { name: 'Windows / Office লাইসেন্স কী', delivery: 'ইমেইলে কী + অ্যাক্টিভেশন গাইড', time: '৫–১৫ মিনিট' },
              { name: 'Adobe Creative Cloud', delivery: 'লাইসেন্স কী বা শেয়ার্ড অ্যাকাউন্ট', time: '১৫–৩০ মিনিট' },
              { name: 'Netflix / Streaming অ্যাকাউন্ট', delivery: 'ইমেইল + পাসওয়ার্ড', time: '১০–৩০ মিনিট' },
              { name: 'VPN / Antivirus', delivery: 'লাইসেন্স কী + ডাউনলোড লিংক', time: '৫–২০ মিনিট' },
              { name: 'AI Tools (ChatGPT, ElevenLabs ইত্যাদি)', delivery: 'অ্যাকাউন্ট শেয়ার বা কী', time: '১৫–৩০ মিনিট' },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-4 rounded-xl p-3"
                style={{ background: 'hsla(258,78%,55%,0.04)', border: '1px solid hsla(258,78%,55%,0.10)' }}>
                <div className="flex-1">
                  <p className="font-semibold text-[13px]" style={{ color: 'hsl(226,35%,18%)' }}>{item.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'hsl(226,25%,50%)' }}>{item.delivery}</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: 'hsla(258,78%,55%,0.10)', color: 'hsl(258,78%,45%)' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<CheckCircle size={16} />} title="৩. ডেলিভারি পাওয়ার পর">
          <ul className="space-y-2">
            <Bullet>লাইসেন্স কী পাওয়ার সঙ্গে সঙ্গে কাজ করছে কিনা যাচাই করুন</Bullet>
            <Bullet>সমস্যা হলে ২৪ ঘণ্টার মধ্যে আমাদের জানান</Bullet>
            <Bullet>ইমেইলের কী কোনো নিরাপদ জায়গায় সংরক্ষণ করুন</Bullet>
            <Bullet>অ্যাক্টিভেশন গাইড অনুসরণ করুন — সমস্যা কমবে</Bullet>
          </ul>
        </Section>

        <Section icon={<AlertTriangle size={16} />} title="৪. ডেলিভারি না পেলে কী করবেন">
          <ul className="space-y-2">
            <Bullet>প্রথমে স্প্যাম/জাংক ফোল্ডার চেক করুন</Bullet>
            <Bullet>My Account → My Orders থেকে স্ট্যাটাস দেখুন</Bullet>
            <Bullet>৩ ঘণ্টার বেশি হলে WhatsApp-এ ট্রানজেকশন আইডি পাঠান</Bullet>
            <Bullet>ইমেইল সঠিক দেওয়া হয়েছে কিনা নিশ্চিত করুন</Bullet>
          </ul>
        </Section>

        <div className="mt-8 rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%), hsl(200,60%,96%))', border: '1px solid hsla(258,78%,55%,0.15)' }}>
          <h3 className="font-sora font-bold text-base mb-3" style={{ color: 'hsl(226,35%,14%)' }}>ডেলিভারি সাপোর্ট</h3>
          <div className="space-y-2 text-[13px]" style={{ color: 'hsl(226,25%,38%)' }}>
            <p className="flex items-center gap-2"><MessageCircle size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(258,78%,50%)' }}>WhatsApp: 01840-099853</a></p>
            <p className="flex items-center gap-2"><Mail size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="mailto:info@shahedstore.com.bd" style={{ color: 'hsl(258,78%,50%)' }}>info@shahedstore.com.bd</a></p>
            <p className="flex items-center gap-2"><Phone size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="tel:01840099853" style={{ color: 'hsl(258,78%,50%)' }}>01840-099853 (সকাল ৯টা–রাত ১২টা)</a></p>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    <FloatingButtons />
  </div>
);

export default DeliveryInfo;
