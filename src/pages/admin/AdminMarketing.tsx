import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Plus, Edit, Trash2, Tag, Bell, Mail, Send, Users, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

const AdminMarketing = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ key: 'announcement_text', value: '', category: 'marketing' });
  const [saving, setSaving] = useState(false);

  // Promo Email State
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', ctaText: '', ctaUrl: 'https://shahedstore.com.bd/shop' });
  const [targetAudience, setTargetAudience] = useState<'all_users' | 'newsletter'>('all_users');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from('site_settings').select('*').eq('category', 'marketing').order('updated_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  useEffect(() => {
    const fetchCount = async () => {
      if (targetAudience === 'all_users') {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).not('email', 'is', null);
        setRecipientCount(count);
      } else {
        const { count } = await supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active');
        setRecipientCount(count);
      }
    };
    fetchCount();
  }, [targetAudience]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('site_settings').update({ value: form.value }).eq('id', editing.id);
      if (error) toast.error(handleDbError(error)); else { toast.success('আপডেট হয়েছে!'); setShowForm(false); fetchAnnouncements(); }
    } else {
      const { error } = await supabase.from('site_settings').insert({ key: form.key, value: form.value, category: 'marketing' });
      if (error) toast.error(handleDbError(error)); else { toast.success('যোগ করা হয়েছে!'); setShowForm(false); fetchAnnouncements(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এটি ডিলিট করবেন?')) return;
    await supabase.from('site_settings').delete().eq('id', id);
    toast.success('ডিলিট হয়েছে');
    fetchAnnouncements();
  };

  const handleSendPromoEmail = async () => {
    if (!emailForm.subject.trim() || !emailForm.body.trim()) {
      toast.error('বিষয় এবং বার্তা লিখুন');
      return;
    }
    if (!confirm(`${recipientCount || 0} জন প্রাপকের কাছে ইমেইল পাঠাবেন?`)) return;

    setSendingEmail(true);
    try {
      // Fetch recipient emails
      let emails: string[] = [];
      if (targetAudience === 'all_users') {
        const { data } = await supabase.from('profiles').select('email').not('email', 'is', null);
        emails = (data || []).map((p: any) => p.email).filter(Boolean);
      } else {
        const { data } = await supabase.from('newsletter_subscribers').select('email').eq('status', 'active');
        emails = (data || []).map((p: any) => p.email).filter(Boolean);
      }

      if (emails.length === 0) {
        toast.error('কোনো প্রাপক পাওয়া যায়নি');
        setSendingEmail(false);
        return;
      }

      const { error } = await supabase.functions.invoke('send-order-email', {
        body: {
          type: 'promotional',
          promoSubject: emailForm.subject,
          promoBody: emailForm.body,
          ctaText: emailForm.ctaText || undefined,
          ctaUrl: emailForm.ctaUrl || undefined,
          recipientEmails: emails,
        },
      });

      if (error) throw error;
      toast.success(`✅ ${emails.length} জনকে সফলভাবে ইমেইল পাঠানো হয়েছে!`);
      setEmailForm({ subject: '', body: '', ctaText: '', ctaUrl: 'https://shahedstore.com.bd/shop' });
    } catch (e: any) {
      toast.error('ইমেইল পাঠাতে সমস্যা হয়েছে: ' + (e?.message || String(e)));
    } finally {
      setSendingEmail(false);
    }
  };

  const quickActions = [
    { label: 'Flash Sale চালু করুন', icon: Tag, desc: 'হোমপেজে ফ্ল্যাশ সেল ব্যানার দেখান', key: 'flash_sale_active' },
    { label: 'Announcement Bar', icon: Bell, desc: 'টপ বারে বিজ্ঞাপন টেক্সট সেট করুন', key: 'announcement_text' },
    { label: 'Promo Banner', icon: Megaphone, desc: 'হিরো সেকশনে প্রমো ব্যানার', key: 'promo_banner' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Marketing & <span className="gradient-text">Promotions</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">স্টোরের মার্কেটিং কন্টেন্ট ও ইমেইল ক্যাম্পেইন পরিচালনা করুন</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ key: 'announcement_text', value: '', category: 'marketing' }); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> নতুন যোগ করুন
        </button>
      </div>

      {/* ── Promo Email Section ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowEmailSection(!showEmailSection)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
              <Mail size={18} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-bold text-foreground">📧 বাল্ক প্রমোশনাল ইমেইল</div>
              <div className="text-xs text-muted-foreground mt-0.5">এক ক্লিকে সব ব্যবহারকারীকে অফার ইমেইল পাঠান</div>
            </div>
          </div>
          {showEmailSection ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        {showEmailSection && (
          <div className="border-t border-border/50 p-5 space-y-4">
            {/* Audience selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">প্রাপক বেছে নিন</label>
              <div className="flex gap-2">
                {[
                  { key: 'all_users', label: 'সব ব্যবহারকারী', icon: Users },
                  { key: 'newsletter', label: 'নিউজলেটার সাবস্ক্রাইবার', icon: Bell },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setTargetAudience(opt.key as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      targetAudience === opt.key
                        ? 'btn-glow border-transparent'
                        : 'glass-card border-border text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                ))}
              </div>
              {recipientCount !== null && (
                <p className="text-xs text-primary mt-2 font-medium">
                  👥 মোট প্রাপক: <strong>{recipientCount}</strong> জন
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ইমেইলের বিষয় (Subject) *</label>
              <input
                value={emailForm.subject}
                onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="যেমন: 🎉 বিশেষ ঈদ অফার — ৫০% ছাড় পান!"
                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ইমেইলের বার্তা *</label>
              <textarea
                value={emailForm.body}
                onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                rows={5}
                placeholder="প্রিয় গ্রাহক,&#10;&#10;আমাদের বিশেষ অফারে স্বাগতম! এই সপ্তাহে সব প্রোডাক্টে ৫০% ছাড় পাচ্ছেন..."
                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* CTA (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">বাটনের লেখা (ঐচ্ছিক)</label>
                <input
                  value={emailForm.ctaText}
                  onChange={e => setEmailForm({ ...emailForm, ctaText: e.target.value })}
                  placeholder="যেমন: এখনই কিনুন"
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">বাটনের লিংক (ঐচ্ছিক)</label>
                <input
                  value={emailForm.ctaUrl}
                  onChange={e => setEmailForm({ ...emailForm, ctaUrl: e.target.value })}
                  placeholder="https://shahedstore.com.bd/shop"
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleSendPromoEmail}
              disabled={sendingEmail || !emailForm.subject || !emailForm.body}
              className="btn-glow px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingEmail ? <><Loader2 size={16} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={16} /> {recipientCount || 0} জনকে ইমেইল পাঠান</>}
            </button>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <div key={action.key} className="glass-card-hover rounded-2xl p-5 cursor-pointer"
            onClick={() => { setEditing(null); setForm({ key: action.key, value: '', category: 'marketing' }); setShowForm(true); }}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <action.icon size={18} className="text-primary" />
            </div>
            <div className="font-semibold text-foreground text-sm">{action.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{action.desc}</div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'এডিট করুন' : 'নতুন মার্কেটিং আইটেম'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Key (identifier)</label>
                  <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} required
                    placeholder="যেমন: announcement_text"
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Value / Content *</label>
                <textarea value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required rows={4}
                  placeholder="মার্কেটিং কন্টেন্ট লিখুন..."
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'সেভ হচ্ছে...' : editing ? 'আপডেট' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">সক্রিয় মার্কেটিং কন্টেন্ট</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-muted/20 rounded-xl" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
            কোনো মার্কেটিং কন্টেন্ট নেই। উপরে "নতুন যোগ করুন" বাটনে ক্লিক করুন।
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {announcements.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{item.key}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{item.value || '(খালি)'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(item); setForm({ key: item.key, value: item.value || '', category: 'marketing' }); setShowForm(true); }}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMarketing;
