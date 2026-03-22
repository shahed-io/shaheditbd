import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageIcon, Link2, ToggleLeft, ToggleRight, Upload, Trash2, Eye, Clock, RefreshCw } from 'lucide-react';

const AdminPopupBanner = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [enabled, setEnabled] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showFrequency, setShowFrequency] = useState('once_per_day'); // once_per_session | once_per_day | always
  const [previewOpen, setPreviewOpen] = useState(false);

  const settingKeys = ['popup_enabled', 'popup_image_url', 'popup_link_url', 'popup_show_frequency'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', settingKeys);

    if (data) {
      const map: Record<string, string> = {};
      data.forEach(r => { map[r.key] = r.value ?? ''; });
      setEnabled(map['popup_enabled'] === 'true');
      setImageUrl(map['popup_image_url'] ?? '');
      setLinkUrl(map['popup_link_url'] ?? '');
      setShowFrequency(map['popup_show_frequency'] ?? 'once_per_day');
    }
    setLoading(false);
  };

  const upsertSetting = async (key: string, value: string) => {
    await supabase.from('site_settings').upsert(
      { key, value, category: 'popup' },
      { onConflict: 'key' }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        upsertSetting('popup_enabled', String(enabled)),
        upsertSetting('popup_image_url', imageUrl),
        upsertSetting('popup_link_url', linkUrl),
        upsertSetting('popup_show_frequency', showFrequency),
      ]);
      toast.success('পপআপ ব্যানার সেটিংস সেভ হয়েছে!');
    } catch {
      toast.error('সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('শুধুমাত্র ছবি আপলোড করুন'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('ছবির সাইজ ৫MB এর বেশি হওয়া যাবে না'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `popup-banner-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setImageUrl(urlData.publicUrl);
      toast.success('ছবি আপলোড সফল!');
    } catch (err: any) {
      toast.error('আপলোড ব্যর্থ: ' + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Popup Banner Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ওয়েবসাইটে প্রথম ভিজিটে দেখানো পপআপ ব্যানার নিয়ন্ত্রণ করুন
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={!imageUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : null}
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="lg:col-span-2 space-y-5">

          {/* Enable / Disable */}
          <div className="glass-card rounded-2xl p-5 border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">পপআপ সক্রিয় করুন</p>
                <p className="text-xs text-muted-foreground mt-0.5">বন্ধ করলে কোনো ভিজিটরকে পপআপ দেখানো হবে না</p>
              </div>
              <button onClick={() => setEnabled(!enabled)} className="transition-all">
                {enabled
                  ? <ToggleRight size={40} className="text-primary" />
                  : <ToggleLeft size={40} className="text-muted-foreground" />
                }
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-primary" />
              <p className="font-semibold text-foreground">ব্যানার ছবি</p>
            </div>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                <img src={imageUrl} alt="Popup Banner" className="w-full max-h-72 object-contain" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/90 text-white hover:bg-destructive transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border/60 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'hsl(258,78%,55%,0.12)' }}>
                  <Upload size={22} className="text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">ছবি আপলোড করতে ক্লিক করুন</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (সর্বোচ্চ ৫MB)</p>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <RefreshCw size={14} className="animate-spin" />
                আপলোড হচ্ছে...
              </div>
            )}

            {/* Or paste URL */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">অথবা ছবির URL দিন</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Link URL */}
          <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 size={16} className="text-primary" />
              <p className="font-semibold text-foreground">ক্লিক লিংক (ঐচ্ছিক)</p>
            </div>
            <p className="text-xs text-muted-foreground">ব্যানারে ক্লিক করলে এই পেজে নিয়ে যাবে</p>
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://shahedstore.com.bd/product/microsoft-365"
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Show Frequency */}
          <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <p className="font-semibold text-foreground">কতবার দেখাবে</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'once_per_session', label: 'প্রতি সেশনে একবার', desc: 'ব্রাউজার বন্ধের পর আবার দেখাবে' },
                { value: 'once_per_day', label: 'প্রতিদিন একবার', desc: '২৪ ঘণ্টা পর আবার দেখাবে' },
                { value: 'always', label: 'সবসময়', desc: 'প্রতিটি ভিজিটে দেখাবে' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setShowFrequency(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    showFrequency === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-4">
            <p className="font-semibold text-foreground text-sm">📋 নির্দেশিকা</p>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>ব্যানার ছবি আপলোড করুন বা URL দিন। আদর্শ মাপ: <strong className="text-foreground">600×500px</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>ক্লিক লিংক দিলে ভিজিটর ব্যানারে ক্লিক করলে সেই পেজে যাবে</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>দেখানোর ফ্রিকোয়েন্সি সেট করুন</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>পপআপ সক্রিয় করে সেভ করুন</span>
              </li>
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-border/50">
            <p className="font-semibold text-foreground text-sm mb-3">⚡ বর্তমান স্ট্যাটাস</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">পপআপ</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                  enabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                }`}>
                  {enabled ? '✓ সক্রিয়' : '✗ নিষ্ক্রিয়'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ছবি</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                  imageUrl ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                }`}>
                  {imageUrl ? '✓ সেট আছে' : '✗ নেই'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">লিংক</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                  linkUrl ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                }`}>
                  {linkUrl ? '✓ সেট আছে' : '— নেই'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-all"
            >
              ✕
            </button>
            {linkUrl ? (
              <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                <img src={imageUrl} alt="Popup Preview" className="w-full block" />
              </a>
            ) : (
              <img src={imageUrl} alt="Popup Preview" className="w-full block" />
            )}
            <div className="absolute bottom-0 inset-x-0 py-2 text-center text-xs text-white/60 bg-black/40">
              প্রিভিউ — ভিজিটর এইভাবে দেখবে
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPopupBanner;
