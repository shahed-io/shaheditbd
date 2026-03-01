import { Shield, Award, Users, Zap, CheckCircle, Star } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { WhatsAppButton } from '@/components/store/Extras';

const About = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-36 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-14 animate-slide-up">
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-primary border-primary/30 mb-4">
            <Award size={16} />
            আমাদের সম্পর্কে
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Shahed Store
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার ও সাবস্ক্রিপশন স্টোর। আমরা ২০২০ সাল থেকে হাজারো গ্রাহককে অরিজিনাল সফটওয়্যার ও ডিজিটাল পণ্য সেরা মূল্যে সরবরাহ করে আসছি।
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[
            { icon: <Users size={22} />, value: '50,000+', label: 'সন্তুষ্ট গ্রাহক' },
            { icon: <Star size={22} />, value: '4.9★', label: 'গড় রেটিং' },
            { icon: <Shield size={22} />, value: '100%', label: 'অরিজিনাল পণ্য' },
            { icon: <Zap size={22} />, value: '১-৬ ঘণ্টা', label: 'ডেলিভারি টাইম' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 text-center hover:border-primary/40 transition-all">
              <div className="text-primary mb-2 flex justify-center">{stat.icon}</div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>আমাদের গল্প</h2>
          <div className="text-muted-foreground space-y-3 leading-relaxed">
            <p>Shahed Store প্রতিষ্ঠিত হয়েছিল একটি সহজ লক্ষ্য নিয়ে — বাংলাদেশের সাধারণ মানুষের কাছে বিশ্বমানের সফটওয়্যার সাশ্রয়ী মূল্যে পৌঁছে দেওয়া।</p>
            <p>আমরা Microsoft, Adobe, Spotify, Netflix সহ বিশ্বের শীর্ষস্থানীয় সফটওয়্যার কোম্পানির অরিজিনাল পণ্য কর্পোরেট ও ভলিউম লাইসেন্সের মাধ্যমে সংগ্রহ করি এবং বাংলাদেশের গ্রাহকদের কাছে সেরা মূল্যে বিক্রি করি।</p>
            <p>আমাদের সকল পণ্য সম্পূর্ণ বৈধ, কার্যকর এবং আমরা Government Certified Digital Business Provider (DBID: 586772174)।</p>
          </div>
        </div>

        {/* Why choose us */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>কেন আমাদের বেছে নেবেন</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'সরকার নিবন্ধিত ডিজিটাল ব্যবসা প্রতিষ্ঠান',
              '১০০% অরিজিনাল ও জেনুইন সফটওয়্যার',
              'পেমেন্টের ১-৬ ঘণ্টায় ডেলিভারি',
              '২৪/৭ WhatsApp সাপোর্ট',
              'সমস্যায় রিফান্ড বা রিপ্লেসমেন্ট গ্যারান্টি',
              'বিকাশ, নগদ, রকেটে সহজ পেমেন্ট',
              '৫০,০০০+ সন্তুষ্ট গ্রাহক',
              'সর্বনিম্ন বাজারমূল্যে সফটওয়্যার',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card rounded-2xl p-8 border border-primary/20 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">যোগাযোগ করুন</h2>
          <p className="text-muted-foreground mb-4">হটলাইন: 01840-099853 | ইমেইল: info@shahedstore.com.bd</p>
          <p className="text-sm text-muted-foreground">DBID: 586772174 | ঠিকানা: Bangladesh</p>
        </div>
      </div>
    </main>
    <Footer />
    <WhatsAppButton />
  </div>
);

export default About;
