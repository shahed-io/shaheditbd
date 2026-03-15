import { FileText, ShoppingCart, CreditCard, Shield, AlertTriangle, Scale, RefreshCw, Mail, Phone } from 'lucide-react';
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

const TermsConditions = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead title="Terms & Conditions — Shahed Store" description="Shahed Store ব্যবহারের শর্তাবলী পড়ুন।" />
    <Navbar />

    <div className="relative overflow-hidden pt-20 pb-14"
      style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)', borderBottom: '1px solid hsla(258,78%,55%,0.12)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
          style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.18)', color: 'hsl(258,78%,50%)' }}>
          <FileText size={14} /> Legal Document
        </div>
        <h1 className="font-sora font-black text-4xl sm:text-5xl mb-4" style={{ color: 'hsl(226,35%,12%)' }}>Terms & Conditions</h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(226,25%,42%)' }}>
          Shahed Store ব্যবহার করার আগে এই শর্তাবলী মনোযোগ দিয়ে পড়ুন। সাইট ব্যবহার করলে আপনি এই শর্তগুলো মেনে নিচ্ছেন বলে ধরা হবে।
        </p>
        <p className="text-xs mt-4 font-fira" style={{ color: 'hsl(226,25%,55%)' }}>সর্বশেষ আপডেট: মার্চ ২০২৬</p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-3xl p-8 sm:p-12 mb-8"
        style={{ background: 'white', border: '1px solid hsla(258,78%,55%,0.10)', boxShadow: '0 4px 40px hsla(258,78%,55%,0.06)' }}>

        <p className="text-[15px] leading-relaxed mb-10 p-5 rounded-2xl"
          style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,55%,0.12)', color: 'hsl(226,35%,28%)' }}>
          এই Terms & Conditions ("শর্তাবলী") Shahed Store এবং আপনার মধ্যে একটি আইনি চুক্তি। <strong>shahedstore.com.bd</strong>-এ প্রবেশ বা যেকোনো পরিষেবা ব্যবহার করার মাধ্যমে আপনি এই শর্তগুলো মেনে নিচ্ছেন।
        </p>

        <Section icon={<ShoppingCart size={16} />} title="১. পরিষেবার বিবরণ">
          <p>Shahed Store একটি ডিজিটাল পণ্য বিক্রয় প্ল্যাটফর্ম। আমরা নিম্নলিখিত পণ্য বিক্রি করি:</p>
          <ul className="space-y-2 mt-2">
            <Bullet>Windows, Office, Adobe ও অন্যান্য সফটওয়্যার লাইসেন্স কী</Bullet>
            <Bullet>Netflix, Spotify, YouTube Premium, Canva সহ সাবস্ক্রিপশন সার্ভিস</Bullet>
            <Bullet>VPN, Antivirus ও নিরাপত্তা সফটওয়্যার</Bullet>
            <Bullet>AI Tools ও ক্রিয়েটিভ সফটওয়্যার</Bullet>
          </ul>
          <p className="mt-3">সকল পণ্য ডিজিটাল ফরম্যাটে সরবরাহ করা হয় — কোনো ফিজিক্যাল শিপমেন্ট নেই।</p>
        </Section>

        <Section icon={<Shield size={16} />} title="২. অ্যাকাউন্ট ও ব্যবহারকারীর দায়িত্ব">
          <ul className="space-y-2">
            <Bullet>আপনার বয়স কমপক্ষে ১৩ বছর হতে হবে</Bullet>
            <Bullet>অ্যাকাউন্টের নিরাপত্তার দায়িত্ব আপনার নিজের</Bullet>
            <Bullet>একজন ব্যক্তি একাধিক অ্যাকাউন্ট খুলতে পারবেন না</Bullet>
            <Bullet>মিথ্যা তথ্য দিয়ে অ্যাকাউন্ট খোলা নিষিদ্ধ</Bullet>
            <Bullet>সন্দেহজনক কার্যক্রম আমাদের জানানোর দায়িত্ব আপনার</Bullet>
          </ul>
        </Section>

        <Section icon={<CreditCard size={16} />} title="৩. মূল্য ও পেমেন্ট">
          <ul className="space-y-2">
            <Bullet>সকল মূল্য বাংলাদেশি টাকায় (BDT) প্রদর্শিত হয়</Bullet>
            <Bullet>পেমেন্ট গ্রহণযোগ্য মাধ্যম: bKash, Nagad, Rocket, উপায়, bKash Merchant</Bullet>
            <Bullet>অর্ডার কনফার্মেশনের আগে পেমেন্ট যাচাই করা হয়</Bullet>
            <Bullet>পেমেন্ট সফল না হওয়া পর্যন্ত পণ্য সরবরাহ করা হবে না</Bullet>
            <Bullet>মূল্য পরিবর্তনের অধিকার আমরা সংরক্ষণ করি, তবে অর্ডার করা পণ্যের মূল্য পরিবর্তন হবে না</Bullet>
          </ul>
        </Section>

        <Section icon={<FileText size={16} />} title="৪. ডিজিটাল পণ্য সরবরাহ নীতি">
          <ul className="space-y-2">
            <Bullet>পেমেন্ট যাচাইয়ের পর সাধারণত ৫–৩০ মিনিটের মধ্যে লাইসেন্স কী/ডেলিভারি দেওয়া হয়</Bullet>
            <Bullet>ডেলিভারি ইমেইল বা সরাসরি অ্যাকাউন্টের মাধ্যমে পাঠানো হয়</Bullet>
            <Bullet>ডেলিভারি সময় পিক আওয়ারে কিছুটা বাড়তে পারে (সর্বোচ্চ ২৪ ঘণ্টা)</Bullet>
            <Bullet>একবার ডেলিভার করা ডিজিটাল পণ্য ফেরত দেওয়া যায় না (refund policy দেখুন)</Bullet>
          </ul>
        </Section>

        <Section icon={<AlertTriangle size={16} />} title="৫. নিষিদ্ধ কার্যক্রম">
          <p>নিচের কার্যক্রম সম্পূর্ণ নিষিদ্ধ এবং অ্যাকাউন্ট বাতিলের কারণ হতে পারে:</p>
          <ul className="space-y-2 mt-2">
            <Bullet>কেনা লাইসেন্স কী অন্যদের কাছে পুনরায় বিক্রি করা</Bullet>
            <Bullet>একাধিক ডিভাইসে ব্যবহারের অনুমতির বাইরে শেয়ার করা</Bullet>
            <Bullet>চার্জব্যাক বা জালিয়াতি পেমেন্টের মাধ্যমে পণ্য নেওয়া</Bullet>
            <Bullet>আমাদের সিস্টেম হ্যাক বা অপব্যবহারের চেষ্টা</Bullet>
            <Bullet>ভুয়া রিভিউ বা স্প্যাম পোস্ট করা</Bullet>
          </ul>
        </Section>

        <Section icon={<Scale size={16} />} title="৬. দায় সীমা">
          <ul className="space-y-2">
            <Bullet>আমরা থার্ড পার্টি সফটওয়্যার ত্রুটির জন্য দায়ী নই</Bullet>
            <Bullet>ইন্টারনেট সংযোগ সমস্যার কারণে বিলম্বের জন্য আমরা দায়ী নই</Bullet>
            <Bullet>ব্যবহারকারীর ভুলে পণ্য ব্যবহার করতে না পারলে আমরা দায়ী নই</Bullet>
            <Bullet>আমাদের সর্বোচ্চ দায় আপনার পেমেন্ট করা পরিমাণের মধ্যে সীমাবদ্ধ</Bullet>
          </ul>
        </Section>

        <Section icon={<Scale size={16} />} title="৭. বিরোধ নিষ্পত্তি">
          <p>যেকোনো বিরোধ প্রথমে সরাসরি আলোচনার মাধ্যমে সমাধান করার চেষ্টা করা হবে। সমাধান না হলে বাংলাদেশের প্রচলিত আইন অনুযায়ী নিষ্পত্তি হবে। এই শর্তাবলী বাংলাদেশের আইনে পরিচালিত।</p>
        </Section>

        <Section icon={<RefreshCw size={16} />} title="৮. শর্তাবলী পরিবর্তন">
          <p>আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করতে পারি। পরিবর্তনের পরেও সাইট ব্যবহার অব্যাহত রাখলে আপনি নতুন শর্ত মেনে নিচ্ছেন বলে ধরা হবে।</p>
        </Section>

        <div className="mt-10 rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,96%) 100%)', border: '1px solid hsla(258,78%,55%,0.15)' }}>
          <h3 className="font-sora font-bold text-base mb-3" style={{ color: 'hsl(226,35%,14%)' }}>যোগাযোগ</h3>
          <div className="space-y-2 text-[13px]" style={{ color: 'hsl(226,25%,38%)' }}>
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

export default TermsConditions;
