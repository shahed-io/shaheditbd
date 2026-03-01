import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-36 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            গোপনীয়তা নীতি
          </h1>
          <p className="text-muted-foreground">সর্বশেষ আপডেট: মার্চ ২০২৬</p>
        </div>
        <div className="space-y-6">
          {[
            { title: 'তথ্য সংগ্রহ', content: 'আমরা আপনার নাম, ইমেইল, ফোন নম্বর এবং পেমেন্ট সংক্রান্ত তথ্য সংগ্রহ করি। এই তথ্যগুলো অর্ডার প্রসেস করতে এবং আপনাকে সেবা প্রদান করতে ব্যবহার করা হয়।' },
            { title: 'তথ্যের ব্যবহার', content: 'আপনার তথ্য শুধুমাত্র অর্ডার ডেলিভারি, কাস্টমার সাপোর্ট এবং প্রয়োজনীয় যোগাযোগের জন্য ব্যবহার করা হয়। তৃতীয় পক্ষের কাছে আপনার তথ্য বিক্রি বা শেয়ার করা হয় না।' },
            { title: 'নিরাপত্তা', content: 'আপনার তথ্য এনক্রিপ্টেড সার্ভারে সুরক্ষিত রাখা হয়। আমরা শিল্প-মানের নিরাপত্তা ব্যবস্থা ব্যবহার করি।' },
            { title: 'কুকিজ', content: 'আমাদের ওয়েবসাইট সেশন কুকিজ ব্যবহার করে। ব্রাউজার সেটিংসে কুকিজ বন্ধ করা যাবে, তবে এতে সাইটের কিছু ফিচার কাজ নাও করতে পারে।' },
            { title: 'যোগাযোগ', content: 'গোপনীয়তা নীতি সম্পর্কিত কোনো প্রশ্ন থাকলে info@shahedstore.com.bd-এ ইমেইল করুন।' },
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

export default PrivacyPolicy;
