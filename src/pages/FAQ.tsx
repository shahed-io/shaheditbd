import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, HelpCircle } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

const faqData = [
  {
    category: 'অর্ডার ও পেমেন্ট',
    items: [
      { q: 'কীভাবে অর্ডার করবো?', a: 'পণ্য কার্টে যোগ করুন → চেকআউটে যান → পেমেন্ট করুন (বিকাশ/নগদ/রকেট) → ট্রানজেকশন আইডি দিন। পেমেন্ট যাচাইয়ের পর ডেলিভারি দেওয়া হবে।' },
      { q: 'পেমেন্টের কত সময় পর ডেলিভারি পাবো?', a: 'পেমেন্ট নিশ্চিতের ১-৬ ঘণ্টার মধ্যে আপনার ইমেইলে পণ্য পাঠানো হবে। কখনো কখনো রাতে অর্ডার হলে পরের দিন সকালে ডেলিভারি হতে পারে।' },
      { q: 'কোন কোন পেমেন্ট পদ্ধতি সাপোর্ট করে?', a: 'বিকাশ, নগদ, রকেট-এর মাধ্যমে পেমেন্ট করা যায়। মার্চেন্ট নম্বর: 01840-099853।' },
      { q: 'অর্ডার কিভাবে ট্র্যাক করবো?', a: '"অর্ডার ট্র্যাক করুন" পেজে গিয়ে আপনার অর্ডার নম্বর ও ইমেইল দিয়ে অর্ডারের বর্তমান অবস্থা দেখুন।' },
    ],
  },
  {
    category: 'পণ্য ও লাইসেন্স',
    items: [
      { q: 'পণ্যগুলো কি অরিজিনাল?', a: 'হ্যাঁ, আমাদের সব পণ্য ১০০% অরিজিনাল ও জেনুইন। আমরা Govt. Certified Digital Business Provider (DBID: 586772174)।' },
      { q: 'লাইসেন্স কি ডিভাইস-স্পেসিফিক?', a: 'পণ্যভেদে ভিন্ন। প্রতিটি পণ্যের বিবরণে কতটি ডিভাইসে ব্যবহার করা যাবে তা উল্লেখ থাকে।' },
      { q: 'কতদিনের সাপোর্ট পাবো?', a: 'সব পণ্যে পার্চেজ-পরবর্তী সাপোর্ট দেওয়া হয়। সমস্যায় WhatsApp বা সাপোর্ট টিকেটের মাধ্যমে যোগাযোগ করুন।' },
      { q: 'Windows বা Office এর বাংলাদেশি মূল্য কেন এত কম?', a: 'আমরা কর্পোরেট/ভলিউম লাইসেন্সের মাধ্যমে সাশ্রয়ী মূল্যে অরিজিনাল পণ্য সরবরাহ করি। এটি সম্পূর্ণ বৈধ ও কার্যকর।' },
    ],
  },
  {
    category: 'রিফান্ড ও সমস্যা',
    items: [
      { q: 'রিফান্ড পলিসি কী?', a: 'পণ্যে কোনো সমস্যা হলে ডেলিভারির ৭২ ঘণ্টার মধ্যে সাপোর্টে যোগাযোগ করুন। সমস্যা প্রমাণিত হলে রিফান্ড বা রিপ্লেসমেন্ট দেওয়া হবে।' },
      { q: 'লাইসেন্স কাজ না করলে কী করবো?', a: 'WhatsApp বা সাপোর্ট টিকেটে অর্ডার নম্বর ও সমস্যার বিবরণ পাঠান। আমরা যত দ্রুত সম্ভব সমাধান দেবো।' },
    ],
  },
];

const FAQ = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-primary border-primary/30 mb-4">
              <HelpCircle size={16} />
              সচরাচর জিজ্ঞাসা
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              FAQ
            </h1>
            <p className="text-muted-foreground">আপনার প্রশ্নের উত্তর এখানে পাবেন</p>
          </div>

          <div className="space-y-8">
            {faqData.map((section) => (
              <div key={section.category}>
                <h2 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                  {section.category}
                </h2>
                <div className="space-y-2">
                  {section.items.map((item, i) => {
                    const key = `${section.category}-${i}`;
                    const isOpen = openItems[key];
                    return (
                      <div key={key} className="glass-card rounded-xl overflow-hidden border border-border">
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/20 transition-colors"
                        >
                          {item.q}
                          {isOpen ? <ChevronUp size={16} className="text-primary flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-border bg-muted/10 pt-3 leading-relaxed">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 glass-card rounded-2xl p-6 text-center border border-primary/20">
            <p className="text-muted-foreground mb-4">এখানে আপনার প্রশ্নের উত্তর না পেলে আমাদের সাথে সরাসরি যোগাযোগ করুন</p>
            <a
              href="https://wa.me/8801840099853"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
            >
              <MessageCircle size={18} />
              WhatsApp-এ জিজ্ঞেস করুন
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
