import { useState } from 'react';
import { Phone, Mail, Globe, MessageCircle, Facebook, Instagram, Send, MapPin, Clock, CheckCircle } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { FloatingButtons } from '@/components/store/Extras';
import { GlassCard, SectionCard } from '@/components/store/PolicyLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const CONTACT_INFO = [
  {
    icon: <Phone size={18} />,
    label: 'ফোন',
    value: '01840-099853',
    href: 'tel:01840099853',
    color: 'hsl(142,72%,38%)',
    bg: 'hsla(142,72%,38%,0.08)',
    border: 'hsla(142,72%,38%,0.20)',
  },
  {
    icon: <MessageCircle size={18} />,
    label: 'WhatsApp',
    value: '01840-099853',
    href: 'https://wa.me/8801840099853',
    color: 'hsl(142,58%,40%)',
    bg: 'hsla(142,58%,40%,0.08)',
    border: 'hsla(142,58%,40%,0.20)',
    ext: true,
  },
  {
    icon: <Mail size={18} />,
    label: 'ইমেইল',
    value: 'info@shahedstore.com.bd',
    href: 'mailto:info@shahedstore.com.bd',
    color: A,
    bg: 'hsla(258,78%,55%,0.08)',
    border: 'hsla(258,78%,55%,0.20)',
  },
  {
    icon: <Globe size={18} />,
    label: 'ওয়েবসাইট',
    value: 'www.shahedstore.com.bd',
    href: 'https://www.shahedstore.com.bd',
    color: B,
    bg: 'hsla(200,90%,45%,0.08)',
    border: 'hsla(200,90%,45%,0.20)',
    ext: true,
  },
];

const SOCIAL = [
  { icon: <Facebook size={20} />, label: 'Facebook', href: 'https://www.facebook.com/Shahed.Store365', color: 'hsl(221,44%,41%)', ext: true },
  { icon: <MessageCircle size={20} />, label: 'WhatsApp', href: 'https://wa.me/shahedstore', color: 'hsl(142,58%,40%)', ext: true },
  { icon: <Instagram size={20} />, label: 'Instagram', href: 'https://www.instagram.com/shahedstore.com.bd/', color: 'hsl(329,86%,56%)', ext: true },
];

const HOURS = [
  { day: 'শনি – বৃহস্পতি', time: 'সকাল ৯টা – রাত ১১টা' },
  { day: 'শুক্রবার', time: 'দুপুর ২টা – রাত ১১টা' },
  { day: 'জরুরি সাপোর্ট', time: '২৪/৭ WhatsApp' },
];

export default function ContactUs() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: 'ত্রুটি', description: 'নাম, ইমেইল এবং বার্তা আবশ্যক।', variant: 'destructive' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: 'ত্রুটি', description: 'সঠিক ইমেইল ঠিকানা দিন।', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const ticketNumber = `TK-${Array.from(crypto.getRandomValues(new Uint8Array(5))).map(b => b.toString(36)).join('').toUpperCase().slice(0, 8)}`;
      const { error } = await supabase.from('support_tickets').insert({
        ticket_number: ticketNumber,
        customer_name: form.name.trim().slice(0, 100),
        customer_email: form.email.trim().slice(0, 255),
        customer_phone: form.phone.trim().slice(0, 20) || null,
        subject: form.subject.trim().slice(0, 200) || 'Contact Form Enquiry',
        message: form.message.trim().slice(0, 2000),
        status: 'open',
        priority: 'medium',
      });
      if (error) throw error;
      setSent(true);
      toast({ title: '✅ বার্তা পাঠানো হয়েছে!', description: `টিকেট নম্বর: ${ticketNumber}` });
    } catch {
      toast({ title: 'ত্রুটি', description: 'বার্তা পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ background: 'linear-gradient(145deg, hsl(258,55%,97%) 0%, hsl(220,40%,96%) 40%, hsl(200,50%,96%) 100%)' }}
    >
      <SEOHead title="Contact Us — Shahed Store" description="Shahed Store-এর সাথে যোগাযোগ করুন। ফোন, ইমেইল, WhatsApp বা ফর্মের মাধ্যমে আমাদের সাপোর্ট টিমের সাথে কথা বলুন।" />
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px]"
            style={{ background: `radial-gradient(circle, ${A}18, transparent 65%)` }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px]"
            style={{ background: `radial-gradient(circle, ${B}12, transparent 65%)` }} />
          <div className="absolute inset-0"
            style={{ backgroundImage: `radial-gradient(circle, ${A}0f 1px, transparent 1px)`, backgroundSize: '26px 26px' }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold mb-5"
            style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: `1px solid ${A}35`, color: A, boxShadow: `0 4px 16px ${A}20` }}>
            <MessageCircle size={13} /> Contact Support
          </div>

          <div className="inline-block px-8 py-5 rounded-3xl mb-5"
            style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.80), rgba(255,255,255,0.55))', backdropFilter: 'blur(32px)', border: '1.5px solid rgba(255,255,255,0.80)', boxShadow: `0 12px 50px ${A}18` }}>
            <h1 className="font-sora font-black text-4xl sm:text-5xl leading-none"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Contact Us
            </h1>
          </div>

          <p className="text-[14px] max-w-lg mx-auto leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>
            যেকোনো সমস্যা বা প্রশ্নের জন্য আমাদের সাপোর্ট টিম সর্বদা প্রস্তুত। আমরা সাধারণত ১–৬ ঘণ্টার মধ্যে সাড়া দিই।
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-8">

        {/* Contact Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONTACT_INFO.map(c => (
            <a key={c.label} href={c.href} target={c.ext ? '_blank' : undefined} rel={c.ext ? 'noopener noreferrer' : undefined}
              className="group flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-all hover:-translate-y-1"
              style={{ background: c.bg, border: `1px solid ${c.border}`, backdropFilter: 'blur(16px)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${c.color}22, ${c.color}10)`, border: `1px solid ${c.color}30` }}>
                <span style={{ color: c.color }}>{c.icon}</span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'hsl(226,25%,55%)' }}>{c.label}</p>
                <p className="font-sora font-bold text-[13px]" style={{ color: 'hsl(226,35%,18%)' }}>{c.value}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Main grid: Form + Sidebar */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Contact Form ── */}
          <div className="lg:col-span-3">
            <GlassCard className="p-6 sm:p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'hsla(142,72%,38%,0.12)', border: '2px solid hsla(142,72%,38%,0.30)' }}>
                    <CheckCircle size={32} style={{ color: 'hsl(142,72%,38%)' }} />
                  </div>
                  <h2 className="font-sora font-black text-xl" style={{ color: 'hsl(226,35%,14%)' }}>বার্তা পাঠানো হয়েছে!</h2>
                  <p className="text-[13px]" style={{ color: 'hsl(226,25%,45%)' }}>
                    আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।
                  </p>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                    className="mt-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${A}, ${B})` }}>
                    আরেকটি বার্তা পাঠান
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="font-sora font-black text-lg" style={{ color: 'hsl(226,35%,12%)' }}>বার্তা পাঠান</h2>
                    <p className="text-[13px] mt-1" style={{ color: 'hsl(226,25%,48%)' }}>ফর্ম পূরণ করুন, আমরা দ্রুত সাড়া দেব।</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'hsl(226,35%,30%)' }}>
                          পূর্ণ নাম <span style={{ color: A }}>*</span>
                        </label>
                        <input
                          name="name" value={form.name} onChange={handleChange}
                          placeholder="আপনার নাম লিখুন"
                          maxLength={100}
                          className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid hsla(258,78%,75%,0.25)', color: 'hsl(226,35%,18%)' }}
                          onFocus={e => e.currentTarget.style.borderColor = `${A}60`}
                          onBlur={e => e.currentTarget.style.borderColor = 'hsla(258,78%,75%,0.25)'}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'hsl(226,35%,30%)' }}>
                          ইমেইল <span style={{ color: A }}>*</span>
                        </label>
                        <input
                          name="email" type="email" value={form.email} onChange={handleChange}
                          placeholder="email@example.com"
                          maxLength={255}
                          className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid hsla(258,78%,75%,0.25)', color: 'hsl(226,35%,18%)' }}
                          onFocus={e => e.currentTarget.style.borderColor = `${A}60`}
                          onBlur={e => e.currentTarget.style.borderColor = 'hsla(258,78%,75%,0.25)'}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'hsl(226,35%,30%)' }}>ফোন নম্বর</label>
                        <input
                          name="phone" value={form.phone} onChange={handleChange}
                          placeholder="01XXXXXXXXX"
                          maxLength={20}
                          className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid hsla(258,78%,75%,0.25)', color: 'hsl(226,35%,18%)' }}
                          onFocus={e => e.currentTarget.style.borderColor = `${A}60`}
                          onBlur={e => e.currentTarget.style.borderColor = 'hsla(258,78%,75%,0.25)'}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'hsl(226,35%,30%)' }}>বিষয়</label>
                        <select
                          name="subject" value={form.subject} onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all appearance-none"
                          style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid hsla(258,78%,75%,0.25)', color: form.subject ? 'hsl(226,35%,18%)' : 'hsl(226,25%,58%)' }}
                          onFocus={e => e.currentTarget.style.borderColor = `${A}60`}
                          onBlur={e => e.currentTarget.style.borderColor = 'hsla(258,78%,75%,0.25)'}
                        >
                          <option value="">বিষয় নির্বাচন করুন</option>
                          <option value="Product Enquiry">পণ্য সম্পর্কে জিজ্ঞাসা</option>
                          <option value="Order Issue">অর্ডার সমস্যা</option>
                          <option value="Payment Issue">পেমেন্ট সমস্যা</option>
                          <option value="Technical Support">টেকনিক্যাল সাপোর্ট</option>
                          <option value="Refund Request">রিফান্ড অনুরোধ</option>
                          <option value="Other">অন্যান্য</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'hsl(226,35%,30%)' }}>
                        বার্তা <span style={{ color: A }}>*</span>
                      </label>
                      <textarea
                        name="message" value={form.message} onChange={handleChange}
                        placeholder="আপনার বার্তা বিস্তারিত লিখুন..."
                        maxLength={2000}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all resize-none"
                        style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid hsla(258,78%,75%,0.25)', color: 'hsl(226,35%,18%)' }}
                        onFocus={e => e.currentTarget.style.borderColor = `${A}60`}
                        onBlur={e => e.currentTarget.style.borderColor = 'hsla(258,78%,75%,0.25)'}
                      />
                      <p className="text-right text-[11px] mt-1" style={{ color: 'hsl(226,25%,60%)' }}>{form.message.length}/2000</p>
                    </div>

                    <button
                      type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[14px] text-white transition-all hover:opacity-90 disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, ${A}, ${B})`, boxShadow: `0 8px 24px ${A}35` }}>
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      {loading ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
                    </button>
                  </form>
                </>
              )}
            </GlassCard>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Business Hours */}
            <SectionCard icon={<Clock size={15} />} title="সাপোর্ট সময়" accentFrom={A} accentTo={B}>
              <div className="space-y-2.5">
                {HOURS.map(h => (
                  <div key={h.day} className="flex justify-between items-center py-2 px-1"
                    style={{ borderBottom: '1px solid hsla(258,78%,55%,0.08)' }}>
                    <span className="text-[12px] font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>{h.day}</span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'hsla(258,78%,55%,0.08)', color: A }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Social Media */}
            <SectionCard icon={<Globe size={15} />} title="সোশ্যাল মিডিয়া" accentFrom={A} accentTo={B}>
              <div className="space-y-2.5">
                {SOCIAL.map(s => (
                  <a key={s.label} href={s.href} target={s.ext ? '_blank' : undefined} rel={s.ext ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:scale-[1.01]"
                    style={{ background: `${s.color}0d`, border: `1px solid ${s.color}25` }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span className="font-semibold text-[13px]" style={{ color: 'hsl(226,35%,20%)' }}>{s.label}</span>
                    <span className="ml-auto text-[11px]" style={{ color: 'hsl(226,25%,55%)' }}>→</span>
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* Quick Address */}
            <SectionCard icon={<MapPin size={15} />} title="লোকেশন" accentFrom={A} accentTo={B}>
              <p className="text-[13px] leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>
                🇧🇩 বাংলাদেশ ভিত্তিক ডিজিটাল স্টোর। আমরা সম্পূর্ণ অনলাইনে পরিষেবা প্রদান করি — সারা বাংলাদেশে।
              </p>
            </SectionCard>
          </div>
        </div>
      </div>

      <Footer />
      <FloatingButtons />
    </div>
  );
}
