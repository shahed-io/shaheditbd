import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { Lock } from 'lucide-react';

const sections = [
  {
    title: 'তথ্য সংগ্রহ',
    content: `আমরা order processing-এর জন্য নাম, ইমেইল, ফোন নম্বর সংগ্রহ করি। Payment verification-এর জন্য transaction ID এবং screenshot সংরক্ষণ করা হয়। আমরা শুধুমাত্র প্রয়োজনীয় তথ্য সংগ্রহ করি।`,
  },
  {
    title: 'তথ্য ব্যবহার',
    content: `সংগৃহীত তথ্য শুধুমাত্র order processing, delivery এবং customer support-এর জন্য ব্যবহার করা হয়। Marketing email পাঠানোর আগে আপনার consent নেওয়া হবে। তৃতীয় পক্ষের কাছে তথ্য বিক্রি করা হয় না।`,
  },
  {
    title: 'তথ্য সুরক্ষা',
    content: `আপনার তথ্য encrypted database-এ সংরক্ষিত। Payment screenshots শুধুমাত্র admin verification-এর জন্য ব্যবহার হয়। আমরা industry-standard security practices অনুসরণ করি।`,
  },
  {
    title: 'Cookies',
    content: `আমরা shopping cart এবং session management-এর জন্য browser storage ব্যবহার করি। Authentication-এর জন্য secure cookies ব্যবহার করা হয়। আপনি যেকোনো সময় browser settings থেকে cookies মুছে দিতে পারেন।`,
  },
  {
    title: 'তৃতীয় পক্ষের সেবা',
    content: `Payment processing-এর জন্য bKash, Nagad এবং Rocket-এর সেবা ব্যবহার করা হয়। এই platforms-এর নিজস্ব privacy policy প্রযোজ্য। আমরা payment gateway-এর sensitive information store করি না।`,
  },
  {
    title: 'আপনার অধিকার',
    content: `আপনি যেকোনো সময় আপনার personal data দেখতে, সংশোধন করতে বা মুছে দেওয়ার অনুরোধ করতে পারেন। Account delete করতে support team-এ যোগাযোগ করুন।`,
  },
  {
    title: 'Policy পরিবর্তন',
    content: `এই privacy policy পরিবর্তন হলে registered users-কে email-এ জানানো হবে এবং ওয়েবসাইটে update করা হবে।`,
  },
];

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-36 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Privacy Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm">সর্বশেষ আপডেট: মার্চ ২০২৬</p>
        </div>

        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-foreground text-lg mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{section.title}</h2>
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

export default PrivacyPolicy;
