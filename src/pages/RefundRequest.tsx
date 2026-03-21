import { useState, useRef } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Send, ChevronDown, ChevronUp, Info, ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { FloatingButtons } from '@/components/store/Extras';
import { GlassCard, SectionCard, Bullet } from '@/components/store/PolicyLayout';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

const REFUND_REASONS = [
  { value: 'not_working', label: 'লাইসেন্স কী কাজ করছে না' },
  { value: 'wrong_product', label: 'ভুল পণ্য ডেলিভারি হয়েছে' },
  { value: 'not_received', label: 'পণ্য পাইনি (৩+ ঘণ্টা হয়ে গেছে)' },
  { value: 'double_payment', label: 'ডাবল পেমেন্ট হয়ে গেছে' },
  { value: 'out_of_stock', label: 'স্টক শেষ / সরবরাহ সম্ভব নয়' },
  { value: 'change_of_mind', label: 'মন পরিবর্তন হয়েছে (Change of Mind)' },
  { value: 'other', label: 'অন্য কারণ' },
];

const SUBSCRIPTION_PERIODS = [
  { value: '1_month', label: '১ মাস' },
  { value: '3_months', label: '৩ মাস' },
  { value: '6_months', label: '৬ মাস' },
  { value: '1_year', label: '১ বছর' },
  { value: 'lifetime', label: 'লাইফটাইম' },
  { value: 'na', label: 'প্রযোজ্য নয়' },
];

export default function RefundRequest() {
  const [policyOpen, setPolicyOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNum, setTicketNum] = useState('');

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    order_number: '',
    product_name: '',
    reason: '',
    reason_detail: '',
    subscription_period: '',
    days_used: '',
    days_remaining: '',
    payment_amount: '',
    payment_method: '',
    additional_info: '',
  });

  const isChangeOfMind = form.reason === 'change_of_mind';
  const deductedAmount = isChangeOfMind && form.payment_amount
    ? (parseFloat(form.payment_amount) * 0.9).toFixed(2)
    : null;

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email || !form.order_number || !form.reason) {
      toast.error('অনুগ্রহ করে সকল বাধ্যতামূলক ফিল্ড পূরণ করুন');
      return;
    }
    setSubmitting(true);
    try {
      const tNum = 'RF-' + Date.now().toString().slice(-8);
      const message = `
📦 অর্ডার নম্বর: ${form.order_number}
🛍️ পণ্যের নাম: ${form.product_name || 'উল্লেখ নেই'}
❓ রিফান্ডের কারণ: ${REFUND_REASONS.find(r => r.value === form.reason)?.label || form.reason}
📝 বিস্তারিত: ${form.reason_detail || 'উল্লেখ নেই'}
📅 সাবস্ক্রিপশন মেয়াদ: ${SUBSCRIPTION_PERIODS.find(s => s.value === form.subscription_period)?.label || 'উল্লেখ নেই'}
📆 ব্যবহৃত দিন: ${form.days_used || 'উল্লেখ নেই'}
📆 বাকি দিন: ${form.days_remaining || 'উল্লেখ নেই'}
💳 পেমেন্টের পরিমাণ: ${form.payment_amount ? '৳' + form.payment_amount : 'উল্লেখ নেই'}
💳 পেমেন্ট মাধ্যম: ${form.payment_method || 'উল্লেখ নেই'}
${isChangeOfMind ? `⚠️ মন পরিবর্তনের কারণে ১০% কেটে ৳${deductedAmount} রিফান্ড হবে।` : ''}
📌 অতিরিক্ত তথ্য: ${form.additional_info || 'উল্লেখ নেই'}
      `.trim();

      await supabase.from('support_tickets').insert({
        ticket_number: tNum,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone || null,
        order_number: form.order_number,
        subject: `রিফান্ড রিকোয়েস্ট — ${form.order_number}`,
        message,
        priority: 'high',
        status: 'open',
      });

      setTicketNum(tNum);
      setSubmitted(true);
      toast.success('রিফান্ড রিকোয়েস্ট সফলভাবে জমা হয়েছে!');
    } catch {
      toast.error('কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white/70 border border-white/60 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/15 placeholder:text-slate-400`;
  const labelCls = `block text-[12.5px] font-semibold mb-1.5`;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(145deg, hsl(258,55%,97%) 0%, hsl(220,40%,96%) 40%, hsl(200,50%,96%) 100%)' }}>
      <SEOHead title="Refund Request — Shahed Store" description="রিফান্ড রিকোয়েস্ট করুন। Shahed Store এর রিফান্ড পলিসি দেখুন এবং আবেদন ফর্ম পূরণ করুন।" />
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px]" style={{ background: `radial-gradient(circle, ${A}18, transparent 65%)` }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px]" style={{ background: `radial-gradient(circle, ${B}12, transparent 65%)` }} />
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${A}0f 1px, transparent 1px)`, backgroundSize: '26px 26px' }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold mb-5"
            style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: `1px solid ${A}35`, color: A, boxShadow: `0 4px 16px ${A}20` }}>
            <RefreshCw size={13} /> Refund Request
          </div>
          <div className="inline-block px-8 py-5 rounded-3xl mb-5"
            style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.80), rgba(255,255,255,0.55))', backdropFilter: 'blur(32px)', border: '1.5px solid rgba(255,255,255,0.80)', boxShadow: `0 12px 50px ${A}18, 0 1px 0 rgba(255,255,255,0.9) inset` }}>
            <h1 className="font-sora font-black text-4xl sm:text-5xl leading-none"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Refund Request
            </h1>
          </div>
          <p className="text-[14px] max-w-lg mx-auto leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>
            রিফান্ড আবেদনের আগে আমাদের পলিসি মনোযোগ দিয়ে পড়ুন এবং নিচের ফর্মটি পূরণ করুন।
          </p>
        </div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pb-20 space-y-5">

        {/* ── Collapsible Policy Section ── */}
        <GlassCard>
          <button
            onClick={() => setPolicyOpen(p => !p)}
            className="w-full flex items-center justify-between px-6 py-5 transition-colors hover:bg-white/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${A}, ${B})` }}>
                <RefreshCw size={16} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-sora font-bold text-[15px]" style={{ color: 'hsl(226,35%,14%)' }}>Refund & Return Policy</p>
                <p className="text-[11px]" style={{ color: 'hsl(226,25%,52%)' }}>আবেদনের আগে পলিসিটি পড়ুন</p>
              </div>
            </div>
            {policyOpen ? <ChevronUp size={18} style={{ color: A }} /> : <ChevronDown size={18} style={{ color: A }} />}
          </button>

          {policyOpen && (
            <div className="px-6 pb-6 space-y-4 border-t border-white/40">

              {/* Quick cards */}
              <div className="grid sm:grid-cols-2 gap-3 pt-4">
                <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'hsla(142,72%,50%,0.07)', border: '1px solid hsla(142,72%,50%,0.22)' }}>
                  <CheckCircle size={20} style={{ color: 'hsl(142,72%,38%)', flexShrink: 0 }} />
                  <div>
                    <p className="font-bold text-[13px] mb-1" style={{ color: 'hsl(142,50%,22%)' }}>রিফান্ড পাবেন</p>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(142,30%,35%)' }}>পণ্য কাজ না করলে বা ভুল ডেলিভারি হলে ২৪ ঘণ্টার মধ্যে রিপোর্ট করুন।</p>
                  </div>
                </div>
                <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'hsla(0,72%,50%,0.07)', border: '1px solid hsla(0,72%,50%,0.22)' }}>
                  <XCircle size={20} style={{ color: 'hsl(0,72%,43%)', flexShrink: 0 }} />
                  <div>
                    <p className="font-bold text-[13px] mb-1" style={{ color: 'hsl(0,50%,28%)' }}>রিফান্ড পাবেন না</p>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(0,30%,38%)' }}>পণ্য ব্যবহারের পরে বা ২৪ ঘণ্টার পরে সাধারণত রিফান্ড প্রযোজ্য নয়।</p>
                  </div>
                </div>
              </div>

              <SectionCard icon={<CheckCircle size={15} />} title="রিফান্ড পাওয়ার যোগ্য পরিস্থিতি" accentFrom={A} accentTo={B}>
                <ul className="space-y-1.5">
                  <Bullet color="hsl(142,72%,38%)">ডেলিভার করা লাইসেন্স কী সম্পূর্ণ কাজ না করলে</Bullet>
                  <Bullet color="hsl(142,72%,38%)">অর্ডার করা পণ্যের বদলে ভিন্ন পণ্য ডেলিভার হলে</Bullet>
                  <Bullet color="hsl(142,72%,38%)">পেমেন্ট সফল হলেও ২৪ ঘণ্টার মধ্যে পণ্য না পেলে</Bullet>
                  <Bullet color="hsl(142,72%,38%)">একই অর্ডারে ডাবল পেমেন্ট হয়ে গেলে</Bullet>
                  <Bullet color="hsl(142,72%,38%)">স্টক শেষ হওয়ায় সরবরাহ সম্ভব না হলে</Bullet>
                </ul>
              </SectionCard>

              <SectionCard icon={<XCircle size={15} />} title="রিফান্ড প্রযোজ্য নয় যখন" accentFrom={A} accentTo={B}>
                <ul className="space-y-1.5">
                  <Bullet color="hsl(0,72%,43%)">লাইসেন্স কী সফলভাবে ব্যবহার করা হয়ে গেলে</Bullet>
                  <Bullet color="hsl(0,72%,43%)">ডেলিভারির ২৪ ঘণ্টার পরে অভিযোগ করলে</Bullet>
                  <Bullet color="hsl(0,72%,43%)">ক্রেতার ভুলে পণ্য ব্যবহার করতে না পারলে</Bullet>
                  <Bullet color="hsl(0,72%,43%)">ইন্টারনেট বা ডিভাইস সমস্যার কারণে কাজ না করলে</Bullet>
                </ul>
              </SectionCard>

              <SectionCard icon={<AlertTriangle size={15} />} title="বিশেষ গুরুত্বপূর্ণ নিয়ম" accentFrom={A} accentTo={B}>
                <ul className="space-y-1.5">
                  <Bullet>সাবস্ক্রিপশন: অব্যবহৃত মাসের সমানুপাতিক রিফান্ড বিবেচনা করা হয়</Bullet>
                  <Bullet>বান্ডেল অফার: শুধু সমস্যাযুক্ত পণ্যের রিফান্ড প্রযোজ্য</Bullet>
                  <Bullet>ডিসকাউন্ট মূল্যে কেনা পণ্যে ডিসকাউন্ট মূল্যই ফেরত দেওয়া হবে</Bullet>
                  <Bullet color="hsl(38,92%,38%)">
                    ⚠️ কাস্টমারের ইচ্ছাশক্তির পরিবর্তন (Change of Mind) সহ যেকোনো রিফান্ডের ক্ষেত্রে গেটওয়ে, সার্ভিস ও ব্যাংক চার্জ বাবদ <strong>১০% কেটে</strong> বাকি টাকা ফেরত দেওয়া হবে।
                  </Bullet>
                  <Bullet color="hsl(38,92%,38%)">
                    ⚠️ রিফান্ডের ক্ষেত্রে ব্যাংক কর্তৃক আরোপিত যেকোনো ফি বা চার্জ ক্রেতাকে বহন করতে হবে।
                  </Bullet>
                  <Bullet color="hsl(38,92%,38%)">
                    ⚠️ প্রোডাক্ট ব্যবহারকালীন সমস্যার সমাধানে সর্বোচ্চ <strong>৩ কর্মদিবস</strong> সময় প্রযোজ্য। গ্রাহক ক্রয়ের মাধ্যমে এই শর্তে সম্মতি প্রদান করছেন।
                  </Bullet>
                </ul>
              </SectionCard>

              <SectionCard icon={<Clock size={15} />} title="রিফান্ড প্রক্রিয়া ও সময়সীমা" accentFrom={A} accentTo={B}>
                <div className="space-y-3">
                  {[
                    { n: '১', t: 'আবেদন জমা (২৪ ঘণ্টার মধ্যে)', d: 'অর্ডার নম্বর, সমস্যার বিবরণ ও স্ক্রিনশট সহ ফর্ম পূরণ করুন।' },
                    { n: '২', t: 'যাচাই (১–৬ ঘণ্টা)', d: 'আমাদের টিম সমস্যাটি যাচাই করে সমাধান বা রিফান্ড অনুমোদন করবে।' },
                    { n: '৩', t: 'রিফান্ড প্রদান', d: 'bKash Online Payment: ১–২৪ ঘণ্টার মধ্যে। Gateway রিফান্ড: তাদের শর্ত অনুযায়ী সাধারণত ৩–৭ কার্যদিবস।' },
                  ].map(s => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
                        style={{ background: `linear-gradient(135deg, ${A}, ${B})` }}>{s.n}</div>
                      <div>
                        <p className="font-semibold text-[13px]" style={{ color: 'hsl(226,35%,18%)' }}>{s.t}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'hsl(226,25%,48%)' }}>{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </GlassCard>

        {/* ── Refund Request Form ── */}
        {submitted ? (
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'hsla(142,72%,50%,0.12)', border: '2px solid hsla(142,72%,50%,0.30)' }}>
              <CheckCircle size={32} style={{ color: 'hsl(142,72%,38%)' }} />
            </div>
            <h2 className="font-sora font-black text-xl mb-2" style={{ color: 'hsl(226,35%,14%)' }}>রিফান্ড রিকোয়েস্ট জমা হয়েছে!</h2>
            <p className="text-sm mb-4" style={{ color: 'hsl(226,25%,42%)' }}>আমাদের টিম ১–৬ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করবে।</p>
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${A}15, ${B}10)`, border: `1px solid ${A}30`, color: A }}>
              🎫 টিকেট নম্বর: <span className="font-black font-fira">{ticketNum}</span>
            </div>
            <p className="text-[12px] mt-4" style={{ color: 'hsl(226,25%,52%)' }}>
              এই নম্বরটি সংরক্ষণ করুন। WhatsApp বা Email-এ যোগাযোগ করার সময় এটি উল্লেখ করুন।
            </p>
            <button onClick={() => { setSubmitted(false); setForm({ customer_name:'',customer_email:'',customer_phone:'',order_number:'',product_name:'',reason:'',reason_detail:'',subscription_period:'',days_used:'',days_remaining:'',payment_amount:'',payment_method:'',additional_info:'' }); }}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${A}, ${B})`, color: '#fff', boxShadow: `0 4px 16px ${A}30` }}>
              নতুন রিকোয়েস্ট করুন
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/40">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${A}, ${B})` }}>
                <Send size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-sora font-bold text-[16px]" style={{ color: 'hsl(226,35%,14%)' }}>রিফান্ড আবেদন ফর্ম</h2>
                <p className="text-[11px]" style={{ color: 'hsl(226,25%,52%)' }}>সকল * চিহ্নিত ফিল্ড বাধ্যতামূলক</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Personal Info */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: A }}>ব্যক্তিগত তথ্য</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>পূর্ণ নাম *</label>
                    <input required value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                      placeholder="আপনার নাম" className={inputCls} maxLength={100} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>ইমেইল *</label>
                    <input required type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)}
                      placeholder="example@email.com" className={inputCls} maxLength={200} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>ফোন নম্বর</label>
                    <input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)}
                      placeholder="01XXXXXXXXX" className={inputCls} maxLength={20} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>অর্ডার নম্বর *</label>
                    <input required value={form.order_number} onChange={e => set('order_number', e.target.value)}
                      placeholder="ORD-XXXXXXXX" className={inputCls} maxLength={50} />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: A }}>পণ্যের তথ্য</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>পণ্যের নাম</label>
                    <input value={form.product_name} onChange={e => set('product_name', e.target.value)}
                      placeholder="যেমন: Microsoft Office 365" className={inputCls} maxLength={200} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>সাবস্ক্রিপশন মেয়াদ</label>
                    <select value={form.subscription_period} onChange={e => set('subscription_period', e.target.value)} className={inputCls}>
                      <option value="">-- নির্বাচন করুন --</option>
                      {SUBSCRIPTION_PERIODS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>পেমেন্টের পরিমাণ (৳)</label>
                    <input type="number" min="0" value={form.payment_amount} onChange={e => set('payment_amount', e.target.value)}
                      placeholder="যেমন: 499" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>কতদিন ব্যবহার হয়েছে</label>
                    <input value={form.days_used} onChange={e => set('days_used', e.target.value)}
                      placeholder="যেমন: ৫ দিন" className={inputCls} maxLength={50} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>কতদিন বাকি আছে</label>
                    <input value={form.days_remaining} onChange={e => set('days_remaining', e.target.value)}
                      placeholder="যেমন: ২৫ দিন" className={inputCls} maxLength={50} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>পেমেন্ট মাধ্যম</label>
                    <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className={inputCls}>
                      <option value="">-- নির্বাচন করুন --</option>
                      {['bKash', 'Nagad', 'Rocket', 'Upay', 'Bank Transfer', 'অন্যান্য'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Refund Reason */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: A }}>রিফান্ডের কারণ</p>
                <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
                  {REFUND_REASONS.map(r => (
                    <button type="button" key={r.value}
                      onClick={() => set('reason', r.value)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-[13px] font-medium transition-all"
                      style={{
                        background: form.reason === r.value ? `linear-gradient(135deg, ${A}15, ${B}10)` : 'rgba(255,255,255,0.55)',
                        border: `1.5px solid ${form.reason === r.value ? A : 'rgba(255,255,255,0.60)'}`,
                        color: form.reason === r.value ? A : 'hsl(226,35%,38%)',
                        boxShadow: form.reason === r.value ? `0 2px 12px ${A}20` : 'none',
                      }}>
                      <span className="w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                        style={{ borderColor: form.reason === r.value ? A : 'hsl(226,20%,70%)' }}>
                        {form.reason === r.value && <span className="w-2 h-2 rounded-full" style={{ background: A }} />}
                      </span>
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Change of Mind warning */}
                {isChangeOfMind && (
                  <div className="rounded-2xl p-4 flex items-start gap-3 mb-4"
                    style={{ background: 'hsla(38,92%,50%,0.08)', border: '1.5px solid hsla(38,92%,50%,0.30)' }}>
                    <AlertTriangle size={18} style={{ color: 'hsl(38,92%,40%)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p className="font-bold text-[13px] mb-1" style={{ color: 'hsl(38,60%,25%)' }}>⚠️ মন পরিবর্তন — ১০% চার্জ প্রযোজ্য</p>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(38,40%,35%)' }}>
                        কাস্টমারের ইচ্ছাশক্তির পরিবর্তনের ক্ষেত্রে গেটওয়ে, সার্ভিস ও ব্যাংক চার্জ বাবদ মোট পেমেন্ট থেকে <strong>১০% কেটে</strong> বাকি টাকা রিফান্ড করা হবে।
                      </p>
                      {form.payment_amount && (
                        <div className="mt-2.5 flex flex-wrap gap-3">
                          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold"
                            style={{ background: 'hsla(0,72%,50%,0.10)', color: 'hsl(0,65%,38%)' }}>
                            কাটা হবে: ৳{(parseFloat(form.payment_amount) * 0.1).toFixed(2)}
                          </span>
                          <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold"
                            style={{ background: 'hsla(142,72%,50%,0.10)', color: 'hsl(142,65%,30%)' }}>
                            ফেরত পাবেন: ৳{deductedAmount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelCls} style={{ color: 'hsl(226,35%,28%)' }}>বিস্তারিত কারণ *</label>
                  <textarea required value={form.reason_detail} onChange={e => set('reason_detail', e.target.value)}
                    rows={4} placeholder="সমস্যাটি বিস্তারিত লিখুন। যেমন: কী সমস্যা হচ্ছে, কখন থেকে হচ্ছে, কী করার পরে হচ্ছে ইত্যাদি।"
                    className={inputCls} maxLength={2000} />
                  <p className="text-[11px] mt-1" style={{ color: 'hsl(226,25%,58%)' }}>{form.reason_detail.length}/2000</p>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: A }}>অতিরিক্ত তথ্য</p>
                <textarea value={form.additional_info} onChange={e => set('additional_info', e.target.value)}
                  rows={3} placeholder="স্ক্রিনশট, ট্রানজেকশন আইডি বা অন্য যেকোনো প্রাসঙ্গিক তথ্য এখানে লিখুন।"
                  className={inputCls} maxLength={1000} />
              </div>

              {/* Notice */}
              <div className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: `linear-gradient(135deg, ${A}08, ${B}06)`, border: `1px solid ${A}20` }}>
                <Info size={16} style={{ color: A, flexShrink: 0, marginTop: 1 }} />
                <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>
                  আবেদন জমার পর আমাদের টিম <strong>১–৬ ঘণ্টার মধ্যে</strong> আপনার ইমেইল বা WhatsApp-এ যোগাযোগ করবে। জরুরি প্রয়োজনে সরাসরি <strong>01840-099853</strong> নম্বরে যোগাযোগ করুন।
                </p>
              </div>

              <button type="submit" disabled={submitting || !form.reason}
                className="w-full py-4 rounded-2xl font-bold text-white text-[15px] transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${A}, ${B})`, boxShadow: `0 6px 24px ${A}35` }}>
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> জমা হচ্ছে...</>
                ) : (
                  <><Send size={16} /> রিফান্ড রিকোয়েস্ট জমা করুন</>
                )}
              </button>
            </form>
          </GlassCard>
        )}
      </div>

      <Footer />
      <FloatingButtons />
    </div>
  );
}
