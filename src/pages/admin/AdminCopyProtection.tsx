import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, Save, MousePointerClick, Copy, Move, Bot } from 'lucide-react';
import { toast } from 'sonner';

const AdminCopyProtection = () => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'copy_protection_enabled')
      .maybeSingle();
    setEnabled(data?.value !== 'false');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (next: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'copy_protection_enabled', value: next ? 'true' : 'false' }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('Failed to save: ' + error.message); return; }
    setEnabled(next);
    toast.success(next ? '🛡️ Copy Protection চালু হয়েছে' : '⚠️ Copy Protection বন্ধ হয়েছে');
  };

  const features = [
    { icon: MousePointerClick, label: 'Right-click block', desc: 'ভিজিটর রাইট-ক্লিক মেনু খুলতে পারবে না' },
    { icon: Copy, label: 'Text copy & selection block', desc: 'কনটেন্ট সিলেক্ট ও কপি করা যাবে না' },
    { icon: Move, label: 'Image drag block', desc: 'ছবি ড্র্যাগ-ড্রপ করে ডাউনলোড করা যাবে না' },
    { icon: Bot, label: 'Scraper bot block', desc: 'অটোমেটেড স্ক্র‍্যাপার ও ক্লোনিং টুল ব্লক হবে' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          🛡️ <span className="gradient-text">Copy Protection</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          সাইট-ওয়াইড কপি প্রোটেকশন সিস্টেম এক ক্লিকে চালু/বন্ধ করুন
        </p>
      </div>

      {/* Main toggle card */}
      <div className="glass-card rounded-2xl p-6 border border-amber-500/20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-amber-500" size={28} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${enabled ? 'bg-amber-500/20' : 'bg-muted/30'}`}>
                  <Shield size={28} className={enabled ? 'text-amber-500' : 'text-muted-foreground'} />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    Copy Protection {enabled ? 'চালু আছে' : 'বন্ধ আছে'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {enabled
                      ? '✅ সাইটের সব পেইজে প্রোটেকশন সক্রিয়'
                      : '⚠️ সব প্রোটেকশন বন্ধ — ভিজিটররা সবকিছু কপি করতে পারবে'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled === true}
                disabled={saving}
                onClick={() => save(!enabled)}
                className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
                  enabled ? 'bg-amber-500' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform ${
                    enabled ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map(f => (
                <div key={f.label} className={`rounded-xl p-4 border transition-colors ${enabled ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/10 border-border/40 opacity-60'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <f.icon size={16} className={enabled ? 'text-amber-500' : 'text-muted-foreground'} />
                    <span className="text-sm font-semibold text-foreground">{f.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info card */}
      <div className="glass-card rounded-2xl p-6 border border-primary/20">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Save size={16} className="text-primary" /> ℹ️ মনে রাখবেন
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>✅ টগল পরিবর্তন সাথে সাথে সেভ হয় — আলাদা সেভ বাটনে চাপতে হবে না</li>
          <li>✅ পরিবর্তন কার্যকর হতে ভিজিটরকে পেইজ রিফ্রেশ করতে হবে</li>
          <li>✅ Admin panel (<code className="text-primary">/ceo/*</code>) ও admin ইউজাররা সবসময় প্রোটেকশন বাইপাস করে</li>
          <li>✅ Googlebot, Bingbot, GPTBot ইত্যাদি SEO বট কখনও ব্লক হয় না — SEO র‍্যাংকিং নিরাপদ</li>
          <li>⚠️ মনে রাখুন: ক্লায়েন্ট-সাইড প্রোটেকশন ১০০% ফুলপ্রুফ নয়, অভিজ্ঞ ইউজার চাইলে বাইপাস করতে পারে</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminCopyProtection;
