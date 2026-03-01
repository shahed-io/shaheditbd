import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { RotateCcw, Shield, AlertCircle, CheckCircle } from 'lucide-react';

const RefundPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-36 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <RotateCcw size={28} className="text-background" />
          </div>
          <h1 className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Refund Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm">সর্বশেষ আপডেট: মার্চ ২০২৬</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-green-500/20 bg-green-500/5">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-foreground mb-2">৭ দিনের Replacement Guarantee</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  আমরা ১০০% genuine license key এবং credentials প্রদান করি। যদি কোনো কারণে আপনার key কাজ না করে, আমরা ৭ দিনের মধ্যে বিনামূল্যে replacement দেব।
                </p>
              </div>
            </div>
          </div>

          {[
            {
              title: 'Refund যে ক্ষেত্রে প্রযোজ্য',
              content: [
                'Delivered key সম্পূর্ণ কাজ না করলে এবং replacement সম্ভব না হলে',
                'Admin payment verify না হলে এবং delivery না হলে (pending orders)',
                'Double payment হয়ে গেলে',
              ],
              icon: <CheckCircle size={16} className="text-green-400" />,
            },
            {
              title: 'Refund যে ক্ষেত্রে প্রযোজ্য নয়',
              content: [
                'Digital product activate করার পর (key already used)',
                'Customer নিজে ভুলে ব্যবহার করেছেন এমন ক্ষেত্রে',
                '৭ দিনের পরে report করা সমস্যা',
                'Third-party incompatibility (hardware/software conflict)',
              ],
              icon: <AlertCircle size={16} className="text-amber-400" />,
            },
          ].map((section, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-foreground text-lg mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-muted-foreground text-sm">
                    {section.icon}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold text-foreground text-lg mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Refund প্রক্রিয়া
            </h2>
            <ol className="space-y-3">
              {[
                'Support ticket বা WhatsApp-এ order number সহ সমস্যা জানান',
                'আমাদের team ২৪ ঘণ্টার মধ্যে verify করবে',
                'Replacement সম্ভব হলে নতুন key পাঠানো হবে',
                'Refund প্রযোজ্য হলে ৩-৭ কার্যদিবসে original payment method-এ ফেরত দেওয়া হবে',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-foreground mb-2">আমাদের প্রতিশ্রুতি</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Shahed Store সর্বদা customer satisfaction-কে প্রাধান্য দেয়। যেকোনো সমস্যায় আমরা সর্বোচ্চ চেষ্টা করব সমাধান করতে। আমাদের লক্ষ্য হলো আপনাকে সেরা experience প্রদান করা।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
