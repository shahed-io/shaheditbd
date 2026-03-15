import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import PolicyLayout, { SectionCard, Bullet, ContactCard } from '@/components/store/PolicyLayout';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const RefundPolicy = () => (
  <PolicyLayout
    seoTitle="Refund Policy — Shahed Store"
    seoDesc="Shahed Store-এর রিফান্ড পলিসি জানুন। কখন ও কীভাবে রিফান্ড পাবেন।"
    badge="Customer Protection"
    badgeIcon={<RefreshCw size={13} />}
    title="Refund Policy"
    subtitle="আমরা আমাদের গ্রাহকদের সন্তুষ্টিকে সর্বোচ্চ অগ্রাধিকার দিই। আমাদের রিফান্ড নীতি স্বচ্ছ ও ন্যায্য।"
    accentFrom={A}
    accentTo={B}
  >
    {/* Quick summary */}
    <div className="grid sm:grid-cols-2 gap-3 mb-6">
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'hsla(142,72%,50%,0.07)', border: '1px solid hsla(142,72%,50%,0.22)' }}>
        <CheckCircle size={20} style={{ color: 'hsl(142,72%,38%)', flexShrink: 0 }} />
        <div>
          <p className="font-bold text-[13px] mb-1" style={{ color: 'hsl(142,50%,22%)' }}>রিফান্ড পাবেন</p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(142,30%,35%)' }}>পণ্য কাজ না করলে বা ভুল ডেলিভারি হলে ২৪ ঘণ্টার মধ্যে রিপোর্ট করুন।</p>
        </div>
      </div>
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'hsla(0,72%,50%,0.07)', border: '1px solid hsla(0,72%,50%,0.22)' }}>
        <XCircle size={20} style={{ color: 'hsl(0,72%,43%)', flexShrink: 0 }} />
        <div>
          <p className="font-bold text-[13px] mb-1" style={{ color: 'hsl(0,50%,28%)' }}>রিফান্ড পাবেন না</p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(0,30%,38%)' }}>পণ্য ব্যবহারের পরে বা ২৪ ঘণ্টার পরে সাধারণত রিফান্ড প্রযোজ্য নয়।</p>
        </div>
      </div>
    </div>

    <SectionCard icon={<CheckCircle size={15} />} title="১. রিফান্ড পাওয়ার যোগ্য পরিস্থিতি" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet color="hsl(142,72%,38%)">ডেলিভার করা লাইসেন্স কী সম্পূর্ণ কাজ না করলে</Bullet>
        <Bullet color="hsl(142,72%,38%)">অর্ডার করা পণ্যের বদলে ভিন্ন পণ্য ডেলিভার হলে</Bullet>
        <Bullet color="hsl(142,72%,38%)">পেমেন্ট সফল হলেও ৩ ঘণ্টার মধ্যে পণ্য না পেলে</Bullet>
        <Bullet color="hsl(142,72%,38%)">একই অর্ডারে ডাবল পেমেন্ট হয়ে গেলে</Bullet>
        <Bullet color="hsl(142,72%,38%)">স্টক শেষ হওয়ায় সরবরাহ সম্ভব না হলে</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<XCircle size={15} />} title="২. রিফান্ড প্রযোজ্য নয় যখন" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet color="hsl(0,72%,43%)">লাইসেন্স কী সফলভাবে ব্যবহার করা হয়ে গেলে</Bullet>
        <Bullet color="hsl(0,72%,43%)">ডেলিভারির ২৪ ঘণ্টার পরে অভিযোগ করলে</Bullet>
        <Bullet color="hsl(0,72%,43%)">ক্রেতার ভুলে পণ্য ব্যবহার করতে না পারলে</Bullet>
        <Bullet color="hsl(0,72%,43%)">ইন্টারনেট বা ডিভাইস সমস্যার কারণে কাজ না করলে</Bullet>
        <Bullet color="hsl(0,72%,43%)">"মন পরিবর্তন" হলে (change of mind)</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Clock size={15} />} title="৩. রিফান্ড প্রক্রিয়া" accentFrom={A} accentTo={B}>
      <div className="space-y-3">
        {[
          { n: '১', t: 'অভিযোগ দাখিল (২৪ ঘণ্টার মধ্যে)', d: 'অর্ডার নম্বর, সমস্যার বিবরণ ও স্ক্রিনশট পাঠান।' },
          { n: '২', t: 'যাচাই (১–৬ ঘণ্টা)', d: 'আমাদের টিম সমস্যাটি যাচাই করে সমাধান বা রিফান্ড অনুমোদন করবে।' },
          { n: '৩', t: 'রিফান্ড প্রদান (১–৩ কার্যদিবস)', d: 'মূল পেমেন্ট মাধ্যমে (bKash/Nagad) ফেরত দেওয়া হবে।' },
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

    <SectionCard icon={<AlertTriangle size={15} />} title="৪. বিশেষ ক্ষেত্র" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>সাবস্ক্রিপশন: অব্যবহৃত মাসের সমানুপাতিক রিফান্ড বিবেচনা করা হয়</Bullet>
        <Bullet>বান্ডেল অফার: শুধু সমস্যাযুক্ত পণ্যের রিফান্ড প্রযোজ্য</Bullet>
        <Bullet>ডিসকাউন্ট মূল্যে কেনা পণ্যে ডিসকাউন্ট মূল্যই ফেরত দেওয়া হবে</Bullet>
      </ul>
    </SectionCard>

    <ContactCard accentFrom={A} accentTo={B} />
  </PolicyLayout>
);

export default RefundPolicy;
