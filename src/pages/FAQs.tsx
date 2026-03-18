import { useState } from 'react';
import { ChevronDown, ShoppingCart, CreditCard, Truck, RotateCcw, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { FloatingButtons } from '@/components/store/Extras';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  items: FAQItem[];
}

const FAQ_CATS: FAQCategory[] = [
  {
    id: 'orders',
    label: 'অর্ডার',
    icon: <ShoppingCart size={18} />,
    color: 'hsl(142,72%,38%)',
    items: [
      {
        q: 'কিভাবে অর্ডার করব?',
        a: 'পণ্যের পেজে গিয়ে "Buy Now" বা "Add to Cart" বাটনে ক্লিক করুন। তারপর পেমেন্ট সম্পন্ন করুন এবং ট্রানজেকশন আইডি দিয়ে অর্ডার কনফার্ম করুন। আমাদের টিম যত দ্রুত সম্ভব আপনার অর্ডার প্রসেস করবে।',
      },
      {
        q: 'অর্ডার করার পর কতক্ষণের মধ্যে ডেলিভারি পাব?',
        a: 'বেশিরভাগ ডিজিটাল পণ্য পেমেন্ট যাচাইয়ের ৫–৩০ মিনিটের মধ্যে ডেলিভারি দেওয়া হয়। ব্যস্ত সময়ে সর্বোচ্চ ২৪ ঘণ্টা লাগতে পারে। ২৪ ঘণ্টার মধ্যে ডেলিভারি না পেলে আমাদের সাপোর্ট টিমে যোগাযোগ করুন।',
      },
      {
        q: 'অর্ডার ট্র্যাক করব কিভাবে?',
        a: 'আপনার অ্যাকাউন্টে লগইন করে "My Dashboard" থেকে অর্ডারের সর্বশেষ স্ট্যাটাস দেখতে পাবেন। এছাড়া অর্ডার কনফার্মেশন ইমেইলে অর্ডার নম্বর দিয়েও ট্র্যাক করা যাবে।',
      },
      {
        q: 'অর্ডার বাতিল করা যাবে কি?',
        a: 'পণ্য ডেলিভারির আগে অর্ডার বাতিল করে অন্য পণ্যের সাথে মূল্য বিনিময় করা যাবে। তবে ডেলিভারির পরে বাতিল করতে হলে রিফান্ড পলিসি প্রযোজ্য হবে।',
      },
      {
        q: 'একাধিক পণ্য একসাথে অর্ডার করা যাবে?',
        a: 'হ্যাঁ, আপনি কার্টে একাধিক পণ্য যোগ করে একবারে অর্ডার করতে পারবেন। একসাথে অর্ডার করলে মোট পেমেন্টের উপর বিশেষ ছাড়ও পেতে পারেন।',
      },
    ],
  },
  {
    id: 'payments',
    label: 'পেমেন্ট',
    icon: <CreditCard size={18} />,
    color: A,
    items: [
      {
        q: 'কোন কোন পেমেন্ট মেথড গ্রহণ করা হয়?',
        a: 'আমরা বিকাশ (Send Money ও Merchant), নগদ, রকেট এবং উপায় পেমেন্ট গ্রহণ করি। বিকাশ নম্বর: 01820-060046। বাকি সব মেথডের জন্য: 01840-099853।',
      },
      {
        q: 'পেমেন্ট করার পর কী করতে হবে?',
        a: 'পেমেন্ট করার পর ট্রানজেকশন আইডি নিয়ে আমাদের WhatsApp বা সাইটের Quick Order ফর্মের মাধ্যমে জানান। এরপর আমাদের টিম পেমেন্ট যাচাই করে অর্ডার প্রসেস করবে।',
      },
      {
        q: 'ভুল পরিমাণে পেমেন্ট করলে কী হবে?',
        a: 'ভুল পরিমাণে পেমেন্ট করলে সাথে সাথে আমাদের সাপোর্ট টিমে যোগাযোগ করুন। ট্রানজেকশন আইডি ও পরিমাণ জানালে আমরা সমস্যার সমাধান করব।',
      },
      {
        q: 'পেমেন্ট কি নিরাপদ?',
        a: 'হ্যাঁ, সম্পূর্ণ নিরাপদ। আমরা কোনো কার্ড বা ব্যাংক তথ্য সংরক্ষণ করি না। সকল পেমেন্ট সরাসরি মোবাইল ব্যাংকিং প্ল্যাটফর্মের মাধ্যমে সম্পন্ন হয়।',
      },
      {
        q: 'কুপন বা ডিসকাউন্ট কোড ব্যবহার করব কিভাবে?',
        a: 'চেকআউটের সময় "Coupon Code" ফিল্ডে আপনার কোড লিখুন এবং "Apply" করুন। বৈধ কোড হলে স্বয়ংক্রিয়ভাবে ছাড় প্রযোজ্য হবে।',
      },
    ],
  },
  {
    id: 'delivery',
    label: 'ডেলিভারি',
    icon: <Truck size={18} />,
    color: B,
    items: [
      {
        q: 'ডিজিটাল পণ্য কিভাবে ডেলিভারি দেওয়া হয়?',
        a: 'ডিজিটাল পণ্য (লাইসেন্স কি, সাবস্ক্রিপশন ইত্যাদি) WhatsApp, ইমেইল বা সাইটের "My Dashboard" এর মাধ্যমে সরাসরি পাঠানো হয়।',
      },
      {
        q: 'ডেলিভারি চার্জ আছে কি?',
        a: 'ডিজিটাল পণ্যের জন্য কোনো ডেলিভারি চার্জ নেই। পণ্যের মূল্যই চূড়ান্ত মূল্য।',
      },
      {
        q: 'রাতের বেলায় অর্ডার করলে কখন ডেলিভারি পাব?',
        a: 'আমাদের সাপোর্ট ২৪/৭ সক্রিয়। রাতের অর্ডারও সাধারণত ৩০ মিনিটের মধ্যে প্রসেস করা হয়। তবে রাত ১২টার পর অর্ডার করলে সর্বোচ্চ ২–৪ ঘণ্টা সময় লাগতে পারে।',
      },
      {
        q: 'ডেলিভারি না পেলে কী করব?',
        a: 'পেমেন্টের ২৪ ঘণ্টার মধ্যে পণ্য না পেলে আমাদের WhatsApp (01840-099853) বা সাইটের Contact Us পেজের মাধ্যমে সাথে সাথে অভিযোগ জানান। আমরা দ্রুত সমাধান করব।',
      },
    ],
  },
  {
    id: 'returns',
    label: 'রিফান্ড ও রিটার্ন',
    icon: <RotateCcw size={18} />,
    color: 'hsl(329,86%,56%)',
    items: [
      {
        q: 'রিফান্ড পাওয়া যাবে কি?',
        a: 'পণ্যে সমস্যা থাকলে বা আমাদের পক্ষ থেকে ভুল ডেলিভারি হলে পূর্ণ রিফান্ড প্রযোজ্য। তবে কাস্টমারের ব্যক্তিগত কারণে রিফান্ডের ক্ষেত্রে গেটওয়ে ও সার্ভিস চার্জ বাবদ ১০% কর্তন করা হবে।',
      },
      {
        q: 'রিফান্ড কতদিনের মধ্যে পাব?',
        a: 'রিফান্ড অনুরোধ অনুমোদনের ২–৫ কার্যদিবসের মধ্যে সংশ্লিষ্ট মোবাইল ব্যাংকিং নম্বরে রিফান্ড প্রেরণ করা হবে।',
      },
      {
        q: 'লাইসেন্স কি কাজ না করলে কী করব?',
        a: 'লাইসেন্স কি কাজ না করলে সাথে সাথে স্ক্রিনশট সহ আমাদের সাপোর্ট টিমে জানান। আমরা বিকল্প কি দেব বা পূর্ণ রিফান্ড দেব।',
      },
      {
        q: 'একবার ব্যবহার করা পণ্য রিটার্ন করা যাবে কি?',
        a: 'ডিজিটাল পণ্য একবার অ্যাক্টিভ বা ব্যবহার করলে সাধারণত রিটার্ন গ্রহণযোগ্য নয়। তবে পণ্যে ত্রুটি থাকলে প্রতিস্থাপন বা রিফান্ডের ব্যবস্থা করা হবে।',
      },
    ],
  },
  {
    id: 'account',
    label: 'অ্যাকাউন্ট',
    icon: <HelpCircle size={18} />,
    color: 'hsl(38,92%,50%)',
    items: [
      {
        q: 'অ্যাকাউন্ট খোলা কি বাধ্যতামূলক?',
        a: 'না, গেস্ট হিসেবেও অর্ডার করা যায়। তবে অ্যাকাউন্ট থাকলে অর্ডার ইতিহাস, লাইসেন্স কি এবং সাপোর্ট টিকেট একটি জায়গায় পাবেন।',
      },
      {
        q: 'পাসওয়ার্ড ভুলে গেলে কী করব?',
        a: 'লগইন পেজে "Forgot Password" অপশনে ক্লিক করুন। আপনার ইমেইলে রিসেট লিংক পাঠানো হবে। লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।',
      },
      {
        q: 'রেফারেল প্রোগ্রাম কী?',
        a: 'আপনার ইউনিক রেফারেল কোড বন্ধু বা পরিচিতদের শেয়ার করুন। তারা সেই কোড ব্যবহার করে অর্ডার করলে আপনি রিওয়ার্ড ক্রেডিট পাবেন যা পরবর্তী কেনাকাটায় ব্যবহার করা যাবে।',
      },
    ],
  },
];

const AccordionItem = ({ item, isOpen, onToggle, color }: { item: FAQItem; isOpen: boolean; onToggle: () => void; color: string }) => (
  <div
    className="rounded-2xl overflow-hidden transition-all duration-300"
    style={{
      background: isOpen ? 'hsla(0,0%,100%,0.75)' : 'hsla(0,0%,100%,0.55)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${isOpen ? color.replace(')', ',0.30)').replace('hsl(', 'hsla(') : 'hsla(258,78%,75%,0.18)'}`,
      boxShadow: isOpen ? `0 8px 32px ${color.replace(')', ',0.10)').replace('hsl(', 'hsla(')}` : '0 2px 8px hsla(226,35%,12%,0.04)',
    }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-all"
    >
      <span
        className="font-semibold text-sm leading-snug"
        style={{ color: isOpen ? color : 'hsl(226,35%,18%)' }}
      >
        {item.q}
      </span>
      <span
        className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300"
        style={{
          background: isOpen ? color.replace(')', ',0.12)').replace('hsl(', 'hsla(') : 'hsla(226,35%,12%,0.06)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        <ChevronDown size={14} style={{ color: isOpen ? color : 'hsl(226,35%,45%)' }} />
      </span>
    </button>

    <div
      className="overflow-hidden transition-all duration-300"
      style={{ maxHeight: isOpen ? '300px' : '0px', opacity: isOpen ? 1 : 0 }}
    >
      <div className="px-5 pb-4 pt-0">
        <div className="h-px mb-3" style={{ background: `linear-gradient(90deg, ${color.replace(')', ',0.20)').replace('hsl(', 'hsla(')}, transparent)` }} />
        <p className="text-[13px] leading-relaxed" style={{ color: 'hsl(226,35%,38%)' }}>
          {item.a}
        </p>
      </div>
    </div>
  </div>
);

const FAQs = () => {
  const [activeCategory, setActiveCategory] = useState('orders');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const currentCat = FAQ_CATS.find(c => c.id === activeCategory)!;

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setOpenIndex(0);
  };

  return (
    <>
      <SEOHead
        title="Frequently Asked Questions – Orders, Payment, Delivery & Refund"
        description="Find answers to all your questions about orders, payment methods, delivery, license keys and refunds at Shahed Store – Bangladesh's trusted digital software shop."
        canonical="https://shahedstore.com.bd/faqs"
        keywords="shahed store faq, digital software faq bangladesh, order help, payment help"
      />
      />
      <Navbar />

      <main className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-28 pb-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px]"
              style={{ background: 'radial-gradient(ellipse at 80% 0%, hsla(258,78%,55%,0.08), transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[300px]"
              style={{ background: 'radial-gradient(ellipse at 0% 100%, hsla(200,90%,45%,0.06), transparent 60%)' }} />
            <div className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 font-sora"
              style={{
                background: 'hsla(0,0%,100%,0.70)',
                backdropFilter: 'blur(12px)',
                border: '1px solid hsla(258,78%,75%,0.25)',
                color: A,
              }}>
              <HelpCircle size={12} /> সচরাচর জিজ্ঞাসা
            </div>

            <h1 className="font-sora font-black text-3xl md:text-5xl mb-4" style={{ color: 'hsl(226,35%,12%)' }}>
              আপনার{' '}
              <span style={{ background: `linear-gradient(135deg, ${A}, ${B})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                প্রশ্নের উত্তর
              </span>
              {' '}এখানে
            </h1>
            <p className="text-base md:text-lg max-w-xl mx-auto" style={{ color: 'hsl(226,35%,42%)' }}>
              অর্ডার, পেমেন্ট, ডেলিভারি ও রিফান্ড সংক্রান্ত সকল প্রশ্নের উত্তর পাবেন নিচে।
            </p>
          </div>
        </section>

        {/* ── Main Content ── */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24">

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {FAQ_CATS.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: isActive
                      ? cat.color.replace(')', ',0.12)').replace('hsl(', 'hsla(')
                      : 'hsla(0,0%,100%,0.65)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${isActive ? cat.color.replace(')', ',0.40)').replace('hsl(', 'hsla(') : 'hsla(258,78%,75%,0.20)'}`,
                    color: isActive ? cat.color : 'hsl(226,35%,42%)',
                    boxShadow: isActive ? `0 4px 16px ${cat.color.replace(')', ',0.15)').replace('hsl(', 'hsla(')}` : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                  }}
                >
                  {cat.icon}
                  {cat.label}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isActive ? cat.color.replace(')', ',0.15)').replace('hsl(', 'hsla(') : 'hsla(226,35%,12%,0.07)',
                      color: isActive ? cat.color : 'hsl(226,35%,48%)',
                    }}
                  >
                    {cat.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Questions */}
          <div
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: 'hsla(0,0%,100%,0.40)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid hsla(258,78%,75%,0.18)',
              boxShadow: '0 8px 40px hsla(226,35%,12%,0.06)',
            }}
          >
            {/* Category header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${currentCat.color}, ${currentCat.color.replace('hsl(', 'hsla(').replace(')', ',0.70)')})` }}
              >
                {currentCat.icon}
              </div>
              <div>
                <h2 className="font-sora font-bold text-lg" style={{ color: 'hsl(226,35%,15%)' }}>
                  {currentCat.label} সম্পর্কিত প্রশ্নাবলী
                </h2>
                <p className="text-xs" style={{ color: 'hsl(226,35%,50%)' }}>
                  {currentCat.items.length}টি প্রশ্নের উত্তর
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {currentCat.items.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  item={item}
                  isOpen={openIndex === idx}
                  onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
                  color={currentCat.color}
                />
              ))}
            </div>
          </div>

          {/* Still need help CTA */}
          <div
            className="mt-8 rounded-3xl p-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${A.replace(')', ',0.08)').replace('hsl(', 'hsla(')}, ${B.replace(')', ',0.08)').replace('hsl(', 'hsla(')})`,
              backdropFilter: 'blur(16px)',
              border: '1px solid hsla(258,78%,75%,0.22)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})` }}>
              <MessageCircle size={24} className="text-white" />
            </div>
            <h3 className="font-sora font-bold text-xl mb-2" style={{ color: 'hsl(226,35%,14%)' }}>
              প্রশ্নের উত্তর খুঁজে পাননি?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'hsl(226,35%,42%)' }}>
              আমাদের সাপোর্ট টিম ২৪/৭ আপনার সেবায় প্রস্তুত। সরাসরি যোগাযোগ করুন।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/8801840099853"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${A}, ${B})`, boxShadow: `0 4px 16px ${A.replace(')', ',0.28)').replace('hsl(', 'hsla(')}` }}
              >
                <MessageCircle size={15} /> WhatsApp করুন
              </a>
              <a
                href="/contact"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: 'hsla(0,0%,100%,0.75)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid hsla(258,78%,75%,0.25)',
                  color: 'hsl(226,35%,28%)',
                }}
              >
                সাপোর্ট টিকেট খুলুন <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingButtons />
    </>
  );
};

export default FAQs;
