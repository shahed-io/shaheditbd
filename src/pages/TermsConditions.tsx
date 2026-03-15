import { FileText, ShoppingCart, CreditCard, Shield, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import PolicyLayout, { SectionCard, Bullet, ContactCard } from '@/components/store/PolicyLayout';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const TermsConditions = () => (
  <PolicyLayout
    seoTitle="Terms & Conditions — Shahed Store"
    seoDesc="Shahed Store ব্যবহারের শর্তাবলী পড়ুন।"
    badge="Legal Document"
    badgeIcon={<FileText size={13} />}
    title="Terms & Conditions"
    subtitle="Shahed Store ব্যবহার করার আগে এই শর্তাবলী মনোযোগ দিয়ে পড়ুন। সাইট ব্যবহার করলে আপনি এই শর্তগুলো মেনে নিচ্ছেন বলে ধরা হবে।"
    accentFrom={A}
    accentTo={B}
  >
    <div className="rounded-2xl p-4 mb-6 text-[13px] leading-relaxed"
      style={{ background: `linear-gradient(135deg, ${A}0d, ${B}08)`, border: `1px solid ${A}25`, color: 'hsl(226,35%,28%)' }}>
      এই Terms & Conditions Shahed Store এবং আপনার মধ্যে একটি আইনি চুক্তি। <strong>shahedstore.com.bd</strong>-এ প্রবেশ বা যেকোনো পরিষেবা ব্যবহারের মাধ্যমে আপনি এই শর্তগুলো মেনে নিচ্ছেন।
    </div>

    <SectionCard icon={<ShoppingCart size={15} />} title="১. পরিষেবার বিবরণ" accentFrom={A} accentTo={B}>
      <p className="mb-2">Shahed Store একটি ডিজিটাল পণ্য বিক্রয় প্ল্যাটফর্ম। আমরা বিক্রি করি:</p>
      <ul className="space-y-1.5">
        <Bullet>Windows, Office, Adobe ও অন্যান্য সফটওয়্যার লাইসেন্স কী</Bullet>
        <Bullet>Netflix, Spotify, YouTube Premium, Canva সহ সাবস্ক্রিপশন</Bullet>
        <Bullet>VPN, Antivirus ও নিরাপত্তা সফটওয়্যার</Bullet>
        <Bullet>AI Tools ও ক্রিয়েটিভ সফটওয়্যার</Bullet>
      </ul>
      <p className="mt-2">সকল পণ্য ডিজিটাল ফরম্যাটে সরবরাহ — কোনো ফিজিক্যাল শিপমেন্ট নেই।</p>
    </SectionCard>

    <SectionCard icon={<Shield size={15} />} title="২. অ্যাকাউন্ট ও ব্যবহারকারীর দায়িত্ব" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>আপনার বয়স কমপক্ষে ১৩ বছর হতে হবে</Bullet>
        <Bullet>অ্যাকাউন্টের নিরাপত্তার দায়িত্ব আপনার নিজের</Bullet>
        <Bullet>একজন ব্যক্তি একাধিক অ্যাকাউন্ট খুলতে পারবেন না</Bullet>
        <Bullet>মিথ্যা তথ্য দিয়ে অ্যাকাউন্ট খোলা নিষিদ্ধ</Bullet>
        <Bullet>সন্দেহজনক কার্যক্রম আমাদের জানানোর দায়িত্ব আপনার</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<CreditCard size={15} />} title="৩. মূল্য ও পেমেন্ট" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>সকল মূল্য বাংলাদেশি টাকায় (BDT) প্রদর্শিত হয়</Bullet>
        <Bullet>পেমেন্ট গ্রহণযোগ্য: bKash, Nagad, Rocket, উপায়, bKash Merchant</Bullet>
        <Bullet>অর্ডার কনফার্মেশনের আগে পেমেন্ট যাচাই করা হয়</Bullet>
        <Bullet>মূল্য পরিবর্তনের অধিকার আমরা সংরক্ষণ করি</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<FileText size={15} />} title="৪. ডিজিটাল পণ্য সরবরাহ নীতি" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>পেমেন্ট যাচাইয়ের পর ৫–৩০ মিনিটের মধ্যে ডেলিভারি</Bullet>
        <Bullet>ডেলিভারি ইমেইল বা অ্যাকাউন্টের মাধ্যমে পাঠানো হয়</Bullet>
        <Bullet>পিক আওয়ারে সময় কিছুটা বাড়তে পারে (সর্বোচ্চ ২৪ ঘণ্টা)</Bullet>
        <Bullet>একবার ডেলিভার হওয়া ডিজিটাল পণ্য ফেরত দেওয়া যায় না</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<AlertTriangle size={15} />} title="৫. নিষিদ্ধ কার্যক্রম" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>কেনা লাইসেন্স কী অন্যদের কাছে পুনরায় বিক্রি করা</Bullet>
        <Bullet>অনুমতির বাইরে একাধিক ডিভাইসে শেয়ার করা</Bullet>
        <Bullet>চার্জব্যাক বা জালিয়াতি পেমেন্টের মাধ্যমে পণ্য নেওয়া</Bullet>
        <Bullet>সিস্টেম হ্যাক বা অপব্যবহারের চেষ্টা করা</Bullet>
        <Bullet>ভুয়া রিভিউ বা স্প্যাম পোস্ট করা</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Scale size={15} />} title="৬. দায় সীমা" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>থার্ড পার্টি সফটওয়্যার ত্রুটির জন্য আমরা দায়ী নই</Bullet>
        <Bullet>ইন্টারনেট সমস্যার কারণে বিলম্বের জন্য আমরা দায়ী নই</Bullet>
        <Bullet>ব্যবহারকারীর ভুলে পণ্য ব্যবহার না করতে পারলে আমরা দায়ী নই</Bullet>
        <Bullet>সর্বোচ্চ দায় আপনার পেমেন্ট করা পরিমাণের মধ্যে সীমাবদ্ধ</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<RefreshCw size={15} />} title="৭. শর্তাবলী পরিবর্তন" accentFrom={A} accentTo={B}>
      <p>আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করতে পারি। পরিবর্তনের পরেও সাইট ব্যবহার অব্যাহত রাখলে আপনি নতুন শর্ত মেনে নিচ্ছেন বলে ধরা হবে। যেকোনো বিরোধ বাংলাদেশের প্রচলিত আইন অনুযায়ী নিষ্পত্তি হবে।</p>
    </SectionCard>

    <ContactCard accentFrom={A} accentTo={B} />
  </PolicyLayout>
);

export default TermsConditions;
