import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

const sections = [
  {
    title: 'রিফান্ড নীতি',
    content: `ডিজিটাল পণ্যের ক্ষেত্রে রিফান্ড শুধুমাত্র নিম্নলিখিত শর্তে দেওয়া হবে:

• লাইসেন্স কি কাজ না করলে এবং আমরা প্রতিস্থাপন দিতে অক্ষম হলে
• পণ্য ডেলিভারি না হলে (ট্র্যাকিং সিস্টেমে প্রমাণযোগ্য)
• ভুল পণ্য ডেলিভারি হলে

রিফান্ড রিকোয়েস্ট ডেলিভারির ৭২ ঘণ্টার মধ্যে করতে হবে। ৭২ ঘণ্টার পর কোনো রিফান্ড রিকোয়েস্ট গৃহীত হবে না।

রিফান্ড সাধারণত ৩-৭ কার্যদিবসের মধ্যে মূল পেমেন্ট পদ্ধতিতে প্রদান করা হয়।`,
  },
  {
    title: 'রিটার্ন পলিসি',
    content: `ডিজিটাল পণ্যের ক্ষেত্রে ফিজিক্যাল রিটার্ন প্রযোজ্য নয়। তবে নিম্নলিখিত ক্ষেত্রে পণ্য প্রতিস্থাপন করা হবে:

• লাইসেন্স কি ইনভ্যালিড হলে
• সাবস্ক্রিপশন আর্লি টার্মিনেট হলে (আমাদের দোষে)
• পণ্যের বিবরণের সাথে মিল না থাকলে

প্রতিস্থাপনের জন্য সাপোর্ট টিকেট বা WhatsApp-এ যোগাযোগ করুন।`,
  },
  {
    title: 'যোগাযোগ',
    content: `রিফান্ড বা রিটার্নের জন্য:
• WhatsApp: +8801840099853
• Email: info@shahedstore.com.bd
• সাপোর্ট টিকেট: সাইটের "সাপোর্ট" পেজ থেকে`,
  },
];

const RefundPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-36 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            রিফান্ড ও রিটার্ন পলিসি
          </h1>
          <p className="text-muted-foreground">সর্বশেষ আপডেট: মার্চ ২০২৬</p>
        </div>
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{section.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
