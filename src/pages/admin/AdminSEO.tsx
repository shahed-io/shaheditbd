import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Globe, Save, Check, ExternalLink, Search, BarChart2,
  FileText, ArrowRight, Trash2, Plus, Copy, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Zap, PackageSearch,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { SITE_URL, SITE_NAME } from '@/components/seo/SEOHead';

/* ───────────── types ───────────── */
interface Redirect { id?: string; from_path: string; to_path: string; type: '301' | '302'; }

/* ───────────── component ───────────── */
const AdminSEO = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('quick-setup');

  // Settings state
  const [settings, setSettings] = useState<Record<string, string>>({});
  // Product SEO
  const [products, setProducts] = useState<any[]>([]);
  const [productEdits, setProductEdits] = useState<Record<string, any>>({});
  const [productSearch, setProductSearch] = useState('');
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  // Redirects
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [newRedirect, setNewRedirect] = useState<Redirect>({ from_path: '', to_path: '', type: '301' });
  // Stats
  const [stats, setStats] = useState({ products: 0, posts: 0, categories: 0, withSeo: 0 });

  const ALL_KEYS = [
    'google_analytics', 'google_site_verification', 'meta_title_template',
    'meta_title_separator', 'og_image', 'canonical_base_url',
    'meta_description_default', 'twitter_site'
  ];

  useEffect(() => {
    Promise.all([
      supabase.from('site_settings').select('key,value').in('key', ALL_KEYS),
      supabase.from('products').select('id,name,slug,seo_title,seo_description,status,image_url').eq('status', 'active').order('name'),
      supabase.from('blog_posts').select('id').eq('status', 'published'),
      supabase.from('categories').select('id').eq('is_active', true),
      supabase.from('site_settings').select('value').eq('key', 'redirects').maybeSingle(),
    ]).then(([{ data: s }, { data: p }, { data: b }, { data: c }, { data: r }]) => {
      const map: Record<string, string> = {};
      s?.forEach(row => { map[row.key] = row.value || ''; });
      setSettings(map);
      setProducts(p || []);
      const withSeo = (p || []).filter(pr => pr.seo_title || pr.seo_description).length;
      setStats({ products: p?.length || 0, posts: b?.length || 0, categories: c?.length || 0, withSeo });
      try { if (r?.value) setRedirects(JSON.parse(r.value)); } catch {}
      setLoading(false);
    });
  }, []);

  /* ─── Save all settings ─── */
  const saveSettings = async () => {
    setSaving(true);
    await Promise.all(ALL_KEYS.map(key =>
      supabase.from('site_settings').upsert({ key, value: settings[key] || '', category: 'seo' }, { onConflict: 'key' })
    ));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('সেটিংস সেভ হয়েছে!');
  };

  /* ─── Product SEO save ─── */
  const saveProductSeo = async (p: any) => {
    setSavingProduct(p.id);
    const edit = productEdits[p.id] || {};
    await supabase.from('products').update({
      seo_title: edit.seo_title ?? p.seo_title ?? '',
      seo_description: edit.seo_description ?? p.seo_description ?? '',
    }).eq('id', p.id);
    setSavingProduct(null);
    toast.success(`"${p.name}" SEO আপডেট হয়েছে!`);
  };

  /* ─── Auto generate SEO for all products ─── */
  const autoGenerateAll = async () => {
    setSaving(true);
    const updates = products.filter(p => !p.seo_title && !p.seo_description).map(p =>
      supabase.from('products').update({
        seo_title: `${p.name} – Buy at Best Price | ${SITE_NAME}`,
        seo_description: `${p.name} কিনুন সবচেয়ে কম দামে ${SITE_NAME} থেকে। ১০০% অরিজিনাল। তাৎক্ষণিক ডেলিভারি। বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার শপ।`,
      }).eq('id', p.id)
    );
    await Promise.all(updates);
    // Refresh
    const { data: refreshed } = await supabase.from('products').select('id,name,slug,seo_title,seo_description,status,image_url').eq('status', 'active').order('name');
    setProducts(refreshed || []);
    const withSeo = (refreshed || []).filter(pr => pr.seo_title || pr.seo_description).length;
    setStats(s => ({ ...s, withSeo }));
    setSaving(false);
    toast.success(`${updates.length}টি প্রোডাক্টে SEO অটো-জেনারেট হয়েছে!`);
  };

  /* ─── Redirects ─── */
  const saveRedirects = async (list: Redirect[]) => {
    await supabase.from('site_settings').upsert({ key: 'redirects', value: JSON.stringify(list), category: 'seo' }, { onConflict: 'key' });
  };
  const addRedirect = async () => {
    if (!newRedirect.from_path || !newRedirect.to_path) return toast.error('উভয় পাথ প্রয়োজন');
    const updated = [...redirects, { ...newRedirect, id: crypto.randomUUID() }];
    setRedirects(updated);
    await saveRedirects(updated);
    setNewRedirect({ from_path: '', to_path: '', type: '301' });
    toast.success('রিডাইরেক্ট যোগ হয়েছে!');
  };
  const removeRedirect = async (id: string) => {
    const updated = redirects.filter(r => r.id !== id);
    setRedirects(updated);
    await saveRedirects(updated);
    toast.success('রিডাইরেক্ট মুছে ফেলা হয়েছে');
  };

  /* ─── Checklist items ─── */
  const checklist = [
    { label: 'Google Analytics কানেক্ট করা হয়েছে', done: !!settings.google_analytics, section: 'google' },
    { label: 'Google Search Console ভেরিফাই করা হয়েছে', done: !!settings.google_site_verification, section: 'google' },
    { label: 'Sitemap.xml সাবমিট করা হয়েছে', done: true, section: 'sitemap' },
    { label: 'Robots.txt কনফিগার করা হয়েছে', done: true, section: 'sitemap' },
    { label: 'OG Image সেট করা হয়েছে', done: !!settings.og_image, section: 'meta' },
    { label: `প্রোডাক্ট SEO (${stats.withSeo}/${stats.products})`, done: stats.withSeo >= stats.products && stats.products > 0, section: 'products' },
    { label: 'Schema Markup (Organization, Product, FAQ)', done: true, section: 'schema' },
  ];
  const completedCount = checklist.filter(c => c.done).length;
  const scorePercent = Math.round((completedCount / checklist.length) * 100);

  /* ─── Accordion toggle ─── */
  const toggle = (s: string) => setActiveSection(prev => prev === s ? null : s);

  const SectionHeader = ({ id, icon: Icon, title, subtitle, badge }: { id: string; icon: any; title: string; subtitle: string; badge?: string }) => (
    <button onClick={() => toggle(id)} className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all group">
      <div className="w-10 h-10 rounded-xl btn-glow flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{badge}</span>}
      {activeSection === id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
    </button>
  );

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}
    </div>
  );

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            SEO <span className="gradient-text">সেটআপ উইজার্ড</span>
          </h1>
          <p className="text-muted-foreground text-sm">গুগলে র‍্যাংক করার জন্য ধাপে ধাপে সব সেটআপ করুন</p>
        </div>
        <button onClick={saveSettings} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60">
          {saved ? <Check size={14} /> : saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          {saved ? 'সেভ হয়েছে!' : 'সব সেভ করুন'}
        </button>
      </div>

      {/* ═══ SEO SCORE ═══ */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Zap size={16} className="text-primary" /> SEO স্কোর
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{completedCount}/{checklist.length}টি কাজ সম্পন্ন</p>
          </div>
          <div className="text-3xl font-black text-primary">{scorePercent}%</div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted/30 rounded-full h-3 mb-4">
          <div className="h-3 rounded-full btn-glow transition-all duration-700" style={{ width: `${scorePercent}%` }} />
        </div>
        {/* Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {checklist.map(c => (
            <button key={c.label} onClick={() => toggle(c.section)} className="flex items-center gap-2.5 py-1.5 text-left hover:opacity-80 transition-opacity">
              {c.done ? <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" /> : <AlertCircle size={15} className="text-yellow-400 flex-shrink-0" />}
              <span className={`text-xs ${c.done ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ QUICK SETUP (Google) ═══ */}
      <SectionHeader id="google" icon={BarChart2} title="🔗 Google কানেক্ট করুন" subtitle="Analytics ও Search Console সেটআপ" badge={settings.google_analytics ? '✓ সক্রিয়' : 'সেটআপ করুন'} />
      {activeSection === 'google' && (
        <div className="glass-card rounded-2xl p-6 space-y-5 border-t-2 border-primary/30">
          {/* Guide Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
            {[
              { step: '১', title: 'GA4 তৈরি করুন', desc: 'analytics.google.com এ গিয়ে নতুন Property তৈরি করুন', url: 'https://analytics.google.com' },
              { step: '২', title: 'Measurement ID কপি করুন', desc: 'Admin → Data Streams → আপনার স্ট্রিম → G-XXXXXXXX', url: 'https://analytics.google.com' },
              { step: '৩', title: 'নিচে পেস্ট করুন', desc: 'ID পেস্ট করে "সব সেভ করুন" চাপুন — ব্যাস!', url: '' },
            ].map(s => (
              <div key={s.step} className="bg-muted/10 rounded-xl p-4 border border-border/50">
                <div className="w-7 h-7 rounded-lg btn-glow flex items-center justify-center text-white font-bold text-xs mb-2">{s.step}</div>
                <h4 className="font-semibold text-sm text-foreground mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                {s.url && <a href={s.url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1.5"><ExternalLink size={10} /> খুলুন</a>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Google Analytics ID <span className="opacity-60">(G-XXXXXXXXXX)</span>
              </label>
              <input value={settings.google_analytics || ''} onChange={e => setSettings(p => ({ ...p, google_analytics: e.target.value.toUpperCase() }))}
                placeholder="G-XXXXXXXXXX" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
              {settings.google_analytics && <p className="text-xs text-green-400 mt-1">✓ অটোমেটিক সকল পেজে যোগ হবে</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Search Console Verification Code
              </label>
              <input value={settings.google_site_verification || ''} onChange={e => setSettings(p => ({ ...p, google_site_verification: e.target.value }))}
                placeholder="content= এর ভ্যালু পেস্ট করুন" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
              {settings.google_site_verification && <p className="text-xs text-green-400 mt-1">✓ ভেরিফিকেশন ট্যাগ অটো-ইনজেক্ট হবে</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener"
              className="glass-card px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 hover:text-primary transition-colors">
              <ExternalLink size={12} /> Search Console খুলুন
            </a>
            <a href="https://analytics.google.com" target="_blank" rel="noopener"
              className="glass-card px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 hover:text-primary transition-colors">
              <ExternalLink size={12} /> Analytics খুলুন
            </a>
          </div>
        </div>
      )}

      {/* ═══ META & OG SETTINGS ═══ */}
      <SectionHeader id="meta" icon={FileText} title="📝 মেটা ট্যাগ ও OG ইমেজ" subtitle="সোশ্যাল শেয়ার ও সার্চ রেজাল্টে কি দেখাবে" badge={settings.og_image ? '✓ সেট' : 'সেটআপ করুন'} />
      {activeSection === 'meta' && (
        <div className="glass-card rounded-2xl p-6 space-y-4 border-t-2 border-primary/30">
          <div className="bg-muted/10 rounded-xl p-4 border border-border/50 text-xs text-muted-foreground leading-relaxed">
            💡 <strong>কি করবেন:</strong> OG Image হলো ফেসবুক, হোয়াটসঅ্যাপে লিংক শেয়ার করলে যে ছবি দেখায়। 1200×630px সাইজের একটি ছবি আপলোড করুন।
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ডিফল্ট OG Image URL</label>
              <input value={settings.og_image || ''} onChange={e => setSettings(p => ({ ...p, og_image: e.target.value }))}
                placeholder="https://shahedstore.com.bd/og-image.png"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Twitter / X হ্যান্ডেল</label>
              <input value={settings.twitter_site || ''} onChange={e => setSettings(p => ({ ...p, twitter_site: e.target.value }))}
                placeholder="@shahedstore"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ডিফল্ট মেটা ডেসক্রিপশন <span className="opacity-60">(160 অক্ষর)</span></label>
              <textarea value={settings.meta_description_default || ''} onChange={e => setSettings(p => ({ ...p, meta_description_default: e.target.value }))}
                placeholder="Shahed Store – Bangladesh's most trusted digital software shop..."
                rows={2}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {/* Google Preview */}
          <div className="bg-white rounded-xl p-4 border border-border">
            <p className="text-[10px] text-gray-400 uppercase font-medium mb-2">গুগল সার্চ প্রিভিউ</p>
            <p className="text-xs text-green-700 font-mono">shahedstore.com.bd</p>
            <p className="text-base text-blue-700 font-medium hover:underline cursor-pointer">
              {SITE_NAME} – Buy Digital Software at Best Price in Bangladesh
            </p>
            <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
              {settings.meta_description_default || 'Shahed Store – Bangladesh\'s most trusted digital software shop. Buy Windows 11, Microsoft Office 365, Adobe Creative Cloud at lowest price.'}
            </p>
          </div>
        </div>
      )}

      {/* ═══ PRODUCT SEO ═══ */}
      <SectionHeader id="products" icon={PackageSearch} title="🛍️ প্রোডাক্ট SEO" subtitle="প্রতিটি প্রোডাক্টের টাইটেল ও ডেসক্রিপশন" badge={`${stats.withSeo}/${stats.products}`} />
      {activeSection === 'products' && (
        <div className="space-y-3 border-t-2 border-primary/30 pt-1">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="প্রোডাক্ট খুঁজুন..."
                className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            {stats.withSeo < stats.products && (
              <button onClick={autoGenerateAll} disabled={saving} className="btn-glow px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap disabled:opacity-60">
                <Zap size={13} /> {saving ? 'জেনারেট হচ্ছে...' : `${stats.products - stats.withSeo}টি অটো-জেনারেট`}
              </button>
            )}
          </div>

          {filteredProducts.slice(0, 20).map(p => {
            const edit = productEdits[p.id] || {};
            const title = edit.seo_title ?? p.seo_title ?? '';
            const desc = edit.seo_description ?? p.seo_description ?? '';
            const hasSeo = title || desc;

            return (
              <div key={p.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{p.name}</span>
                    {!hasSeo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">SEO নেই</span>}
                  </div>
                  <button onClick={() => saveProductSeo(p)} disabled={savingProduct === p.id}
                    className="btn-glow px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-60">
                    {savingProduct === p.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={12} />}
                    সেভ
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-muted-foreground">SEO টাইটেল</label>
                      <span className={`text-[10px] font-mono ${title.length > 60 ? 'text-red-400' : title.length > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>{title.length}/60</span>
                    </div>
                    <input value={title} onChange={e => setProductEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], seo_title: e.target.value } }))}
                      placeholder={`${p.name} – Buy at Best Price | Shahed Store`}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-muted-foreground">মেটা ডেসক্রিপশন</label>
                      <span className={`text-[10px] font-mono ${desc.length > 160 ? 'text-red-400' : desc.length > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>{desc.length}/160</span>
                    </div>
                    <input value={desc} onChange={e => setProductEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], seo_description: e.target.value } }))}
                      placeholder="সংক্ষিপ্ত বিবরণ লিখুন..."
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length > 20 && <p className="text-xs text-center text-muted-foreground">আরও {filteredProducts.length - 20}টি প্রোডাক্ট — সার্চ করে খুঁজুন</p>}
        </div>
      )}

      {/* ═══ SITEMAP & ROBOTS ═══ */}
      <SectionHeader id="sitemap" icon={Globe} title="🗺️ Sitemap ও Robots.txt" subtitle="সার্চ ইঞ্জিন আপনার সাইট কিভাবে ক্রল করবে" badge="✓ অটো" />
      {activeSection === 'sitemap' && (
        <div className="glass-card rounded-2xl p-6 space-y-4 border-t-2 border-primary/30">
          <div className="bg-muted/10 rounded-xl p-4 border border-border/50 text-xs text-muted-foreground leading-relaxed">
            ✅ <strong>ভালো খবর!</strong> আপনার Sitemap.xml ও Robots.txt সব অটোমেটিক তৈরি ও আপডেট হয়। আপনাকে কিছু করতে হবে না!
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'স্ট্যাটিক পেজ', count: 14, color: 'text-blue-400' },
              { label: 'প্রোডাক্ট', count: stats.products, color: 'text-primary' },
              { label: 'ব্লগ পোস্ট', count: stats.posts, color: 'text-green-400' },
              { label: 'ক্যাটাগরি', count: stats.categories, color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="bg-muted/10 rounded-xl p-3 text-center border border-border/50">
                <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted/20 rounded-xl px-4 py-2.5 border border-border">
              <code className="text-sm font-mono text-primary">{SITE_URL}/sitemap.xml</code>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`${SITE_URL}/sitemap.xml`); toast.success('কপি হয়েছে!'); }}
              className="glass-card px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:text-primary"><Copy size={12} /> কপি</button>
          </div>

          <div className="flex gap-3 text-xs">
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1">
              <ExternalLink size={10} /> Google Search Console এ সাবমিট করুন
            </a>
            <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1">
              <ExternalLink size={10} /> Bing Webmaster
            </a>
          </div>
        </div>
      )}

      {/* ═══ SCHEMA STATUS ═══ */}
      <SectionHeader id="schema" icon={FileText} title="📋 Schema Markup" subtitle="গুগলে রিচ রেজাল্ট (স্টার, প্রাইস, FAQ)" badge="✓ অটো" />
      {activeSection === 'schema' && (
        <div className="glass-card rounded-2xl p-6 border-t-2 border-primary/30">
          <div className="bg-muted/10 rounded-xl p-4 border border-border/50 text-xs text-muted-foreground leading-relaxed mb-4">
            ✅ <strong>সব Schema অটোমেটিক!</strong> প্রতিটি পেজে সঠিক JSON-LD Schema অটো-জেনারেট হয়। গুগল Rich Result (স্টার রেটিং, দাম, FAQ) দেখাবে।
          </div>
          <div className="space-y-2">
            {[
              { label: 'Organization Schema', page: 'হোমপেজ', desc: 'আপনার ব্র্যান্ডের তথ্য' },
              { label: 'WebSite + SearchAction', page: 'হোমপেজ', desc: 'গুগলে সার্চবক্স দেখাবে' },
              { label: 'Product Schema (Price, Offer)', page: 'প্রোডাক্ট পেজ', desc: 'দাম ও স্টক দেখাবে' },
              { label: 'Breadcrumb Schema', page: 'প্রোডাক্ট ও ব্লগ', desc: 'পেজের পাথ দেখাবে' },
              { label: 'Article Schema', page: 'ব্লগ পোস্ট', desc: 'আর্টিকেল ইনফো দেখাবে' },
              { label: 'FAQPage Schema', page: 'FAQ সহ পেজ', desc: 'FAQ রেজাল্ট দেখাবে' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-foreground">{s.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {s.desc}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted/20 px-2 py-0.5 rounded">{s.page}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ REDIRECTS ═══ */}
      <SectionHeader id="redirects" icon={ArrowRight} title="🔀 রিডাইরেক্ট" subtitle="পুরানো URL কে নতুন URL এ পাঠান" badge={`${redirects.length}টি`} />
      {activeSection === 'redirects' && (
        <div className="space-y-3 border-t-2 border-primary/30 pt-1">
          <div className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">টাইপ</label>
                <select value={newRedirect.type} onChange={e => setNewRedirect({ ...newRedirect, type: e.target.value as '301' | '302' })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="301">301 (স্থায়ী)</option>
                  <option value="302">302 (অস্থায়ী)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">পুরানো পাথ</label>
                <input value={newRedirect.from_path} onChange={e => setNewRedirect({ ...newRedirect, from_path: e.target.value })}
                  placeholder="/old-page" className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">নতুন পাথ</label>
                <input value={newRedirect.to_path} onChange={e => setNewRedirect({ ...newRedirect, to_path: e.target.value })}
                  placeholder="/new-page" className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="flex items-end">
                <button onClick={addRedirect} className="btn-glow w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  <Plus size={15} /> যোগ করুন
                </button>
              </div>
            </div>
          </div>

          {redirects.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {redirects.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.type === '301' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{r.type}</span>
                    <code className="text-xs text-muted-foreground flex-1">{r.from_path}</code>
                    <ArrowRight size={12} className="text-muted-foreground/40" />
                    <code className="text-xs text-primary flex-1">{r.to_path}</code>
                    <button onClick={() => removeRedirect(r.id!)} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ QUICK TIPS ═══ */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground text-sm mb-3">🚀 গুগলে র‍্যাংক করার টিপস</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
          {[
            '✅ প্রতিটি প্রোডাক্টে ইউনিক SEO টাইটেল ও ডেসক্রিপশন দিন',
            '✅ Google Search Console এ Sitemap সাবমিট করুন',
            '✅ নিয়মিত ব্লগ পোস্ট লিখুন (Google ফ্রেশ কন্টেন্ট পছন্দ করে)',
            '✅ প্রোডাক্ট ইমেজে Alt Text ব্যবহার করুন',
            '✅ সাইটের স্পিড দ্রুত রাখুন (আমরা অটো অপটিমাইজ করি)',
            '✅ প্রোডাক্ট রিভিউ যোগ করুন (Schema এ দেখাবে)',
          ].map(tip => (
            <p key={tip} className="py-1">{tip}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSEO;
