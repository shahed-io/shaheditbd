import { ShoppingCart, CreditCard, Clock, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import PolicyLayout, { SectionCard, Bullet, ContactCard } from '@/components/store/PolicyLayout';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const OrderPolicy = () => (
  <PolicyLayout
    seoTitle="Order Policy — Shahed Store"
    seoDesc="Shahed Store-এ অর্ডার করার নিয়মকানুন ও প্রক্রিয়া জানুন।"
    badge="Order Guidelines"
    badgeIcon={<ShoppingCart size={13} />}
    title="Order & Cancellation Policy"
    subtitle="অর্ডার দেওয়া থেকে পণ্য পাওয়া পর্যন্ত সম্পূর্ণ প্রক্রিয়া এবং নিয়মকানুন জানুন।"
    accentFrom={A}
    accentTo={B}
  >
    <SectionCard icon={<ShoppingCart size={15} />} title="১. অর্ডার করার ধাপ" accentFrom={A} accentTo={B}>
      <div className="space-y-3">
        {[
          { n: '১', t: 'পণ্য বেছে নিন', d: 'স্টোর থেকে পছন্দের পণ্যটি কার্টে যোগ করুন বা Buy Now-এ ক্লিক করুন।' },
          { n: '২', t: 'পেমেন্ট করুন', d: 'bKash, Nagad বা অন্য মাধ্যমে পেমেন্ট করুন এবং ট্রানজেকশন আইডি সংগ্রহ করুন।' },
          { n: '৩', t: 'অর্ডার কনফার্ম করুন', d: 'চেকআউটে ট্রানজেকশন আইডি ও ইমেইল দিয়ে অর্ডার সম্পন্ন করুন।' },
          { n: '৪', t: 'পণ্য পান', d: 'পেমেন্ট যাচাইয়ের পর ১–২৪ ঘণ্টার মধ্যে ইমেইল/অ্যাকাউন্টে পণ্য পাঠানো হবে।' },
        ].map(s => (
          <div key={s.n} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})` }}>{s.n}</div>
            <div>
              <p className="font-semibold text-[13px]" style={{ color: 'hsl(226,35%,18%)' }}>{s.t}</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'hsl(226,25%,48%)' }}>{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>

    <SectionCard icon={<CreditCard size={15} />} title="২. পেমেন্ট নির্দেশিকা" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>পেমেন্টের পরে ট্রানজেকশন আইডি (TrxID) সংরক্ষণ করুন</Bullet>
        <Bullet>bKash থেকে পাঠাতে হবে: <strong>01820060046</strong></Bullet>
        <Bullet>Nagad/Rocket/উপায় থেকে পাঠাতে হবে: <strong>01840099853</strong></Bullet>
        <Bullet>পেমেন্ট SMS/নোটিফিকেশনের স্ক্রিনশট রাখুন</Bullet>
        <Bullet>পেমেন্ট সফল হলেও ২৪ ঘণ্টার মধ্যে পণ্য না পেলে আমাদের জানান</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Clock size={15} />} title="৩. অর্ডার যাচাই প্রক্রিয়া" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>পেমেন্ট যাচাইয়ের পর <strong>১ ঘণ্টা থেকে সর্বোচ্চ ২৪ ঘণ্টার মধ্যে</strong> ডেলিভারি প্রদান করা হয়</Bullet>
        <Bullet>ছুটির দিনেও সার্ভিস চালু থাকে</Bullet>
        <Bullet>অর্ডার স্ট্যাটাস My Account থেকে ট্র্যাক করতে পারবেন</Bullet>
        <Bullet color="hsl(38,92%,38%)">প্রোডাক্ট ব্যবহারকালীন কোনো সমস্যার সমাধানে সর্বোচ্চ <strong>৩ কর্মদিবস</strong> সময় প্রযোজ্য। গ্রাহক ক্রয়ের মাধ্যমে এই শর্তে সম্মতি প্রদান করছেন।</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Package size={15} />} title="৪. অর্ডার বাতিল নীতি" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>অর্ডার সফল হবার পর কোন ভাবে সেটি বাতিল করা যাবেনা, তবে যদি ডেলিভারির সফল হবার পূর্বে আমাদের সাপোর্টে জানানো হয় তবে সেই অর্ডারটি বাতিলকরণ প্রযোজ্য হবে। <strong>(শর্ত ১.১)</strong></Bullet>
        <Bullet>অর্ডার বাতিল এর ক্ষেত্রে প্রদানকৃত মূল্য ফেরত যোগ্য নয়, তবে সেটি <strong>(শর্ত ১.১)</strong> এর আওতাভুক্ত হলে অন্য প্রোডাক্ট এর সাথে মূল্য বিনিময় প্রযোজ্য হবে।</Bullet>
        <Bullet>যদি আমাদের দ্বারা কোন অর্ডার বাতিলকরণ হয় তবে গ্রাহকের মূল্যটি ১–২৪ ঘন্টার মধ্যে রিফান্ড করে দেওয়া হবে।</Bullet>
        <Bullet>প্রোডাক্টের স্টক সমস্যার জন্য শাহেদ স্টোর যেকোন অর্ডার বাতিল করার ক্ষমতা রাখে। তবে যদি অর্ডার বাতিল হয় তাহলে সঙ্গে সঙ্গে রিফান্ড পেয়ে যাবেন।</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<CheckCircle size={15} />} title="৫. গুরুত্বপূর্ণ তথ্য" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>অর্ডার নম্বর সংরক্ষণ করুন — সাপোর্টে প্রয়োজন হবে</Bullet>
        <Bullet>ইমেইল ঠিকানা সঠিক দিন — ডেলিভারি ইমেইলে যাবে</Bullet>
        <Bullet>স্প্যাম ফোল্ডার চেক করুন যদি ইমেইল না আসে</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<AlertTriangle size={15} />} title="৬. প্রতারণা প্রতিরোধ" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>জালিয়াতি পেমেন্ট শনাক্ত হলে অর্ডার বাতিল ও আইনগত পদক্ষেপ</Bullet>
        <Bullet>চার্জব্যাক করলে অ্যাকাউন্ট স্থায়ীভাবে ব্যান হবে</Bullet>
        <Bullet>একই পণ্যের একাধিক অর্ডার করলে অতিরিক্ত অর্ডার বাতিল হতে পারে</Bullet>
      </ul>
    </SectionCard>

    <ContactCard accentFrom={A} accentTo={B} />
  </PolicyLayout>
);

export default OrderPolicy;
