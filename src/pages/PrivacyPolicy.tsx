import { Shield, Lock, Eye, Database, Users, Bell, Mail, Phone, ExternalLink } from 'lucide-react';
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

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead
      title="Privacy Policy — Shahed Store"
      description="Shahed Store-এর Privacy Policy পড়ুন। আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখি তা জানুন।"
    />
    <Navbar />

    {/* Hero */}
    <div className="relative overflow-hidden pt-20 pb-14"
      style={{
        background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)',
        borderBottom: '1px solid hsla(258,78%,55%,0.12)',
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
          style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.18)', color: 'hsl(258,78%,50%)' }}>
          <Shield size={14} /> Legal Document
        </div>
        <h1 className="font-sora font-black text-4xl sm:text-5xl mb-4" style={{ color: 'hsl(226,35%,12%)' }}>
          Privacy Policy
        </h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(226,25%,42%)' }}>
          আমরা আপনার ব্যক্তিগত তথ্যকে সম্মান করি এবং সুরক্ষিত রাখি। এই নীতিটি পড়ুন এবং জানুন আমরা কীভাবে আপনার ডেটা পরিচালনা করি।
        </p>
        <p className="text-xs mt-4 font-fira" style={{ color: 'hsl(226,25%,55%)' }}>
          সর্বশেষ আপডেট: মার্চ ২০২৬ · কার্যকর: জানুয়ারি ২০২৪
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-3xl p-8 sm:p-12 mb-8"
        style={{
          background: 'white',
          border: '1px solid hsla(258,78%,55%,0.10)',
          boxShadow: '0 4px 40px hsla(258,78%,55%,0.06)',
        }}>

        {/* Intro */}
        <p className="text-[15px] leading-relaxed mb-10 p-5 rounded-2xl"
          style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,55%,0.12)', color: 'hsl(226,35%,28%)' }}>
          <strong>Shahed Store</strong> ("আমরা", "আমাদের") আপনার গোপনীয়তাকে অত্যন্ত গুরুত্বের সাথে বিবেচনা করে। এই Privacy Policy-তে বিবরণ দেওয়া হয়েছে যে আমরা আমাদের ওয়েবসাইট <strong>shahedstore.com.bd</strong> ব্যবহার করার সময় কোন তথ্য সংগ্রহ করি, কীভাবে তা ব্যবহার করি এবং আপনার অধিকার কী।
        </p>

        <Section icon={<Database size={16} />} title="১. আমরা কী তথ্য সংগ্রহ করি">
          <p>আপনি যখন আমাদের সাইটে অ্যাকাউন্ট খোলেন বা অর্ডার দেন, তখন আমরা নিম্নলিখিত তথ্য সংগ্রহ করতে পারি:</p>
          <ul className="space-y-2 mt-2">
            <Bullet>নাম, ইমেইল ঠিকানা, ফোন নম্বর</Bullet>
            <Bullet>অর্ডার সম্পর্কিত তথ্য (পণ্য, মূল্য, ডেলিভারি তথ্য)</Bullet>
            <Bullet>পেমেন্ট ট্রানজেকশন আইডি (আমরা কোনো কার্ড বা অ্যাকাউন্ট নম্বর সংরক্ষণ করি না)</Bullet>
            <Bullet>ডিভাইস তথ্য, IP ঠিকানা ও ব্রাউজার টাইপ (স্বয়ংক্রিয়ভাবে)</Bullet>
            <Bullet>কুকি ও সেশন ডেটা (ওয়েবসাইট উন্নত করতে)</Bullet>
          </ul>
        </Section>

        <Section icon={<Eye size={16} />} title="২. তথ্য কীভাবে ব্যবহার করা হয়">
          <p>সংগৃহীত তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহার করা হয়:</p>
          <ul className="space-y-2 mt-2">
            <Bullet>আপনার অর্ডার প্রক্রিয়া করা ও ডিজিটাল পণ্য সরবরাহ করা</Bullet>
            <Bullet>অর্ডার স্ট্যাটাস ও ডেলিভারি সংক্রান্ত আপডেট পাঠানো</Bullet>
            <Bullet>কাস্টমার সাপোর্ট প্রদান করা</Bullet>
            <Bullet>প্রতারণা ও অপব্যবহার রোধ করা</Bullet>
            <Bullet>ওয়েবসাইটের পারফরম্যান্স ও অভিজ্ঞতা উন্নত করা</Bullet>
            <Bullet>আপনার অনুমতি নিয়ে প্রমোশনাল অফার পাঠানো</Bullet>
          </ul>
        </Section>

        <Section icon={<Lock size={16} />} title="৩. তথ্য সুরক্ষা">
          <p>আমরা আপনার তথ্য সুরক্ষিত রাখতে শিল্পমানের নিরাপত্তা ব্যবস্থা অনুসরণ করি:</p>
          <ul className="space-y-2 mt-2">
            <Bullet>সমস্ত ডেটা SSL/TLS এনক্রিপশনের মাধ্যমে ট্রান্সমিট হয়</Bullet>
            <Bullet>পেমেন্ট তথ্য (bKash, Nagad ইত্যাদি) আমাদের সার্ভারে সংরক্ষণ করা হয় না — শুধুমাত্র ট্রানজেকশন আইডি রাখা হয়</Bullet>
            <Bullet>ডেটাবেস অ্যাক্সেস সীমিত এবং পাসওয়ার্ড সুরক্ষিত</Bullet>
            <Bullet>নিয়মিত সিকিউরিটি অডিট পরিচালিত হয়</Bullet>
          </ul>
        </Section>

        <Section icon={<Users size={16} />} title="৪. তৃতীয় পক্ষের সাথে তথ্য শেয়ার">
          <p>আমরা <strong>কখনই</strong> আপনার ব্যক্তিগত তথ্য বিক্রি করি না। তবে নিচের ক্ষেত্রে সীমিতভাবে শেয়ার করা হতে পারে:</p>
          <ul className="space-y-2 mt-2">
            <Bullet><strong>পেমেন্ট প্রসেসর:</strong> bKash, Nagad, Rocket — শুধুমাত্র পেমেন্ট যাচাইয়ের জন্য</Bullet>
            <Bullet><strong>ইমেইল সেবা:</strong> অর্ডার কনফার্মেশন ও নোটিফিকেশন পাঠাতে</Bullet>
            <Bullet><strong>আইনগত বাধ্যবাধকতা:</strong> বাংলাদেশের আইন অনুযায়ী যদি সরকারি কর্তৃপক্ষ দাবি করে</Bullet>
          </ul>
        </Section>

        <Section icon={<Bell size={16} />} title="৫. কুকি পলিসি">
          <p>আমাদের ওয়েবসাইট কুকি ব্যবহার করে যা আপনার ব্রাউজিং অভিজ্ঞতা উন্নত করে:</p>
          <ul className="space-y-2 mt-2">
            <Bullet><strong>অপরিহার্য কুকি:</strong> লগইন সেশন ও কার্ট তথ্য সংরক্ষণের জন্য</Bullet>
            <Bullet><strong>অ্যানালিটিক্স কুকি:</strong> ওয়েবসাইট ব্যবহার বিশ্লেষণ করতে (Google Analytics)</Bullet>
            <Bullet>আপনি ব্রাউজার সেটিং থেকে কুকি বন্ধ করতে পারেন, তবে কিছু ফিচার কাজ নাও করতে পারে</Bullet>
          </ul>
        </Section>

        <Section icon={<Shield size={16} />} title="৬. আপনার অধিকার">
          <p>বাংলাদেশের তথ্য সুরক্ষা আইন ও আন্তর্জাতিক মানদণ্ড অনুযায়ী আপনার নিচের অধিকার রয়েছে:</p>
          <ul className="space-y-2 mt-2">
            <Bullet><strong>অ্যাক্সেসের অধিকার:</strong> আমরা আপনার সম্পর্কে কী তথ্য রেখেছি তা জানার অধিকার</Bullet>
            <Bullet><strong>সংশোধনের অধিকার:</strong> ভুল তথ্য সংশোধন করার অধিকার</Bullet>
            <Bullet><strong>মুছে দেওয়ার অধিকার:</strong> আপনার ডেটা মুছে দেওয়ার অনুরোধ করার অধিকার</Bullet>
            <Bullet><strong>পোর্টেবিলিটির অধিকার:</strong> আপনার ডেটার একটি কপি পাওয়ার অধিকার</Bullet>
            <Bullet><strong>আপত্তির অধিকার:</strong> মার্কেটিং যোগাযোগ বন্ধ করার অধিকার</Bullet>
          </ul>
          <p className="mt-3">এই অধিকার প্রয়োগ করতে আমাদের সাথে যোগাযোগ করুন।</p>
        </Section>

        <Section icon={<Database size={16} />} title="৭. ডেটা সংরক্ষণকাল">
          <ul className="space-y-2">
            <Bullet>অ্যাকাউন্ট ডেটা: অ্যাকাউন্ট সক্রিয় থাকা পর্যন্ত + ৩ বছর</Bullet>
            <Bullet>অর্ডার রেকর্ড: ৭ বছর (আইনগত প্রয়োজনীয়তা)</Bullet>
            <Bullet>লগ ডেটা: ৯০ দিন</Bullet>
            <Bullet>আপনি অ্যাকাউন্ট মুছে দিলে, ব্যক্তিগত তথ্য ৩০ দিনের মধ্যে মুছে ফেলা হয় (আইনগতভাবে বাধ্যতামূলক কিছু ব্যতীত)</Bullet>
          </ul>
        </Section>

        <Section icon={<Shield size={16} />} title="৮. শিশুদের গোপনীয়তা">
          <p>আমাদের সেবা ১৩ বছরের কম বয়সী শিশুদের জন্য নয়। আমরা জেনেশুনে ১৩ বছরের কম বয়সীদের ডেটা সংগ্রহ করি না। যদি কোনো অভিভাবক মনে করেন তাদের সন্তানের তথ্য আমাদের কাছে আছে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।</p>
        </Section>

        <Section icon={<Bell size={16} />} title="৯. নীতি পরিবর্তন">
          <p>আমরা যেকোনো সময় এই Privacy Policy আপডেট করতে পারি। বড় পরিবর্তনের ক্ষেত্রে:</p>
          <ul className="space-y-2 mt-2">
            <Bullet>ওয়েবসাইটে বিজ্ঞপ্তি দেওয়া হবে</Bullet>
            <Bullet>নিবন্ধিত ব্যবহারকারীদের ইমেইলে জানানো হবে</Bullet>
            <Bullet>পেজের শীর্ষে "সর্বশেষ আপডেট" তারিখ উল্লেখ থাকবে</Bullet>
          </ul>
        </Section>

        {/* Contact Card */}
        <div className="mt-10 rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)',
            border: '1px solid hsla(258,78%,55%,0.15)',
          }}>
          <h3 className="font-sora font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'hsl(226,35%,14%)' }}>
            <Mail size={16} style={{ color: 'hsl(258,78%,50%)' }} />
            আমাদের সাথে যোগাযোগ করুন
          </h3>
          <div className="space-y-2.5 text-[13px]" style={{ color: 'hsl(226,25%,38%)' }}>
            <p className="flex items-center gap-2">
              <Mail size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="mailto:info@shahedstore.com.bd" className="hover:underline" style={{ color: 'hsl(258,78%,50%)' }}>
                info@shahedstore.com.bd
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <a href="tel:01840099853" className="hover:underline" style={{ color: 'hsl(258,78%,50%)' }}>
                01840-099853
              </a>
            </p>
            <p className="flex items-center gap-2">
              <ExternalLink size={13} style={{ color: 'hsl(258,78%,50%)' }} />
              <span>Shahed Store, Bangladesh</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <Footer />
    <FloatingButtons />
  </div>
);

export default PrivacyPolicy;
