import { Shield, Lock, Eye, Database, Users, Bell } from 'lucide-react';
import PolicyLayout, { SectionCard, Bullet, ContactCard } from '@/components/store/PolicyLayout';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const PrivacyPolicy = () => (
  <PolicyLayout
    seoTitle="Privacy Policy — Shahed Store"
    seoDesc="Shahed Store আপনার ব্যক্তিগত তথ্য কীভাবে সংগ্রহ ও সুরক্ষিত রাখে জানুন।"
    badge="Legal Document"
    badgeIcon={<Shield size={13} />}
    title="Privacy Policy"
    subtitle="আমরা আপনার ব্যক্তিগত তথ্যকে সম্মান করি এবং সুরক্ষিত রাখি। এই নীতিটি পড়ুন এবং জানুন আমরা কীভাবে আপনার ডেটা পরিচালনা করি।"
    accentFrom={A}
    accentTo={B}
  >
    {/* Intro highlight */}
    <div className="rounded-2xl p-4 mb-6 text-[13px] leading-relaxed"
      style={{ background: `linear-gradient(135deg, ${A}0d, ${B}08)`, border: `1px solid ${A}25`, color: 'hsl(226,35%,28%)' }}>
      <strong>Shahed Store</strong> ("আমরা", "আমাদের") আপনার গোপনীয়তাকে অত্যন্ত গুরুত্বের সাথে বিবেচনা করে। এই Policy-তে বিবরণ দেওয়া হয়েছে যে আমরা <strong>shahedstore.com.bd</strong> ব্যবহারের সময় কোন তথ্য সংগ্রহ করি, কীভাবে ব্যবহার করি এবং আপনার অধিকার কী।
    </div>

    <SectionCard icon={<Database size={15} />} title="১. আমরা কী তথ্য সংগ্রহ করি" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>নাম, ইমেইল ঠিকানা, ফোন নম্বর</Bullet>
        <Bullet>অর্ডার সম্পর্কিত তথ্য (পণ্য, মূল্য, ডেলিভারি)</Bullet>
        <Bullet>পেমেন্ট ট্রানজেকশন আইডি (কার্ড বা অ্যাকাউন্ট নম্বর নয়)</Bullet>
        <Bullet>ডিভাইস তথ্য, IP ঠিকানা ও ব্রাউজার টাইপ (স্বয়ংক্রিয়ভাবে)</Bullet>
        <Bullet>কুকি ও সেশন ডেটা</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Eye size={15} />} title="২. তথ্য কীভাবে ব্যবহার করা হয়" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>অর্ডার প্রক্রিয়া করা ও ডিজিটাল পণ্য সরবরাহ করা</Bullet>
        <Bullet>অর্ডার স্ট্যাটাস ও ডেলিভারি আপডেট পাঠানো</Bullet>
        <Bullet>কাস্টমার সাপোর্ট প্রদান করা</Bullet>
        <Bullet>প্রতারণা ও অপব্যবহার রোধ করা</Bullet>
        <Bullet>ওয়েবসাইটের পারফরম্যান্স উন্নত করা</Bullet>
        <Bullet>আপনার অনুমতি নিয়ে প্রমোশনাল অফার পাঠানো</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Lock size={15} />} title="৩. তথ্য সুরক্ষা" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>সমস্ত ডেটা SSL/TLS এনক্রিপশনের মাধ্যমে ট্রান্সমিট হয়</Bullet>
        <Bullet>পেমেন্ট তথ্য সার্ভারে সংরক্ষণ করা হয় না — শুধু ট্রানজেকশন আইডি</Bullet>
        <Bullet>ডেটাবেস অ্যাক্সেস সীমিত ও পাসওয়ার্ড সুরক্ষিত</Bullet>
        <Bullet>নিয়মিত সিকিউরিটি অডিট পরিচালিত হয়</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Users size={15} />} title="৪. তৃতীয় পক্ষের সাথে তথ্য শেয়ার" accentFrom={A} accentTo={B}>
      <p className="mb-2">আমরা <strong>কখনই</strong> আপনার তথ্য বিক্রি করি না। সীমিত শেয়ার শুধুমাত্র:</p>
      <ul className="space-y-1.5">
        <Bullet><strong>পেমেন্ট প্রসেসর:</strong> bKash, Nagad, Rocket — পেমেন্ট যাচাইয়ের জন্য</Bullet>
        <Bullet><strong>ইমেইল সেবা:</strong> অর্ডার কনফার্মেশন পাঠাতে</Bullet>
        <Bullet><strong>আইনগত বাধ্যবাধকতা:</strong> বাংলাদেশের আইন অনুযায়ী</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Bell size={15} />} title="৫. কুকি পলিসি" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet><strong>অপরিহার্য কুকি:</strong> লগইন সেশন ও কার্ট তথ্য সংরক্ষণ</Bullet>
        <Bullet><strong>অ্যানালিটিক্স কুকি:</strong> ওয়েবসাইট ব্যবহার বিশ্লেষণ</Bullet>
        <Bullet>ব্রাউজার সেটিং থেকে কুকি বন্ধ করতে পারবেন</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Shield size={15} />} title="৬. আপনার অধিকার" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet><strong>অ্যাক্সেসের অধিকার:</strong> আপনার সম্পর্কে রাখা তথ্য জানার অধিকার</Bullet>
        <Bullet><strong>সংশোধনের অধিকার:</strong> ভুল তথ্য সংশোধন করার অধিকার</Bullet>
        <Bullet><strong>মুছে দেওয়ার অধিকার:</strong> ডেটা মুছে দেওয়ার অনুরোধ করার অধিকার</Bullet>
        <Bullet><strong>পোর্টেবিলিটির অধিকার:</strong> আপনার ডেটার কপি পাওয়ার অধিকার</Bullet>
        <Bullet><strong>আপত্তির অধিকার:</strong> মার্কেটিং যোগাযোগ বন্ধ করার অধিকার</Bullet>
      </ul>
    </SectionCard>

    <SectionCard icon={<Database size={15} />} title="৭. ডেটা সংরক্ষণকাল" accentFrom={A} accentTo={B}>
      <ul className="space-y-1.5">
        <Bullet>অ্যাকাউন্ট ডেটা: অ্যাকাউন্ট সক্রিয় থাকা পর্যন্ত + ৩ বছর</Bullet>
        <Bullet>অর্ডার রেকর্ড: ৭ বছর (আইনগত প্রয়োজনীয়তা)</Bullet>
        <Bullet>লগ ডেটা: ৯০ দিন</Bullet>
        <Bullet>অ্যাকাউন্ট মুছলে ব্যক্তিগত তথ্য ৩০ দিনের মধ্যে মুছে ফেলা হয়</Bullet>
      </ul>
    </SectionCard>

    <ContactCard accentFrom={A} accentTo={B} />
  </PolicyLayout>
);

export default PrivacyPolicy;
