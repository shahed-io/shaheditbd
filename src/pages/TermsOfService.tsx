import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: 'সেবার শর্তাবলী',
    content: `Shahed Store-এর ওয়েবসাইট ব্যবহার করে আপনি এই Terms of Service-এ সম্মত হচ্ছেন। এখানে উল্লেখিত শর্তাবলী মেনে না চললে আমরা সেবা প্রদান বন্ধ করার অধিকার রাখি।`,
  },
  {
    title: 'পণ্য ও সেবা',
    content: `আমরা শুধুমাত্র ডিজিটাল পণ্য (license keys, software credentials, subscriptions) বিক্রি করি। সকল পণ্য ১০০% genuine এবং official source থেকে সংগ্রহ করা। পণ্যের বর্ণনায় উল্লেখিত features ও compatibility নিশ্চিত করে কেনার অনুরোধ করা হচ্ছে।`,
  },
  {
    title: 'Payment',
    content: `বর্তমানে bKash, Nagad এবং Rocket-এর মাধ্যমে payment গ্রহণ করা হয়। Payment করার পর transaction ID এবং screenshot জমা দিতে হবে। Admin verify করার পর delivery দেওয়া হবে। Payment সংক্রান্ত যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন।`,
  },
  {
    title: 'Delivery',
    content: `Payment verify হওয়ার পর ১-৬ ঘণ্টার মধ্যে ডিজিটাল delivery দেওয়া হয়। License key/credentials ইমেইলে এবং My Orders dashboard-এ পাওয়া যাবে। কোনো delay হলে support ticket করুন।`,
  },
  {
    title: 'ব্যবহারের সীমাবদ্ধতা',
    content: `কেনা license শুধুমাত্র personal use-এর জন্য। Resell, redistribute বা commercial use নিষিদ্ধ। License agreement violation করলে আমরা দায়ী থাকব না।`,
  },
  {
    title: 'Intellectual Property',
    content: `Shahed Store-এর নাম, লোগো, ডিজাইন এবং content আমাদের intellectual property। অনুমতি ছাড়া কোনো content ব্যবহার নিষিদ্ধ।`,
  },
  {
    title: 'Disclaimer',
    content: `আমরা software manufacturer নই, authorized reseller। Software-এর bugs বা issues-এর জন্য manufacturer-কে contact করুন। আমরা শুধুমাত্র license delivery-র জন্য দায়বদ্ধ।`,
  },
  {
    title: 'Governing Law',
    content: `এই terms বাংলাদেশের আইন অনুযায়ী পরিচালিত। যেকোনো বিরোধের ক্ষেত্রে বাংলাদেশের আদালতের এখতিয়ার প্রযোজ্য।`,
  },
];

const TermsOfService = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-36 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Terms of Service</h1>
          <p className="text-muted-foreground mt-2 text-sm">সর্বশেষ আপডেট: মার্চ ২০২৬</p>
        </div>

        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-foreground text-lg mb-3 flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                {section.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          প্রশ্ন থাকলে <a href="/support" className="text-primary hover:underline">support team</a>-এর সাথে যোগাযোগ করুন।
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
