import { useState } from 'react';
import { Send, MessageCircle, Ticket, CheckCircle } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Support = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', orderNumber: '', priority: 'normal' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const ticketNumber = `TK-${Date.now().toString().slice(-8)}`;
    const { error: err } = await supabase.from('support_tickets').insert({
      ticket_number: ticketNumber,
      customer_name: form.name.trim(),
      customer_email: form.email.trim().toLowerCase(),
      customer_phone: form.phone.trim() || null,
      subject: form.subject.trim(),
      message: form.message.trim(),
      order_number: form.orderNumber.trim() || null,
      priority: form.priority,
      user_id: user?.id || null,
    });

    if (err) {
      setError('টিকেট সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-primary border-primary/30 mb-4">
              <Ticket size={16} />
              সাপোর্ট সেন্টার
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              সাহায্য দরকার?
            </h1>
            <p className="text-muted-foreground">টিকেট সাবমিট করুন বা সরাসরি WhatsApp-এ যোগাযোগ করুন</p>
          </div>

          {/* Quick contact */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer" className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-green-400/40 transition-all group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                <MessageCircle size={22} />
              </div>
              <div>
                <p className="font-semibold text-foreground">WhatsApp সাপোর্ট</p>
                <p className="text-muted-foreground text-sm">+8801840099853</p>
              </div>
            </a>
            <a href="https://m.me/shahedstore" target="_blank" rel="noopener noreferrer" className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-blue-400/40 transition-all group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0078FF, #00C6FF)' }}>
                <MessageCircle size={22} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Messenger সাপোর্ট</p>
                <p className="text-muted-foreground text-sm">Facebook Messenger</p>
              </div>
            </a>
          </div>

          {success ? (
            <div className="glass-card rounded-2xl p-10 text-center border border-green-400/30 bg-green-400/5">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">টিকেট সাবমিট হয়েছে!</h2>
              <p className="text-muted-foreground">আমরা যত দ্রুত সম্ভব আপনার ইমেইলে যোগাযোগ করব। সাধারণত ২-৬ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-foreground text-lg mb-5">সাপোর্ট টিকেট সাবমিট করুন</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">আপনার নাম *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none text-sm" placeholder="নাম লিখুন" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">ইমেইল *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none text-sm" placeholder="ইমেইল লিখুন" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">ফোন নম্বর</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none text-sm" placeholder="01XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">অর্ডার নম্বর (যদি থাকে)</label>
                    <input value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none text-sm" placeholder="SS-XXXXXXXX-XXX" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">বিষয় *</label>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none text-sm" placeholder="সমস্যার সংক্ষিপ্ত বিবরণ" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">বিস্তারিত বিবরণ *</label>
                  <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none text-sm resize-none" placeholder="সমস্যার বিস্তারিত লিখুন..." />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="w-full btn-glow py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2">
                  {loading ? <span className="w-5 h-5 border-2 border-background/50 border-t-background rounded-full animate-spin" /> : <><Send size={18} />টিকেট সাবমিট করুন</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
