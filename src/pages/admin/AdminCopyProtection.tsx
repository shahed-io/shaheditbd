import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, MousePointerClick, Copy, Move, Bot, Keyboard, TextCursor, Info, Printer, ScanEye, Frame, Terminal, EyeOff, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

type Key =
  | 'copy_protection_enabled'
  | 'cp_right_click'
  | 'cp_copy'
  | 'cp_selection'
  | 'cp_drag'
  | 'cp_devtools'
  | 'cp_scraper_block'
  | 'cp_print'
  | 'cp_devtools_detect'
  | 'cp_iframe_block'
  | 'cp_console_warn'
  | 'cp_blur_on_hide'
  | 'cp_mobile_longpress';

const ALL_KEYS: Key[] = [
  'copy_protection_enabled',
  'cp_right_click', 'cp_copy', 'cp_selection', 'cp_drag', 'cp_devtools', 'cp_scraper_block',
  'cp_print', 'cp_devtools_detect', 'cp_iframe_block', 'cp_console_warn', 'cp_blur_on_hide', 'cp_mobile_longpress',
];

const DEFAULTS: Record<Key, boolean> = {
  copy_protection_enabled: true,
  cp_right_click: true, cp_copy: true, cp_selection: true, cp_drag: true, cp_devtools: true, cp_scraper_block: true,
  cp_print: false, cp_devtools_detect: false, cp_iframe_block: false, cp_console_warn: false, cp_blur_on_hide: false, cp_mobile_longpress: false,
};

const BASIC_FEATURES: { key: Key; icon: any; title: string; desc: string }[] = [
  { key: 'cp_right_click', icon: MousePointerClick, title: 'Right-click Block', desc: 'ভিজিটর রাইট-ক্লিক মেনু খুলতে পারবে না' },
  { key: 'cp_copy', icon: Copy, title: 'Copy / Cut Block', desc: 'Ctrl+C / Ctrl+X দিয়ে কনটেন্ট কপি করা যাবে না' },
  { key: 'cp_selection', icon: TextCursor, title: 'Text Selection Block', desc: 'মাউস দিয়ে টেক্সট সিলেক্ট করা যাবে না' },
  { key: 'cp_drag', icon: Move, title: 'Image Drag Block', desc: 'ছবি ড্র্যাগ করে ডাউনলোড করা যাবে না' },
  { key: 'cp_devtools', icon: Keyboard, title: 'DevTools Shortcuts Block', desc: 'F12, Ctrl+Shift+I/J/C, Ctrl+U/S, PrintScreen ব্লক হবে' },
  { key: 'cp_scraper_block', icon: Bot, title: 'Scraper Bot Block', desc: 'Firecrawl, Puppeteer, wget, curl ইত্যাদি স্ক্র‍্যাপার ব্লক হবে' },
];

const ADVANCED_FEATURES: { key: Key; icon: any; title: string; desc: string }[] = [
  { key: 'cp_print', icon: Printer, title: 'Print Block', desc: 'Ctrl+P ও window.print() ব্লক হবে — পেইজ প্রিন্ট করা যাবে না' },
  { key: 'cp_devtools_detect', icon: ScanEye, title: 'DevTools Open Detection', desc: 'কেউ DevTools খুললে পেইজ ব্লার করে ওভারলে দেখাবে' },
  { key: 'cp_iframe_block', icon: Frame, title: 'Iframe / Clickjacking Block', desc: 'অন্য সাইট iframe দিয়ে আমাদের সাইট embed করতে পারবে না' },
  { key: 'cp_console_warn', icon: Terminal, title: 'Console Warning', desc: 'DevTools console খুললে বড় copyright warning দেখাবে' },
  { key: 'cp_blur_on_hide', icon: EyeOff, title: 'Blur on Tab Hide', desc: 'ভিজিটর ট্যাব সুইচ করলে পেইজ ব্লার হয়ে যাবে (anti-screenshot)' },
  { key: 'cp_mobile_longpress', icon: Smartphone, title: 'Mobile Long-press Block', desc: 'মোবাইলে ছবি/ভিডিও লং-প্রেস করে save করা যাবে না' },
];

const ALL_FEATURES = [...BASIC_FEATURES, ...ADVANCED_FEATURES];

const AdminCopyProtection = () => {
  const [settings, setSettings] = useState<Record<Key, boolean>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<Key | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ALL_KEYS as unknown as string[]);
    const map = { ...DEFAULTS };
    (data || []).forEach((r: any) => {
      if (r.key in map) (map as any)[r.key] = r.value !== 'false';
    });
    setSettings(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (key: Key, next: boolean) => {
    setSavingKey(key);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: next ? 'true' : 'false' }, { onConflict: 'key' });
    setSavingKey(null);
    if (error) { toast.error('Failed: ' + error.message); return; }
    setSettings(prev => ({ ...prev, [key]: next }));
    toast.success(next ? '✅ চালু হয়েছে' : '⚠️ বন্ধ হয়েছে');
  };

  const enableAll = async () => {
    setSavingKey('copy_protection_enabled');
    const rows = ALL_KEYS.map(k => ({ key: k, value: 'true' }));
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    setSavingKey(null);
    if (error) { toast.error(error.message); return; }
    const all = ALL_KEYS.reduce((a, k) => ({ ...a, [k]: true }), {} as any);
    setSettings(all);
    toast.success('🛡️ সব প্রোটেকশন চালু হয়েছে');
  };

  const disableAll = async () => {
    setSavingKey('copy_protection_enabled');
    const rows = ALL_KEYS.map(k => ({ key: k, value: 'false' }));
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    setSavingKey(null);
    if (error) { toast.error(error.message); return; }
    const all = ALL_KEYS.reduce((a, k) => ({ ...a, [k]: false }), {} as any);
    setSettings(all);
    toast.success('⚠️ সব প্রোটেকশন বন্ধ হয়েছে');
  };

  const masterOn = settings.copy_protection_enabled;

  const Toggle = ({ checked, disabled, onChange, size = 'md' }: { checked: boolean; disabled?: boolean; onChange: () => void; size?: 'md' | 'lg' }) => {
    const dim = size === 'lg' ? { h: 'h-9 w-16', knob: 'h-7 w-7', on: 'translate-x-8', off: 'translate-x-1' } : { h: 'h-6 w-11', knob: 'h-4 w-4', on: 'translate-x-6', off: 'translate-x-1' };
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex ${dim.h} shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
      >
        <span className={`inline-block ${dim.knob} transform rounded-full bg-white shadow-lg transition-transform ${checked ? dim.on : dim.off}`} />
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            🛡️ <span className="gradient-text">Copy Protection</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            প্রতিটি প্রোটেকশন আলাদা আলাদা ভাবে চালু/বন্ধ করুন
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={enableAll} disabled={loading || !!savingKey} className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            সব চালু
          </button>
          <button onClick={disableAll} disabled={loading || !!savingKey} className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted/40 text-muted-foreground border border-border hover:bg-muted/60 transition-colors disabled:opacity-50">
            সব বন্ধ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 glass-card rounded-2xl">
          <Loader2 className="animate-spin text-amber-500" size={28} />
        </div>
      ) : (
        <>
          {/* Master Toggle */}
          <div className="glass-card rounded-2xl p-6 border border-amber-500/30">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${masterOn ? 'bg-amber-500/20' : 'bg-muted/30'}`}>
                  <Shield size={28} className={masterOn ? 'text-amber-500' : 'text-muted-foreground'} />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    Master Switch — {masterOn ? 'চালু আছে' : 'বন্ধ আছে'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {masterOn ? '✅ নিচের সক্রিয় প্রোটেকশনগুলো সাইটে চলছে' : '⚠️ মাস্টার বন্ধ — নিচের যেকোনো সেটিং থাকলেও কিছু কাজ করবে না'}
                  </p>
                </div>
              </div>
              <Toggle
                size="lg"
                checked={masterOn}
                disabled={savingKey === 'copy_protection_enabled'}
                onChange={() => save('copy_protection_enabled', !masterOn)}
              />
            </div>
          </div>

          {/* Basic protections */}
          <div>
            <h2 className="text-sm font-bold text-foreground/80 mb-3 uppercase tracking-wider">Basic Protections</h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${masterOn ? '' : 'opacity-60'}`}>
              {BASIC_FEATURES.map(f => {
                const on = settings[f.key];
                return (
                  <div key={f.key} className={`glass-card rounded-2xl p-5 border transition-colors ${on && masterOn ? 'border-amber-500/30' : 'border-border/40'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on && masterOn ? 'bg-amber-500/20' : 'bg-muted/30'}`}>
                          <f.icon size={18} className={on && masterOn ? 'text-amber-500' : 'text-muted-foreground'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-foreground">{f.title}</div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                          <div className={`text-[11px] mt-2 font-semibold ${on ? 'text-amber-500' : 'text-muted-foreground'}`}>{on ? '● চালু' : '○ বন্ধ'}</div>
                        </div>
                      </div>
                      <Toggle checked={on} disabled={savingKey === f.key} onChange={() => save(f.key, !on)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced protections */}
          <div>
            <h2 className="text-sm font-bold text-foreground/80 mb-3 uppercase tracking-wider flex items-center gap-2">
              Advanced Protections <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-500 normal-case">Pro</span>
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${masterOn ? '' : 'opacity-60'}`}>
              {ADVANCED_FEATURES.map(f => {
                const on = settings[f.key];
                return (
                  <div key={f.key} className={`glass-card rounded-2xl p-5 border transition-colors ${on && masterOn ? 'border-sky-500/30' : 'border-border/40'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on && masterOn ? 'bg-sky-500/20' : 'bg-muted/30'}`}>
                          <f.icon size={18} className={on && masterOn ? 'text-sky-500' : 'text-muted-foreground'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-foreground">{f.title}</div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                          <div className={`text-[11px] mt-2 font-semibold ${on ? 'text-sky-500' : 'text-muted-foreground'}`}>{on ? '● চালু' : '○ বন্ধ'}</div>
                        </div>
                      </div>
                      <Toggle checked={on} disabled={savingKey === f.key} onChange={() => save(f.key, !on)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="glass-card rounded-2xl p-6 border border-primary/20">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Info size={16} className="text-primary" /> ℹ️ মনে রাখবেন
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✅ প্রতিটি টগল সাথে সাথে সেভ হয় — আলাদা সেভ বাটনে চাপতে হবে না</li>
              <li>✅ পরিবর্তন কার্যকর হতে ভিজিটরকে পেইজ রিফ্রেশ করতে হবে</li>
              <li>✅ Admin panel (<code className="text-primary">/ceo/*</code>) ও admin ইউজাররা সবসময় বাইপাস করে</li>
              <li>✅ Googlebot, Bingbot, GPTBot ইত্যাদি SEO বট কখনও ব্লক হয় না</li>
              <li>⚠️ মাস্টার সুইচ বন্ধ থাকলে নিচের কোনো প্রোটেকশনই কাজ করবে না</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCopyProtection;
