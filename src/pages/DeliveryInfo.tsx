import { Zap, Mail, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import PolicyLayout, { SectionCard, Bullet, ContactCard } from '@/components/store/PolicyLayout';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const DeliveryInfo = () => (
  <PolicyLayout
    seoTitle="Delivery Info — Shahed Store"
    seoDesc="Shahed Store-এর ডেলিভারি প্রক্রিয়া, সময়সীমা ও পদ্ধতি জানুন।"
    badge="Instant Digital Delivery"
    badgeIcon={<Zap size={13} />}
    title="Delivery Info"
    subtitle="আমরা সম্পূর্ণ ডিজিটাল ডেলিভারি প্রদান করি। কোনো ফিজিক্যাল শিপমেন্ট নেই — পণ্য সরাসরি আপনার ইনবক্সে পৌঁছে যায়।"
    accentFrom={A}
    accentTo={B}
  >
    {/* Delivery time cards */}
    <div className="grid sm:grid-cols-3 gap-3 mb-6">
      {[
        { icon: '⚡', time: '৫–৩০ মিনিট', label: 'সাধারণ অর্ডার', color: 'hsl(142,72%,38%)' },
        { icon: '🌙', time: '৩০ মি.–২ ঘণ্টা', label: 'পিক আওয়ার', color: 'hsl(38,100%,45%)' },
        { icon: '🕐', time: 'সর্বোচ্চ ২৪ ঘণ্টা', label: 'বিশেষ পরিস্থিতি', color: A },
      ].map(card => (
        <div key={card.label} className="rounded-2xl p-4 text-center"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45))',
            backdropFilter: 'blur(16px)',
            border: `1px solid hsla(258,78%,75%,0.22)`,
          }}>
          <div className="text-2xl mb-1">{card.icon}</div>
          <p className="font-sora font-black text-[15px]" style={{ color: card.color }}>{card.time}</p>
          <p className="text-[11px] mt-0.5 font-semibold" style={{ color: 'hsl(226,25%,50%)' }}>{card.label}</p>
        </div>
      ))}
    </div>

    <SectionCard icon={<Mail size={15} />} title="১. ডেলিভারি পদ্ধতি" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet><strong>ইমেইল ডেলিভারি:</strong> লাইসেন্স কী, অ্যাক্টিভেশন গাইড সহ</Bullet>
        <Bullet><strong>অ্যাকাউন্ট ডেলিভারি:</strong> My Account → My Orders থেকে ডাউনলোড</Bullet>
        <Bullet><strong>WhatsApp:</strong> কিছু ক্ষেত্রে সরাসরি WhatsApp-এ পাঠানো হয়</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Package size={15} />} title="২. পণ্য অনুযায়ী ডেলিভারি" accentFrom={A} accentTo={B}>
      <div className="space-y-2">
        {[
          { name: 'Windows / Office লাইসেন্স', delivery: 'ইমেইলে কী + গাইড', time: '৫–১৫ মি.' },
          { name: 'Adobe Creative Cloud', delivery: 'লাইসেন্স বা শেয়ার্ড অ্যাকাউন্ট', time: '১৫–৩০ মি.' },
          { name: 'Netflix / Streaming', delivery: 'ইমেইল + পাসওয়ার্ড', time: '১০–৩০ মি.' },
          { name: 'VPN / Antivirus', delivery: 'কী + ডাউনলোড লিংক', time: '৫–২০ মি.' },
          { name: 'AI Tools', delivery: 'অ্যাকাউন্ট শেয়ার বা কী', time: '১৫–৩০ মি.' },
        ].map(item => (
          <div key={item.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,55%,0.10)' }}>
            <div className="flex-1">
              <p className="font-semibold text-[12px]" style={{ color: 'hsl(226,35%,18%)' }}>{item.name}</p>
              <p className="text-[11px]" style={{ color: 'hsl(226,25%,50%)' }}>{item.delivery}</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${A}12`, color: A }}>{item.time}</span>
          </div>
        ))}
      </div>
    </SectionCard>

    <SectionCard icon={<CheckCircle size={15} />} title="৩. ডেলিভারি পাওয়ার পর" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>পাওয়ার সাথে সাথে কাজ করছে কিনা যাচাই করুন</Bullet>
        <Bullet>সমস্যা হলে ২৪ ঘণ্টার মধ্যে আমাদের জানান</Bullet>
        <Bullet>লাইসেন্স কী নিরাপদ জায়গায় সংরক্ষণ করুন</Bullet>
        <Bullet>অ্যাক্টিভেশন গাইড অনুসরণ করুন</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<AlertTriangle size={15} />} title="৪. ডেলিভারি না পেলে" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>প্রথমে স্প্যাম/জাংক ফোল্ডার চেক করুন</Bullet>
        <Bullet>My Account → My Orders থেকে স্ট্যাটাস দেখুন</Bullet>
        <Bullet>৩ ঘণ্টার বেশি হলে WhatsApp-এ ট্রানজেকশন আইডি পাঠান</Bullet>
        <Bullet>ইমেইল সঠিক দেওয়া হয়েছে কিনা নিশ্চিত করুন</Bullet>
      </ul>
    </SectionCard>

    <ContactCard accentFrom={A} accentTo={B} />
  </PolicyLayout>
);

export default DeliveryInfo;
