import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  MessageCircle, Phone, Mail, ChevronDown, ChevronUp,
  Send, Headphones, Search, CheckCircle, Clock, AlertCircle
} from 'lucide-react';

const WHATSAPP_NUMBER = '8801840099853';

const faqs = [
  {
    q: 'Payment করার পর কখন product পাব?',
    a: 'Admin payment proof verify করার পর সাথে সাথে আপনার ইমেইল ও My Orders-এ license key/credentials পাঠানো হবে। সাধারণত ১-৬ ঘণ্টার মধ্যে হয়।',
  },
  {
    q: 'Key কাজ না করলে কী করব?',
    a: 'আমাদের ৭ দিনের replacement guarantee আছে। সাথে সাথে WhatsApp বা support ticket করুন।',
  },
  {
    q: 'Refund পাওয়া যাবে?',
    a: 'Digital product হওয়ায় সাধারণত refund দেওয়া হয় না। তবে key কাজ না করলে বিনামূল্যে replacement দেওয়া হয়।',
  },
  {
    q: 'কোন payment method গ্রহণযোগ্য?',
    a: 'bKash, Nagad এবং Rocket গ্রহণযোগ্য। Send Money করতে হবে।',
  },
  {
    q: 'অর্ডার ট্র্যাক করব কীভাবে?',
    a: 'লগইন করে My Orders-এ গেলে সব অর্ডারের status দেখতে পাবেন। Order number দিয়েও support ticket করতে পারবেন।',
  },
  {
    q: 'Bundle কিনলে কি discount পাওয়া যায়?',
    a: 'হ্যাঁ! নিয়মিত flash sale ও coupon code থেকে discount পাওয়া যায়। WhatsApp-এ যোগাযোগ করলে special bundle offer পাওয়া যেতে পারে।',
  },
];

const Support = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error('সব required field পূরণ করুন');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tn = 'TKT-' + Date.now().toString().slice(-7);
      const { error } = await supabase.from('support_tickets').insert({
        ticket_number: tn,
        user_id: user?.id || null,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim() || null,
        order_number: orderNumber.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'open',
        priority: orderNumber.trim() ? 'high' : 'normal',
      });
      if (error) throw error;
      setTicketNumber(tn);
      setSubmitted(true);
      toast.success('টিকিট জমা হয়েছে!');
    } catch (err: any) {
      toast.error('টিকিট জমা দিতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-2">Help Center</p>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              কীভাবে <span className="gradient-text">সাহায্য করতে পারি?</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              ২৪/৭ support team সবসময় আপনার পাশে। যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন।
            </p>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card-hover rounded-2xl p-6 flex flex-col items-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <MessageCircle size={24} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">WhatsApp</p>
                <p className="text-muted-foreground text-sm">সবচেয়ে দ্রুত response</p>
                <p className="text-primary text-sm font-medium mt-1">01840-099853</p>
              </div>
            </a>

            <a
              href="tel:01840099853"
              className="glass-card-hover rounded-2xl p-6 flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Phone size={24} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Phone</p>
                <p className="text-muted-foreground text-sm">সকাল ১০টা - রাত ১০টা</p>
                <p className="text-primary text-sm font-medium mt-1">01840-099853</p>
              </div>
            </a>

            <a
              href="mailto:support@shahedstore.com.bd"
              className="glass-card-hover rounded-2xl p-6 flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Mail size={24} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Email</p>
                <p className="text-muted-foreground text-sm">২৪ ঘণ্টার মধ্যে reply</p>
                <p className="text-primary text-sm font-medium mt-1">support@shahedstore.com.bd</p>
              </div>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ticket Form */}
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <Headphones className="inline mr-2 text-primary" size={22} />
                Support <span className="gradient-text">Ticket</span> করুন
              </h2>

              {submitted ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">টিকিট জমা হয়েছে!</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    আপনার ticket number:
                  </p>
                  <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 font-mono text-primary font-bold text-lg mb-4">
                    {ticketNumber}
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">
                    আমরা শীঘ্রই আপনার ইমেইলে/WhatsApp-এ response করব।
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=আমার ticket number: ${ticketNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} />
                      WhatsApp-এ জানান
                    </a>
                    <button
                      onClick={() => { setSubmitted(false); setName(''); setEmail(''); setPhone(''); setOrderNumber(''); setSubject(''); setMessage(''); }}
                      className="flex-1 glass-card border border-border text-muted-foreground rounded-xl py-2.5 text-sm font-medium hover:border-primary/50 transition-colors"
                    >
                      নতুন Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">নাম *</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="আপনার নাম" required
                        className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">ফোন</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
                        className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">ইমেইল *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      <Search size={12} className="inline mr-1" />
                      অর্ডার নম্বর (থাকলে দিন)
                    </label>
                    <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="যেমন: SS-12345678"
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    {orderNumber && (
                      <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Order-based ticket high priority হিসেবে গণ্য হবে
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">বিষয় *</label>
                    <select value={subject} onChange={e => setSubject(e.target.value)} required
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                      <option value="">বিষয় নির্বাচন করুন</option>
                      <option value="Key কাজ করছে না">Key কাজ করছে না</option>
                      <option value="Payment সমস্যা">Payment সমস্যা</option>
                      <option value="Delivery পাইনি">Delivery পাইনি</option>
                      <option value="Refund/Replacement">Refund/Replacement</option>
                      <option value="Technical সমস্যা">Technical সমস্যা</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">বিস্তারিত *</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} required
                      placeholder="আপনার সমস্যা বা প্রশ্ন বিস্তারিত লিখুন..."
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full btn-glow py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    <Send size={14} />
                    {loading ? 'জমা হচ্ছে...' : 'টিকিট জমা দিন'}
                  </button>

                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Clock size={11} />
                    সাধারণত ১-৬ ঘণ্টার মধ্যে response করা হয়
                  </p>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                সাধারণ <span className="gradient-text">প্রশ্নাবলী</span>
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="glass-card rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/5 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                      {openFaq === i ? (
                        <ChevronUp size={16} className="text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4">
                        <p className="text-muted-foreground text-sm leading-relaxed border-t border-border pt-3">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <div className="mt-6 glass-card rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <MessageCircle size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">সবচেয়ে দ্রুত সাহায্য পেতে</p>
                    <p className="text-muted-foreground text-xs">WhatsApp-এ message করুন</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=হ্যালো, আমার একটি প্রশ্ন আছে`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <MessageCircle size={16} />
                  WhatsApp-এ Chat করুন
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
