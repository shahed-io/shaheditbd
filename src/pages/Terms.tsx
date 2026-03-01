import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-36 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            সেবার শর্তাবলী
          </h1>
          <p className="text-muted-foreground">সর্বশেষ আপডেট: মার্চ ২০২৬</p>
        </div>
        <div className="space-y-6">
          {[
            { title: 'সেবা গ্রহণের শর্ত', content: 'Shahed Store-এর সেবা ব্যবহার করে আপনি এই শর্তাবলী মেনে নিচ্ছেন বলে গণ্য হবে। ১৮ বছরের নিচে কেউ আমাদের সেবা ব্যবহার করতে পারবে না।' },
            { title: 'পণ্যের ব্যবহার', content: 'আমাদের পণ্য শুধুমাত্র ব্যক্তিগত ব্যবহারের জন্য। বাণিজ্যিক পুনর্বিতরণ বা রিসেল করা যাবে না (রিসেলার প্যাকেজ ব্যতীত)।' },
            { title: 'অর্ডার বাতিল', content: 'পেমেন্ট সম্পন্ন হওয়ার পর অর্ডার বাতিল করা যাবে না। ডেলিভারির আগে শুধুমাত্র বিশেষ পরিস্থিতিতে বাতিল বিবেচনা করা হবে।' },
            { title: 'দায়বদ্ধতার সীমা', content: 'Shahed Store সর্বোচ্চ পরিষেবা নিশ্চিত করার চেষ্টা করে। তবে ইন্টারনেট বিভ্রাট, সার্ভার সমস্যা বা প্রযুক্তিগত ত্রুটির কারণে সৃষ্ট ক্ষয়ক্ষতির জন্য আমরা দায়ী নই।' },
            { title: 'পরিবর্তনের অধিকার', content: 'Shahed Store যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখে। পরিবর্তন সাইটে প্রকাশিত হলে তা কার্যকর হবে।' },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{s.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
