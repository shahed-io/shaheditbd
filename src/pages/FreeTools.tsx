import { useState, useRef, useCallback } from 'react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { FloatingButtons } from '@/components/store/Extras';
import SEOHead from '@/components/seo/SEOHead';
import {
  Hash, FileText, Type, Clock, Calculator, Link2, Image as ImageIcon,
  Copy, Check, RefreshCw, Trash2, ArrowRight, Sparkles, Zap, Gift, Shield,
  QrCode, AtSign, Scissors, FileImage, Maximize2, RotateCcw, Smile,
  Youtube, Facebook, Twitter, TrendingUp, Bot, PenTool, Mail, Briefcase,
  BookOpen, Edit3, Search, Globe, Tag, ChevronLeft, Wand2, Star, Lock,
  DollarSign, Image, Download, Upload, Eye, EyeOff, Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

// ── glass style helper ──────────────────────────────────────────────────────
const glass = (color: string) => ({
  background: 'linear-gradient(135deg, hsla(0,0%,100%,0.88) 0%, hsla(0,0%,100%,0.70) 100%)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: `1.5px solid ${color.replace('hsl(', 'hsla(').replace(')', ',0.20)')}`,
  boxShadow: `0 4px 24px ${color.replace('hsl(', 'hsla(').replace(')', ',0.10)')}`,
});

const inputStyle = {
  background: 'hsla(258,78%,55%,0.04)',
  border: '1.5px solid hsla(258,78%,55%,0.18)',
  color: 'hsl(226,35%,18%)',
  outline: 'none',
};

const btnPrimary = {
  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))',
  boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)',
  color: 'white',
};

// ── Shared sub-components ───────────────────────────────────────────────────
const CopyBtn = ({ text }: { text: string }) => {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setOk(true); setTimeout(() => setOk(false), 2000);
  };
  return (
    <button onClick={copy} className="p-2 rounded-lg transition-all flex-shrink-0"
      style={{ color: ok ? 'hsl(162,72%,35%)' : 'hsl(258,78%,50%)' }}>
      {ok ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
};

const ResultBox = ({ value, mono = false }: { value: string; mono?: boolean }) => (
  <div className="flex items-start gap-2 p-4 rounded-xl"
    style={{ background: 'hsla(162,72%,38%,0.06)', border: '1.5px solid hsla(162,72%,38%,0.22)' }}>
    <p className={`flex-1 text-sm pr-2 break-all ${mono ? 'font-mono' : ''}`}
      style={{ color: 'hsl(226,35%,18%)' }}>{value}</p>
    <CopyBtn text={value} />
  </div>
);

const ToolInput = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full rounded-xl p-4 text-sm resize-none"
    style={inputStyle}
    onFocus={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px hsla(258,78%,55%,0.08)'; }}
    onBlur={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.18)'; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

const PrimaryBtn = ({ onClick, children, loading = false }: { onClick: () => void; children: React.ReactNode; loading?: boolean }) => (
  <button onClick={onClick} disabled={loading}
    className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
    style={btnPrimary}>
    {loading && <Loader2 size={14} className="animate-spin" />}
    {children}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY TOOLS
// ═══════════════════════════════════════════════════════════════════════════
const WordCounter = () => {
  const [text, setText] = useState('');
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  return (
    <div className="space-y-4">
      <ToolInput value={text} onChange={e => setText(e.target.value)} placeholder="এখানে আপনার টেক্সট লিখুন বা পেস্ট করুন..." rows={6} />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[{ label: 'শব্দ', value: words }, { label: 'অক্ষর', value: chars }, { label: 'স্পেস ছাড়া', value: charsNoSpace }, { label: 'বাক্য', value: sentences }, { label: 'পড়ার সময়', value: `${readTime} মি.` }].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'hsla(258,78%,55%,0.06)', border: '1px solid hsla(258,78%,55%,0.12)' }}>
            <p className="text-xl font-black" style={{ color: 'hsl(258,78%,50%)' }}>{s.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'hsl(226,35%,45%)' }}>{s.label}</p>
          </div>
        ))}
      </div>
      {text && <button onClick={() => setText('')} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ color: 'hsl(0,72%,50%)', background: 'hsla(0,72%,50%,0.07)', border: '1px solid hsla(0,72%,50%,0.18)' }}><Trash2 size={14} />ক্লিয়ার</button>}
    </div>
  );
};

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, num: true, sym: true });
  const generate = () => {
    let chars = '';
    if (opts.lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.num) chars += '0123456789';
    if (opts.sym) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) return;
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    setPassword(Array.from(arr).map(b => chars[b % chars.length]).join(''));
  };
  const s = (() => {
    const n = Object.values(opts).filter(Boolean).length;
    if (length < 8 || n < 2) return { label: 'দুর্বল', color: 'hsl(0,72%,50%)', w: '25%' };
    if (length < 12 || n < 3) return { label: 'মোটামুটি', color: 'hsl(38,92%,50%)', w: '55%' };
    if (length < 16) return { label: 'ভালো', color: 'hsl(200,90%,45%)', w: '75%' };
    return { label: 'শক্তিশালী', color: 'hsl(162,72%,38%)', w: '100%' };
  })();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {([['upper', 'বড় হাতের (A-Z)'], ['lower', 'ছোট হাতের (a-z)'], ['num', 'সংখ্যা (0-9)'], ['sym', 'চিহ্ন (!@#$)']] as const).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl select-none"
            style={{ background: opts[k] ? 'hsla(258,78%,55%,0.08)' : 'hsla(226,35%,50%,0.05)', border: `1.5px solid ${opts[k] ? 'hsla(258,78%,55%,0.30)' : 'hsla(226,35%,50%,0.12)'}` }}>
            <input type="checkbox" className="hidden" checked={opts[k]} onChange={e => setOpts(p => ({ ...p, [k]: e.target.checked }))} />
            <span className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: opts[k] ? 'hsl(258,78%,55%)' : 'transparent', border: `2px solid ${opts[k] ? 'hsl(258,78%,55%)' : 'hsl(226,35%,55%)'}` }}>
              {opts[k] && <Check size={10} className="text-white" />}
            </span>
            <span className="text-xs font-medium" style={{ color: opts[k] ? 'hsl(258,78%,45%)' : 'hsl(226,35%,40%)' }}>{label}</span>
          </label>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>দৈর্ঘ্য</span><span className="font-black text-lg" style={{ color: 'hsl(258,78%,50%)' }}>{length}</span></div>
        <input type="range" min={6} max={64} value={length} onChange={e => setLength(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}><span>শক্তিমাত্রা</span><span style={{ color: s.color }}>{s.label}</span></div>
        <div className="h-2 rounded-full" style={{ background: 'hsla(226,35%,50%,0.12)' }}><div className="h-full rounded-full transition-all duration-500" style={{ width: s.w, background: s.color }} /></div>
      </div>
      <PrimaryBtn onClick={generate}><RefreshCw size={14} />পাসওয়ার্ড তৈরি করুন</PrimaryBtn>
      {password && <ResultBox value={password} mono />}
    </div>
  );
};

const AgeCalculator = () => {
  const [dob, setDob] = useState('');
  const [result, setResult] = useState<{ years: number; months: number; days: number; totalDays: number } | null>(null);
  const calculate = () => {
    if (!dob) return;
    const birth = new Date(dob), today = new Date();
    let y = today.getFullYear() - birth.getFullYear(), m = today.getMonth() - birth.getMonth(), d = today.getDate() - birth.getDate();
    if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    setResult({ years: y, months: m, days: d, totalDays: Math.floor((today.getTime() - birth.getTime()) / 86400000) });
  };
  return (
    <div className="space-y-5">
      <input type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date().toISOString().split('T')[0]}
        className="w-full rounded-xl p-3.5 text-sm" style={inputStyle} />
      <PrimaryBtn onClick={calculate}>বয়স হিসাব করুন</PrimaryBtn>
      {result && (
        <div className="grid grid-cols-2 gap-3">
          {[{ label: 'বছর', value: result.years, c: 'hsl(258,78%,50%)' }, { label: 'মাস', value: result.months, c: 'hsl(200,90%,42%)' }, { label: 'দিন', value: result.days, c: 'hsl(162,72%,38%)' }, { label: 'মোট দিন', value: result.totalDays.toLocaleString(), c: 'hsl(38,92%,50%)' }].map(r => (
            <div key={r.label} className="rounded-xl p-4 text-center" style={{ background: `${r.c.slice(0, -1)},0.07)`.replace('hsl', 'hsla'), border: `1.5px solid ${r.c.slice(0, -1)},0.20)`.replace('hsl', 'hsla') }}>
              <p className="text-3xl font-black" style={{ color: r.c }}>{r.value}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: 'hsl(226,35%,45%)' }}>{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfitCalculator = () => {
  const [cost, setCost] = useState('');
  const [selling, setSelling] = useState('');
  const costN = parseFloat(cost) || 0, sellN = parseFloat(selling) || 0;
  const profit = sellN - costN;
  const margin = costN > 0 ? ((profit / costN) * 100).toFixed(2) : '0';
  const marginSell = sellN > 0 ? ((profit / sellN) * 100).toFixed(2) : '0';
  return (
    <div className="space-y-4">
      {[{ label: 'ক্রয় মূল্য (টাকা)', val: cost, set: setCost }, { label: 'বিক্রয় মূল্য (টাকা)', val: selling, set: setSelling }].map(f => (
        <div key={f.label} className="space-y-1.5">
          <label className="text-sm font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>{f.label}</label>
          <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="0.00" className="w-full rounded-xl p-3.5 text-sm" style={inputStyle} />
        </div>
      ))}
      {(costN > 0 || sellN > 0) && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[{ label: 'লাভ/ক্ষতি', value: `৳${profit.toFixed(2)}`, c: profit >= 0 ? 'hsl(162,72%,38%)' : 'hsl(0,72%,50%)' }, { label: 'লাভের হার', value: `${margin}%`, c: 'hsl(258,78%,50%)' }, { label: 'মার্জিন', value: `${marginSell}%`, c: 'hsl(200,90%,42%)' }, { label: 'লাভজনক', value: profit >= 0 ? 'হ্যাঁ ✓' : 'না ✗', c: profit >= 0 ? 'hsl(162,72%,38%)' : 'hsl(0,72%,50%)' }].map(r => (
            <div key={r.label} className="rounded-xl p-3 text-center" style={{ background: `${r.c.slice(0, -1)},0.07)`.replace('hsl', 'hsla'), border: `1.5px solid ${r.c.slice(0, -1)},0.18)`.replace('hsl', 'hsla') }}>
              <p className="text-xl font-black" style={{ color: r.c }}>{r.value}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: 'hsl(226,35%,45%)' }}>{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CaseConverter = () => {
  const [input, setInput] = useState(''), [result, setResult] = useState('');
  const convert = (t: string) => {
    const m: Record<string, string> = { upper: input.toUpperCase(), lower: input.toLowerCase(), title: input.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), sentence: input.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()), alternate: input.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''), reverse: input.split('').reverse().join('') };
    setResult(m[t] ?? '');
  };
  return (
    <div className="space-y-4">
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder="কনভার্ট করতে টেক্সট লিখুন..." rows={4} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[['upper', 'UPPER CASE'], ['lower', 'lower case'], ['title', 'Title Case'], ['sentence', 'Sentence case'], ['alternate', 'aLtErNaTe'], ['reverse', 'esreveR']].map(([t, l]) => (
          <button key={t} onClick={() => convert(t)} className="py-2.5 px-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]"
            style={{ background: 'hsla(258,78%,55%,0.08)', color: 'hsl(258,78%,45%)', border: '1.5px solid hsla(258,78%,55%,0.20)' }}>{l}</button>
        ))}
      </div>
      {result && <ResultBox value={result} />}
    </div>
  );
};

const UrlEncoder = () => {
  const [input, setInput] = useState(''), [mode, setMode] = useState<'encode' | 'decode'>('encode'), [result, setResult] = useState(''), [error, setError] = useState('');
  const process = () => {
    setError(''); try { setResult(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)); } catch { setError('ভুল ইনপুট'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(''); setError(''); }} className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: mode === m ? 'hsl(258,78%,55%)' : 'transparent', color: mode === m ? 'white' : 'hsl(258,78%,50%)' }}>{m === 'encode' ? 'Encode' : 'Decode'}</button>
        ))}
      </div>
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'encode' ? 'URL লিখুন...' : 'Encoded URL দিন...'} rows={3} />
      <PrimaryBtn onClick={process}>{mode === 'encode' ? 'Encode করুন' : 'Decode করুন'}</PrimaryBtn>
      {error && <p className="text-sm font-medium" style={{ color: 'hsl(0,72%,50%)' }}>{error}</p>}
      {result && <ResultBox value={result} mono />}
    </div>
  );
};

const Base64Tool = () => {
  const [input, setInput] = useState(''), [mode, setMode] = useState<'encode' | 'decode'>('encode'), [result, setResult] = useState(''), [error, setError] = useState('');
  const process = () => {
    setError(''); try { setResult(mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)))); } catch { setError('ভুল ইনপুট'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(''); setError(''); }} className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: mode === m ? 'hsl(258,78%,55%)' : 'transparent', color: mode === m ? 'white' : 'hsl(258,78%,50%)' }}>{m === 'encode' ? 'Encode' : 'Decode'}</button>
        ))}
      </div>
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'encode' ? 'টেক্সট লিখুন...' : 'Base64 দিন...'} rows={3} />
      <PrimaryBtn onClick={process}>{mode === 'encode' ? 'Encode করুন' : 'Decode করুন'}</PrimaryBtn>
      {error && <p className="text-sm font-medium" style={{ color: 'hsl(0,72%,50%)' }}>{error}</p>}
      {result && <ResultBox value={result} mono />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// QR CODE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
const QrGenerator = () => {
  const [text, setText] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [color, setColor] = useState('#6c3bc4');
  const [bgColor, setBgColor] = useState('#ffffff');
  const generate = async () => {
    if (!text.trim()) return;
    try {
      const url = await QRCode.toDataURL(text, { width: 400, margin: 2, color: { dark: color, light: bgColor } });
      setQrUrl(url);
    } catch (e) { console.error(e); }
  };
  const download = () => {
    if (!qrUrl) return;
    const a = document.createElement('a'); a.href = qrUrl; a.download = 'qrcode.png'; a.click();
  };
  return (
    <div className="space-y-4">
      <ToolInput value={text} onChange={e => setText(e.target.value)} placeholder="URL বা টেক্সট লিখুন — যেমন: https://shahedstore.com.bd" rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>QR রঙ</label>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: '1.5px solid hsla(258,78%,55%,0.18)' }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <span className="text-xs font-mono" style={{ color: 'hsl(226,35%,40%)' }}>{color}</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>ব্যাকগ্রাউন্ড</label>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: '1.5px solid hsla(258,78%,55%,0.18)' }}>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <span className="text-xs font-mono" style={{ color: 'hsl(226,35%,40%)' }}>{bgColor}</span>
          </div>
        </div>
      </div>
      <PrimaryBtn onClick={generate}><QrCode size={14} />QR কোড তৈরি করুন</PrimaryBtn>
      {qrUrl && (
        <div className="flex flex-col items-center gap-4">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl border-2" style={{ borderColor: 'hsla(258,78%,55%,0.20)' }} />
          <button onClick={download} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />ডাউনলোড করুন
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE TOOLS (canvas-based)
// ═══════════════════════════════════════════════════════════════════════════
const ImageResizer = () => {
  const [imgSrc, setImgSrc] = useState('');
  const [width, setWidth] = useState('800');
  const [height, setHeight] = useState('600');
  const [outputUrl, setOutputUrl] = useState('');
  const [origSize, setOrigSize] = useState('');

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setOrigSize(`${(file.size / 1024).toFixed(1)} KB`);
    const reader = new FileReader();
    reader.onload = ev => { setImgSrc(ev.target?.result as string); setOutputUrl(''); };
    reader.readAsDataURL(file);
  };
  const resize = () => {
    if (!imgSrc) return;
    const img = new window.Image(); img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = parseInt(width); canvas.height = parseInt(height);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      setOutputUrl(canvas.toDataURL('image/png'));
    };
  };
  const download = () => { if (!outputUrl) return; const a = document.createElement('a'); a.href = outputUrl; a.download = 'resized.png'; a.click(); };
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl cursor-pointer transition-all"
        style={{ border: '2px dashed hsla(258,78%,55%,0.30)', background: 'hsla(258,78%,55%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(258,78%,55%)' }} />
        <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>ছবি আপলোড করুন</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && (
        <>
          <img src={imgSrc} alt="original" className="w-full max-h-40 object-contain rounded-xl" style={{ border: '1px solid hsla(258,78%,55%,0.15)' }} />
          <p className="text-xs font-medium text-center" style={{ color: 'hsl(226,35%,45%)' }}>মূল সাইজ: {origSize}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>প্রস্থ (px)</label><input type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full rounded-xl p-3 text-sm" style={inputStyle} /></div>
            <div className="space-y-1"><label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>উচ্চতা (px)</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full rounded-xl p-3 text-sm" style={inputStyle} /></div>
          </div>
          <PrimaryBtn onClick={resize}><Maximize2 size={14} />রিসাইজ করুন</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="resized" className="w-full max-h-40 object-contain rounded-xl" style={{ border: '1px solid hsla(162,72%,38%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />ডাউনলোড করুন
          </button>
        </div>
      )}
    </div>
  );
};

const ImageConverter = () => {
  const [imgSrc, setImgSrc] = useState('');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);
  const [outputUrl, setOutputUrl] = useState('');
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = ev => { setImgSrc(ev.target?.result as string); setOutputUrl(''); }; reader.readAsDataURL(file);
  };
  const convert = () => {
    if (!imgSrc) return;
    const img = new window.Image(); img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      setOutputUrl(canvas.toDataURL(`image/${format}`, quality / 100));
    };
  };
  const download = () => { if (!outputUrl) return; const a = document.createElement('a'); a.href = outputUrl; a.download = `converted.${format}`; a.click(); };
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(258,78%,55%,0.30)', background: 'hsla(258,78%,55%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(258,78%,55%)' }} /><span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>ছবি আপলোড করুন</span><input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && (
        <>
          <img src={imgSrc} alt="src" className="w-full max-h-36 object-contain rounded-xl" />
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>আউটপুট ফরম্যাট</label>
            <div className="flex gap-2">
              {(['png', 'jpeg', 'webp'] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{ background: format === f ? 'hsl(258,78%,55%)' : 'hsla(258,78%,55%,0.08)', color: format === f ? 'white' : 'hsl(258,78%,50%)', border: `1.5px solid ${format === f ? 'transparent' : 'hsla(258,78%,55%,0.20)'}` }}>
                  .{f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {format !== 'png' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}><span>কোয়ালিটি</span><span style={{ color: 'hsl(258,78%,50%)' }}>{quality}%</span></div>
              <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
            </div>
          )}
          <PrimaryBtn onClick={convert}><RotateCcw size={14} />কনভার্ট করুন</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="converted" className="w-full max-h-36 object-contain rounded-xl" style={{ border: '1px solid hsla(162,72%,38%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />ডাউনলোড (.{format})
          </button>
        </div>
      )}
    </div>
  );
};

const ImageCompressor = () => {
  const [imgSrc, setImgSrc] = useState('');
  const [quality, setQuality] = useState(70);
  const [outputUrl, setOutputUrl] = useState('');
  const [sizes, setSizes] = useState({ orig: 0, compressed: 0 });
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSizes(p => ({ ...p, orig: Math.round(file.size / 1024) }));
    const reader = new FileReader(); reader.onload = ev => { setImgSrc(ev.target?.result as string); setOutputUrl(''); }; reader.readAsDataURL(file);
  };
  const compress = () => {
    if (!imgSrc) return;
    const img = new window.Image(); img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', quality / 100);
      setOutputUrl(dataUrl);
      const bytes = Math.round((dataUrl.length * 3) / 4 / 1024);
      setSizes(p => ({ ...p, compressed: bytes }));
    };
  };
  const download = () => { if (!outputUrl) return; const a = document.createElement('a'); a.href = outputUrl; a.download = 'compressed.jpg'; a.click(); };
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(258,78%,55%,0.30)', background: 'hsla(258,78%,55%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(258,78%,55%)' }} /><span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>ছবি আপলোড করুন</span><input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && (
        <>
          <img src={imgSrc} alt="orig" className="w-full max-h-36 object-contain rounded-xl" />
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}><span>কোয়ালিটি</span><span style={{ color: 'hsl(258,78%,50%)' }}>{quality}%</span></div>
            <input type="range" min={10} max={99} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
          </div>
          <PrimaryBtn onClick={compress}><Scissors size={14} />কম্প্রেস করুন</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: 'hsla(0,72%,50%,0.07)', border: '1.5px solid hsla(0,72%,50%,0.18)' }}>
              <p className="text-xl font-black" style={{ color: 'hsl(0,72%,50%)' }}>{sizes.orig} KB</p>
              <p className="text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}>আগের সাইজ</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'hsla(162,72%,38%,0.07)', border: '1.5px solid hsla(162,72%,38%,0.18)' }}>
              <p className="text-xl font-black" style={{ color: 'hsl(162,72%,38%)' }}>{sizes.compressed} KB</p>
              <p className="text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}>পরের সাইজ</p>
            </div>
          </div>
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />ডাউনলোড করুন
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HASHTAG GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
const HashtagGenerator = () => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'tiktok' | 'youtube'>('instagram');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setTags([]);
    try {
      const { data } = await supabase.functions.invoke('ai-free-tools', {
        body: { tool: 'hashtag', topic, platform }
      });
      if (data?.result) {
        const extracted = (data.result as string).match(/#\w+/g) ?? [];
        setTags(extracted);
      }
    } catch {
      // fallback static
      setTags([`#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#trending', '#viral', '#shahedstore', `#${topic.split(' ')[0]}tips`]);
    }
    setLoading(false);
  };

  const copyAll = async () => { await navigator.clipboard.writeText(tags.join(' ')); };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>
        {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map(p => (
          <button key={p} onClick={() => setPlatform(p)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: platform === p ? 'hsl(258,78%,55%)' : 'transparent', color: platform === p ? 'white' : 'hsl(258,78%,50%)' }}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <ToolInput value={topic} onChange={e => setTopic(e.target.value)} placeholder="টপিক লিখুন — যেমন: বাংলাদেশ ফ্যাশন, ডিজিটাল মার্কেটিং..." rows={2} />
      <PrimaryBtn onClick={generate} loading={loading}><Hash size={14} />হ্যাশট্যাগ তৈরি করুন</PrimaryBtn>
      {tags.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105"
                style={{ background: 'hsla(258,78%,55%,0.10)', color: 'hsl(258,78%,45%)', border: '1px solid hsla(258,78%,55%,0.22)' }}
                onClick={() => navigator.clipboard.writeText(t)}>{t}</span>
            ))}
          </div>
          <button onClick={copyAll} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: 'hsla(162,72%,38%,0.08)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.22)' }}>
            <Copy size={13} />সব কপি করুন
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AI TOOLS (powered by Lovable AI)
// ═══════════════════════════════════════════════════════════════════════════
type AiToolProps = { tool: string; placeholder: string; label: string; btnLabel: string; extraFields?: React.ReactNode; getPromptPayload: () => Record<string, string> };

const AiToolBase = ({ tool, placeholder, btnLabel, extraFields, getPromptPayload }: AiToolProps) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult('');
    try {
      const { data } = await supabase.functions.invoke('ai-free-tools', {
        body: { tool, input, ...getPromptPayload() }
      });
      setResult(data?.result ?? 'কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } catch { setResult('সার্ভার এরর। পরে আবার চেষ্টা করুন।'); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} rows={4} />
      {extraFields}
      <PrimaryBtn onClick={generate} loading={loading}><Wand2 size={14} />{btnLabel}</PrimaryBtn>
      {result && <ResultBox value={result} />}
    </div>
  );
};

const FacebookCaptionGen = () => {
  const [tone, setTone] = useState('engaging');
  return (
    <div className="space-y-4">
      <AiToolBase tool="fb-caption" placeholder="পোস্টের বিষয় লিখুন — যেমন: নতুন পণ্য লঞ্চ, অফার, ইভেন্ট..." label="" btnLabel="ক্যাপশন তৈরি করুন" getPromptPayload={() => ({ tone })}>
      </AiToolBase>
    </div>
  );
};

const YoutubeTitleGen = () => (
  <AiToolBase tool="yt-title" placeholder="ভিডিওর বিষয় লিখুন — যেমন: বাংলাদেশে ফ্রিল্যান্সিং শুরু করার উপায়..." label="" btnLabel="টাইটেল তৈরি করুন" getPromptPayload={() => ({})} />
);

const AdCopyGen = () => (
  <AiToolBase tool="ad-copy" placeholder="পণ্য বা সেবার বিবরণ লিখুন..." label="" btnLabel="Ad Copy তৈরি করুন" getPromptPayload={() => ({})} />
);

const BlogWriterTool = () => (
  <AiToolBase tool="blog-writer" placeholder="ব্লগ টপিক লিখুন — যেমন: ডিজিটাল মার্কেটিং কিভাবে শিখবো..." label="" btnLabel="ব্লগ ড্রাফট তৈরি করুন" getPromptPayload={() => ({})} />
);

const EmailWriterTool = () => (
  <AiToolBase tool="email-writer" placeholder="ইমেইলের বিষয় ও উদ্দেশ্য লিখুন..." label="" btnLabel="ইমেইল তৈরি করুন" getPromptPayload={() => ({})} />
);

const ProductDescGen = () => (
  <AiToolBase tool="product-desc" placeholder="পণ্যের নাম ও বৈশিষ্ট্য লিখুন..." label="" btnLabel="Description তৈরি করুন" getPromptPayload={() => ({})} />
);

const GrammarFixer = () => (
  <AiToolBase tool="grammar-fix" placeholder="ভুল ব্যাকরণের টেক্সট লিখুন — ঠিক করে দেওয়া হবে..." label="" btnLabel="ব্যাকরণ ঠিক করুন" getPromptPayload={() => ({})} />
);

const Paraphraser = () => (
  <AiToolBase tool="paraphrase" placeholder="টেক্সট লিখুন যা নতুনভাবে লিখতে চান..." label="" btnLabel="Paraphrase করুন" getPromptPayload={() => ({})} />
);

const TextSummarizer = () => (
  <AiToolBase tool="summarize" placeholder="দীর্ঘ টেক্সট পেস্ট করুন — সংক্ষেপ করে দেওয়া হবে..." label="" btnLabel="সংক্ষেপ করুন" getPromptPayload={() => ({})} />
);

const SeoMetaGen = () => (
  <AiToolBase tool="seo-meta" placeholder="পেজ বা আর্টিকেলের বিষয় লিখুন..." label="" btnLabel="SEO Meta তৈরি করুন" getPromptPayload={() => ({})} />
);

const BusinessNameGen = () => (
  <AiToolBase tool="business-name" placeholder="আপনার ব্যবসার ধরন ও কীওয়ার্ড লিখুন..." label="" btnLabel="নাম তৈরি করুন" getPromptPayload={() => ({})} />
);

const ResumeGen = () => (
  <AiToolBase tool="resume" placeholder="আপনার নাম, অভিজ্ঞতা, দক্ষতা সংক্ষেপে লিখুন..." label="" btnLabel="Resume ড্রাফট তৈরি করুন" getPromptPayload={() => ({})} />
);

const TikTokCaptionGen = () => (
  <AiToolBase tool="tiktok-caption" placeholder="ভিডিওর বিষয় লিখুন..." label="" btnLabel="TikTok Caption তৈরি করুন" getPromptPayload={() => ({})} />
);

const KeywordGen = () => (
  <AiToolBase tool="keyword-gen" placeholder="আপনার ব্যবসা বা টপিক লিখুন..." label="" btnLabel="Keywords তৈরি করুন" getPromptPayload={() => ({})} />
);

const BioGen = () => (
  <AiToolBase tool="bio-gen" placeholder="আপনার পেশা ও বিশেষত্ব লিখুন — ফেসবুক/ইনস্টাগ্রাম বায়ো..." label="" btnLabel="Bio তৈরি করুন" getPromptPayload={() => ({})} />
);

// Coming Soon placeholder
const ComingSoon = ({ feature }: { feature: string }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsla(258,78%,55%,0.08)', border: '1.5px solid hsla(258,78%,55%,0.20)' }}>
      <Sparkles size={28} style={{ color: 'hsl(258,78%,55%)' }} />
    </div>
    <h3 className="font-bold text-lg" style={{ color: 'hsl(226,35%,18%)' }}>{feature}</h3>
    <p className="text-sm text-center max-w-xs" style={{ color: 'hsl(226,35%,45%)' }}>এই টুলটি শীঘ্রই আসছে। আমরা এটি তৈরি করছি।</p>
    <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: 'hsla(38,92%,50%,0.12)', color: 'hsl(38,92%,40%)', border: '1px solid hsla(38,92%,50%,0.25)' }}>
      🚀 Coming Soon
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// TOOL REGISTRY — categorized
// ═══════════════════════════════════════════════════════════════════════════
type ToolDef = { id: string; icon: React.ReactNode; title: string; subtitle: string; color: string; badge?: string; component: React.ReactNode };
type Category = { id: string; label: string; emoji: string; color: string; tools: ToolDef[] };

const CATEGORIES: Category[] = [
  {
    id: 'utility', label: 'ইউটিলিটি টুলস', emoji: '⚙️', color: 'hsl(258,78%,55%)',
    tools: [
      { id: 'word-counter', icon: <Hash size={20} />, title: 'ওয়ার্ড কাউন্টার', subtitle: 'শব্দ, অক্ষর ও পড়ার সময় গণনা', color: 'hsl(258,78%,55%)', badge: 'জনপ্রিয়', component: <WordCounter /> },
      { id: 'password-gen', icon: <Shield size={20} />, title: 'পাসওয়ার্ড জেনারেটর', subtitle: 'শক্তিশালী পাসওয়ার্ড তৈরি', color: 'hsl(162,72%,38%)', badge: 'সিকিউর', component: <PasswordGenerator /> },
      { id: 'case-converter', icon: <Type size={20} />, title: 'কেস কনভার্টার', subtitle: 'টেক্সটের কেস পরিবর্তন', color: 'hsl(200,90%,45%)', component: <CaseConverter /> },
      { id: 'age-calculator', icon: <Clock size={20} />, title: 'বয়স ক্যালকুলেটর', subtitle: 'সঠিক বয়স বছর, মাস ও দিনে', color: 'hsl(38,92%,50%)', component: <AgeCalculator /> },
      { id: 'profit-calculator', icon: <DollarSign size={20} />, title: 'প্রফিট ক্যালকুলেটর', subtitle: 'লাভ-ক্ষতি ও মার্জিন হিসাব', color: 'hsl(162,72%,38%)', component: <ProfitCalculator /> },
      { id: 'url-encoder', icon: <Link2 size={20} />, title: 'URL Encoder/Decoder', subtitle: 'URL এনকোড ও ডিকোড', color: 'hsl(258,78%,55%)', component: <UrlEncoder /> },
      { id: 'base64', icon: <FileText size={20} />, title: 'Base64 Encoder', subtitle: 'টেক্সট Base64 রূপান্তর', color: 'hsl(330,85%,55%)', component: <Base64Tool /> },
      { id: 'qr-generator', icon: <QrCode size={20} />, title: 'QR কোড জেনারেটর', subtitle: 'কাস্টম কালার QR কোড তৈরি', color: 'hsl(258,78%,55%)', badge: 'নতুন', component: <QrGenerator /> },
      { id: 'hashtag-gen', icon: <Hash size={20} />, title: 'হ্যাশট্যাগ জেনারেটর', subtitle: 'AI দিয়ে হ্যাশট্যাগ তৈরি', color: 'hsl(200,90%,45%)', badge: 'AI', component: <HashtagGenerator /> },
    ]
  },
  {
    id: 'image', label: 'ইমেজ টুলস', emoji: '🖼️', color: 'hsl(200,90%,45%)',
    tools: [
      { id: 'img-resizer', icon: <Maximize2 size={20} />, title: 'ইমেজ রিসাইজার', subtitle: 'কাস্টম সাইজে ছবি রিসাইজ', color: 'hsl(200,90%,45%)', badge: 'নতুন', component: <ImageResizer /> },
      { id: 'img-converter', icon: <RotateCcw size={20} />, title: 'ইমেজ কনভার্টার', subtitle: 'PNG ↔ JPG ↔ WebP রূপান্তর', color: 'hsl(258,78%,55%)', badge: 'নতুন', component: <ImageConverter /> },
      { id: 'img-compressor', icon: <Scissors size={20} />, title: 'ইমেজ কম্প্রেসর', subtitle: 'ছবির সাইজ কমান মান বজায় রেখে', color: 'hsl(38,92%,50%)', badge: 'নতুন', component: <ImageCompressor /> },
      { id: 'img-bg-remove', icon: <Image size={20} />, title: 'ব্যাকগ্রাউন্ড রিমুভার', subtitle: 'ছবির ব্যাকগ্রাউন্ড সরান AI দিয়ে', color: 'hsl(330,85%,55%)', badge: 'শীঘ্রই', component: <ComingSoon feature="Background Remover" /> },
      { id: 'img-blur', icon: <Eye size={20} />, title: 'ব্লার ইমেজ টুল', subtitle: 'ছবি ব্লার করুন সহজে', color: 'hsl(162,72%,38%)', badge: 'শীঘ্রই', component: <ComingSoon feature="Image Blur Tool" /> },
      { id: 'watermark', icon: <Edit3 size={20} />, title: 'ওয়াটারমার্ক টুল', subtitle: 'ছবিতে ওয়াটারমার্ক যুক্ত করুন', color: 'hsl(258,78%,55%)', badge: 'শীঘ্রই', component: <ComingSoon feature="Watermark Tool" /> },
      { id: 'meme-gen', icon: <Smile size={20} />, title: 'মিম জেনারেটর', subtitle: 'মজার মিম তৈরি করুন', color: 'hsl(38,92%,50%)', badge: 'শীঘ্রই', component: <ComingSoon feature="Meme Generator" /> },
      { id: 'thumbnail-maker', icon: <FileImage size={20} />, title: 'থাম্বনেইল মেকার', subtitle: 'YouTube/Social থাম্বনেইল তৈরি', color: 'hsl(200,90%,45%)', badge: 'শীঘ্রই', component: <ComingSoon feature="Thumbnail Maker" /> },
    ]
  },
  {
    id: 'social', label: 'সোশ্যাল মিডিয়া', emoji: '📱', color: 'hsl(330,85%,55%)',
    tools: [
      { id: 'fb-caption', icon: <Facebook size={20} />, title: 'Facebook ক্যাপশন', subtitle: 'AI দিয়ে আকর্ষণীয় FB ক্যাপশন', color: 'hsl(200,90%,45%)', badge: 'AI', component: <FacebookCaptionGen /> },
      { id: 'tiktok-caption', icon: <Zap size={20} />, title: 'TikTok ক্যাপশন', subtitle: 'ভাইরাল TikTok ক্যাপশন তৈরি', color: 'hsl(330,85%,55%)', badge: 'AI', component: <TikTokCaptionGen /> },
      { id: 'yt-title', icon: <Youtube size={20} />, title: 'YouTube টাইটেল', subtitle: 'SEO-অপ্টিমাইজড YouTube টাইটেল', color: 'hsl(0,72%,50%)', badge: 'AI', component: <YoutubeTitleGen /> },
      { id: 'bio-gen', icon: <AtSign size={20} />, title: 'Bio জেনারেটর', subtitle: 'FB/Instagram বায়ো তৈরি', color: 'hsl(258,78%,55%)', badge: 'AI', component: <BioGen /> },
      { id: 'hashtag-social', icon: <Hash size={20} />, title: 'হ্যাশট্যাগ (সোশ্যাল)', subtitle: 'ট্রেন্ডিং হ্যাশট্যাগ জেনারেট', color: 'hsl(200,90%,45%)', badge: 'AI', component: <HashtagGenerator /> },
    ]
  },
  {
    id: 'ai', label: 'AI কন্টেন্ট রাইটার', emoji: '🤖', color: 'hsl(162,72%,38%)',
    tools: [
      { id: 'blog-writer', icon: <BookOpen size={20} />, title: 'ব্লগ রাইটার', subtitle: 'AI দিয়ে সম্পূর্ণ ব্লগ পোস্ট', color: 'hsl(258,78%,55%)', badge: 'AI', component: <BlogWriterTool /> },
      { id: 'ad-copy', icon: <TrendingUp size={20} />, title: 'Ad Copy জেনারেটর', subtitle: 'বিজ্ঞাপনের কপি তৈরি', color: 'hsl(38,92%,50%)', badge: 'AI', component: <AdCopyGen /> },
      { id: 'product-desc', icon: <Tag size={20} />, title: 'পণ্য বিবরণ', subtitle: 'প্রোডাক্ট ডেসক্রিপশন তৈরি', color: 'hsl(162,72%,38%)', badge: 'AI', component: <ProductDescGen /> },
      { id: 'email-writer', icon: <Mail size={20} />, title: 'Email রাইটার', subtitle: 'ফর্মাল/মার্কেটিং ইমেইল', color: 'hsl(200,90%,45%)', badge: 'AI', component: <EmailWriterTool /> },
      { id: 'resume-gen', icon: <Briefcase size={20} />, title: 'Resume জেনারেটর', subtitle: 'প্রফেশনাল Resume ড্রাফট', color: 'hsl(330,85%,55%)', badge: 'AI', component: <ResumeGen /> },
      { id: 'grammar-fix', icon: <Check size={20} />, title: 'গ্রামার ফিক্সার', subtitle: 'ইংরেজি ব্যাকরণ ঠিক করুন', color: 'hsl(162,72%,38%)', badge: 'AI', component: <GrammarFixer /> },
      { id: 'paraphrase', icon: <RotateCcw size={20} />, title: 'Paraphrasing টুল', subtitle: 'টেক্সট নতুনভাবে লিখুন', color: 'hsl(258,78%,55%)', badge: 'AI', component: <Paraphraser /> },
      { id: 'summarize', icon: <FileText size={20} />, title: 'টেক্সট সামারাইজার', subtitle: 'দীর্ঘ লেখা সংক্ষেপ করুন', color: 'hsl(38,92%,50%)', badge: 'AI', component: <TextSummarizer /> },
      { id: 'seo-meta', icon: <Search size={20} />, title: 'SEO Meta জেনারেটর', subtitle: 'Title ও Meta Description', color: 'hsl(200,90%,45%)', badge: 'AI', component: <SeoMetaGen /> },
      { id: 'business-name', icon: <Globe size={20} />, title: 'Business Name', subtitle: 'ব্যবসার নাম ও ডোমেন আইডিয়া', color: 'hsl(162,72%,38%)', badge: 'AI', component: <BusinessNameGen /> },
      { id: 'keyword-gen', icon: <Tag size={20} />, title: 'Keyword জেনারেটর', subtitle: 'SEO কীওয়ার্ড তৈরি', color: 'hsl(258,78%,55%)', badge: 'AI', component: <KeywordGen /> },
    ]
  },
  {
    id: 'pdf', label: 'PDF টুলস', emoji: '📄', color: 'hsl(0,72%,50%)',
    tools: [
      { id: 'pdf-merge', icon: <FileText size={20} />, title: 'PDF Merge', subtitle: 'একাধিক PDF একত্রিত করুন', color: 'hsl(0,72%,50%)', badge: 'শীঘ্রই', component: <ComingSoon feature="PDF Merge" /> },
      { id: 'pdf-split', icon: <Scissors size={20} />, title: 'PDF Split', subtitle: 'PDF ভেঙে আলাদা করুন', color: 'hsl(38,92%,50%)', badge: 'শীঘ্রই', component: <ComingSoon feature="PDF Split" /> },
      { id: 'pdf-compress', icon: <Download size={20} />, title: 'PDF Compress', subtitle: 'PDF এর সাইজ কমান', color: 'hsl(200,90%,45%)', badge: 'শীঘ্রই', component: <ComingSoon feature="PDF Compress" /> },
      { id: 'img-to-pdf', icon: <FileImage size={20} />, title: 'Image to PDF', subtitle: 'ছবি থেকে PDF তৈরি করুন', color: 'hsl(162,72%,38%)', badge: 'শীঘ্রই', component: <ComingSoon feature="Image to PDF" /> },
      { id: 'pdf-lock', icon: <Lock size={20} />, title: 'PDF Lock/Unlock', subtitle: 'PDF পাসওয়ার্ড যোগ/সরান', color: 'hsl(258,78%,55%)', badge: 'শীঘ্রই', component: <ComingSoon feature="PDF Lock/Unlock" /> },
    ]
  },
];

// flatten for easy lookup
const ALL_TOOLS = CATEGORIES.flatMap(c => c.tools);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
const FreeTools = () => {
  const [activeCategory, setActiveCategory] = useState('utility');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const currentCat = CATEGORIES.find(c => c.id === activeCategory)!;
  const activeTolObj = ALL_TOOLS.find(t => t.id === activeTool);
  const filteredTools = search.trim()
    ? ALL_TOOLS.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.subtitle.toLowerCase().includes(search.toLowerCase()))
    : currentCat.tools;
  const totalTools = ALL_TOOLS.length;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <SEOHead title="ফ্রি অনলাইন টুলস | Shahed Store" description="সম্পূর্ণ বিনামূল্যে — Image Resizer, QR Generator, AI Caption, Hashtag Generator, Password Generator সহ ৪০+ টুলস।" />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 px-4"
        style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.07) 0%, hsla(200,90%,45%,0.05) 50%, hsla(162,72%,38%,0.06) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: 'hsla(162,72%,38%,0.10)', border: '1.5px solid hsla(162,72%,38%,0.25)', color: 'hsl(162,72%,30%)' }}>
            <Gift size={14} />সম্পূর্ণ বিনামূল্যে — {totalTools}+ টুলস
          </div>
          <h1 className="font-sora font-black text-4xl sm:text-5xl leading-tight" style={{ color: 'hsl(226,35%,12%)' }}>
            ফ্রি অনলাইন <span style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>টুলস</span>
          </h1>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'hsl(226,35%,40%)' }}>
            Image, AI, PDF, Social Media সহ সকল দরকারি টুলস — কোনো একাউন্ট বা পেমেন্ট ছাড়াই
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'hsl(258,78%,55%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="টুল খুঁজুন..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm"
              style={{ background: 'hsla(0,0%,100%,0.85)', backdropFilter: 'blur(12px)', border: '1.5px solid hsla(258,78%,55%,0.22)', color: 'hsl(226,35%,18%)', outline: 'none' }} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTool ? (
          // ── Tool Detail View ──
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setActiveTool(null)}
              className="flex items-center gap-2 mb-8 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ color: 'hsl(226,35%,40%)', background: 'hsla(226,35%,50%,0.08)', border: '1px solid hsla(226,35%,50%,0.15)' }}>
              <ChevronLeft size={16} />সব টুলস
            </button>
            {activeTolObj && (
              <div className="rounded-3xl overflow-hidden"
                style={{
                  ...glass(activeTolObj.color),
                  boxShadow: `0 8px 48px ${activeTolObj.color.replace('hsl(', 'hsla(').replace(')', ',0.15)')}`,
                }}>
                {/* header */}
                <div className="p-6 flex items-center gap-4"
                  style={{ borderBottom: `1.5px solid ${activeTolObj.color.replace('hsl(', 'hsla(').replace(')', ',0.12)')}`, background: activeTolObj.color.replace('hsl(', 'hsla(').replace(')', ',0.04)') }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${activeTolObj.color.replace('hsl(', 'hsla(').replace(')', ',0.16)')}, ${activeTolObj.color.replace('hsl(', 'hsla(').replace(')', ',0.06)')})`, border: `1.5px solid ${activeTolObj.color.replace('hsl(', 'hsla(').replace(')', ',0.28)')}`, color: activeTolObj.color }}>
                    {activeTolObj.icon}
                  </div>
                  <div>
                    <h2 className="font-sora font-black text-xl" style={{ color: 'hsl(226,35%,12%)' }}>{activeTolObj.title}</h2>
                    <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>{activeTolObj.subtitle}</p>
                  </div>
                </div>
                <div className="p-6">{activeTolObj.component}</div>
              </div>
            )}
            {/* Quick nav */}
            <div className="mt-8">
              <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(226,35%,40%)' }}>অন্য টুলসগুলো:</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOOLS.filter(t => t.id !== activeTool).slice(0, 8).map(tool => (
                  <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ color: tool.color, background: tool.color.replace('hsl(', 'hsla(').replace(')', ',0.07)'), border: `1px solid ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.18)')}` }}>
                    {tool.icon}{tool.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // ── Category + Grid View ──
          <div className="space-y-8">
            {/* Category tabs */}
            {!search.trim() && (
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.03]"
                    style={{
                      background: activeCategory === cat.id ? cat.color : 'hsla(0,0%,100%,0.85)',
                      backdropFilter: 'blur(16px)',
                      color: activeCategory === cat.id ? 'white' : 'hsl(226,35%,35%)',
                      border: `1.5px solid ${activeCategory === cat.id ? 'transparent' : cat.color.replace('hsl(', 'hsla(').replace(')', ',0.22)')}`,
                      boxShadow: activeCategory === cat.id ? `0 4px 16px ${cat.color.replace('hsl(', 'hsla(').replace(')', ',0.30)')}` : 'none',
                    }}>
                    <span>{cat.emoji}</span>{cat.label}
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: activeCategory === cat.id ? 'hsla(0,0%,100%,0.22)' : cat.color.replace('hsl(', 'hsla(').replace(')', ',0.12)'), color: activeCategory === cat.id ? 'white' : cat.color }}>
                      {cat.tools.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {/* Section title */}
            {!search.trim() && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentCat.emoji}</span>
                <div>
                  <h2 className="font-sora font-black text-xl" style={{ color: 'hsl(226,35%,14%)' }}>{currentCat.label}</h2>
                  <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>{currentCat.tools.length}টি টুলস উপলব্ধ</p>
                </div>
              </div>
            )}
            {search.trim() && (
              <p className="text-sm font-semibold" style={{ color: 'hsl(226,35%,45%)' }}>
                "{search}" এর জন্য {filteredTools.length}টি টুল পাওয়া গেছে
              </p>
            )}
            {/* Tools grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTools.map(tool => (
                <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                  className="group relative text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                  style={{
                    ...glass(tool.color),
                    background: 'linear-gradient(145deg, hsla(0,0%,100%,0.92) 0%, hsla(0,0%,100%,0.72) 100%)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 36px ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.22)')}`;
                    (e.currentTarget as HTMLElement).style.borderColor = tool.color.replace('hsl(', 'hsla(').replace(')', ',0.40)');
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.10)')}`;
                    (e.currentTarget as HTMLElement).style.borderColor = tool.color.replace('hsl(', 'hsla(').replace(')', ',0.20)');
                  }}>
                  {/* shimmer line */}
                  <div className="absolute top-0 left-4 right-4 h-px rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.35)')}, transparent)` }} />
                  {/* left color stripe */}
                  <div className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full" style={{ background: tool.color.replace('hsl(', 'hsla(').replace(')', ',0.45)') }} />

                  {tool.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: tool.color.replace('hsl(', 'hsla(').replace(')', ',0.12)'), color: tool.color, border: `1px solid ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.25)')}` }}>
                      {tool.badge}
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: `linear-gradient(135deg, ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.16)')}, ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.06)')})`, border: `1.5px solid ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.25)')}`, color: tool.color }}>
                    {tool.icon}
                  </div>
                  <h3 className="font-sora font-black text-sm mb-1" style={{ color: 'hsl(226,35%,14%)' }}>{tool.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(226,35%,48%)' }}>{tool.subtitle}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-bold" style={{ color: tool.color }}>
                    ব্যবহার করুন <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16 rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,42%))', boxShadow: '0 12px 48px hsla(258,78%,55%,0.30)' }}>
        <div className="max-w-4xl mx-auto px-8 py-12 text-center text-white space-y-4">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'hsla(0,0%,100%,0.18)', backdropFilter: 'blur(12px)' }}><Sparkles size={24} /></div>
          <h2 className="font-sora font-black text-3xl">আরও টুলস আসছে!</h2>
          <p className="text-white/80 text-base max-w-xl mx-auto">PDF Tools, Background Remover, Meme Generator সহ আরও অনেক টুলস শীঘ্রই যুক্ত হবে। নতুন কোনো টুলের পরামর্শ থাকলে জানান।</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a href="/contact" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: 'hsla(0,0%,100%,0.18)', backdropFilter: 'blur(12px)', border: '1.5px solid hsla(0,0%,100%,0.30)' }}>পরামর্শ দিন <ArrowRight size={14} /></a>
            <a href="/shop" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 text-white" style={{ background: 'hsla(0,0%,100%,0.25)', backdropFilter: 'blur(12px)', border: '1.5px solid hsla(0,0%,100%,0.40)' }}>প্রোডাক্ট দেখুন <ArrowRight size={14} /></a>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default FreeTools;
