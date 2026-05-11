import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { FloatingButtons } from '@/components/store/Extras';
import SEOHead from '@/components/seo/SEOHead';
import ReactMarkdown from 'react-markdown';
import {
  Hash, FileText, Type, Clock, Calculator, Link2, Image as ImageIcon,
  Copy, Check, RefreshCw, Trash2, ArrowRight, Sparkles, Zap, Gift, Shield,
  QrCode, AtSign, Scissors, FileImage, Maximize2, RotateCcw, Smile,
  Youtube, Facebook, Twitter, TrendingUp, Bot, PenTool, Mail, Briefcase,
  BookOpen, Edit3, Search, Globe, Tag, ChevronLeft, Wand2, Star, Lock,
  DollarSign, Image, Download, Upload, Eye, EyeOff, Loader2, Droplets,
  Stamp, Laugh, Film, Combine, SplitSquareVertical, Minimize2, FileLock2
} from 'lucide-react';

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
    if (length < 8 || n < 2) return { label: 'Weak', color: 'hsl(0,72%,50%)', w: '25%' };
    if (length < 12 || n < 3) return { label: 'Fair', color: 'hsl(38,92%,50%)', w: '55%' };
    if (length < 16) return { label: 'Good', color: 'hsl(200,90%,45%)', w: '75%' };
    return { label: 'Strong', color: 'hsl(162,72%,38%)', w: '100%' };
  })();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {([['upper', 'Uppercase (A-Z)'], ['lower', 'Lowercase (a-z)'], ['num', 'Numbers (0-9)'], ['sym', 'Symbols (!@#$)']] as const).map(([k, label]) => (
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
        <div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>Length</span><span className="font-black text-lg" style={{ color: 'hsl(258,78%,50%)' }}>{length}</span></div>
        <input type="range" min={6} max={64} value={length} onChange={e => setLength(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}><span>Strength</span><span style={{ color: s.color }}>{s.label}</span></div>
        <div className="h-2 rounded-full" style={{ background: 'hsla(226,35%,50%,0.12)' }}><div className="h-full rounded-full transition-all duration-500" style={{ width: s.w, background: s.color }} /></div>
      </div>
      <PrimaryBtn onClick={generate}><RefreshCw size={14} />Generate Password</PrimaryBtn>
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
      <PrimaryBtn onClick={calculate}>Calculate Age</PrimaryBtn>
      {result && (
        <div className="grid grid-cols-2 gap-3">
          {[{ label: 'Years', value: result.years, c: 'hsl(258,78%,50%)' }, { label: 'Months', value: result.months, c: 'hsl(200,90%,42%)' }, { label: 'Days', value: result.days, c: 'hsl(162,72%,38%)' }, { label: 'Total Days', value: result.totalDays.toLocaleString(), c: 'hsl(38,92%,50%)' }].map(r => (
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
      {[{ label: 'Cost Price (৳)', val: cost, set: setCost }, { label: 'Selling Price (৳)', val: selling, set: setSelling }].map(f => (
        <div key={f.label} className="space-y-1.5">
          <label className="text-sm font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>{f.label}</label>
          <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="0.00" className="w-full rounded-xl p-3.5 text-sm" style={inputStyle} />
        </div>
      ))}
      {(costN > 0 || sellN > 0) && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[{ label: 'Profit/Loss', value: `৳${profit.toFixed(2)}`, c: profit >= 0 ? 'hsl(162,72%,38%)' : 'hsl(0,72%,50%)' }, { label: 'Profit Rate', value: `${margin}%`, c: 'hsl(258,78%,50%)' }, { label: 'Margin', value: `${marginSell}%`, c: 'hsl(200,90%,42%)' }, { label: 'Profitable', value: profit >= 0 ? 'Yes ✓' : 'No ✗', c: profit >= 0 ? 'hsl(162,72%,38%)' : 'hsl(0,72%,50%)' }].map(r => (
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
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to convert..." rows={4} />
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
    setError(''); try { setResult(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)); } catch { setError('Invalid input'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(''); setError(''); }} className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: mode === m ? 'hsl(258,78%,55%)' : 'transparent', color: mode === m ? 'white' : 'hsl(258,78%,50%)' }}>{m === 'encode' ? 'Encode' : 'Decode'}</button>
        ))}
      </div>
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'encode' ? 'Enter URL...' : 'Enter encoded URL...'} rows={3} />
      <PrimaryBtn onClick={process}>{mode === 'encode' ? 'Encode' : 'Decode'}</PrimaryBtn>
      {error && <p className="text-sm font-medium" style={{ color: 'hsl(0,72%,50%)' }}>{error}</p>}
      {result && <ResultBox value={result} mono />}
    </div>
  );
};

const Base64Tool = () => {
  const [input, setInput] = useState(''), [mode, setMode] = useState<'encode' | 'decode'>('encode'), [result, setResult] = useState(''), [error, setError] = useState('');
  const process = () => {
    setError(''); try { setResult(mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)))); } catch { setError('Invalid input'); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(''); setError(''); }} className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: mode === m ? 'hsl(258,78%,55%)' : 'transparent', color: mode === m ? 'white' : 'hsl(258,78%,50%)' }}>{m === 'encode' ? 'Encode' : 'Decode'}</button>
        ))}
      </div>
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'encode' ? 'Enter text...' : 'Enter Base64...'} rows={3} />
      <PrimaryBtn onClick={process}>{mode === 'encode' ? 'Encode' : 'Decode'}</PrimaryBtn>
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
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (!text.trim()) return;
    setLoading(true);
    const encoded = encodeURIComponent(text.trim());
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}&color=${color.replace('#','')}&bgcolor=${bgColor.replace('#','')}&format=png&margin=10`;
    setQrUrl(url);
    setLoading(false);
  };
  const download = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'qrcode.png';
      a.click();
    } catch (e) { console.error(e); }
  };
  return (
    <div className="space-y-4">
      <ToolInput value={text} onChange={e => setText(e.target.value)} placeholder="Enter URL or text — e.g. https://shahedstore.com.bd" rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>QR Color</label>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: '1.5px solid hsla(258,78%,55%,0.18)' }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <span className="text-xs font-mono" style={{ color: 'hsl(226,35%,40%)' }}>{color}</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Background</label>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: '1.5px solid hsla(258,78%,55%,0.18)' }}>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <span className="text-xs font-mono" style={{ color: 'hsl(226,35%,40%)' }}>{bgColor}</span>
          </div>
        </div>
      </div>
      <PrimaryBtn onClick={generate}>{loading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}Generate QR Code</PrimaryBtn>
      {qrUrl && (
        <div className="flex flex-col items-center gap-4">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl border-2" style={{ borderColor: 'hsla(258,78%,55%,0.20)' }} />
          <button onClick={download} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download
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
        <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Image</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && (
        <>
          <img src={imgSrc} alt="original" className="w-full max-h-40 object-contain rounded-xl" style={{ border: '1px solid hsla(258,78%,55%,0.15)' }} />
          <p className="text-xs font-medium text-center" style={{ color: 'hsl(226,35%,45%)' }}>Original size: {origSize}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Width (px)</label><input type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full rounded-xl p-3 text-sm" style={inputStyle} /></div>
            <div className="space-y-1"><label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Height (px)</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full rounded-xl p-3 text-sm" style={inputStyle} /></div>
          </div>
          <PrimaryBtn onClick={resize}><Maximize2 size={14} />Resize Image</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="resized" className="w-full max-h-40 object-contain rounded-xl" style={{ border: '1px solid hsla(162,72%,38%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download
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
        <Upload size={28} style={{ color: 'hsl(258,78%,55%)' }} /><span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Image</span><input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && (
        <>
          <img src={imgSrc} alt="src" className="w-full max-h-36 object-contain rounded-xl" />
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Output Format</label>
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
              <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}><span>Quality</span><span style={{ color: 'hsl(258,78%,50%)' }}>{quality}%</span></div>
              <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
            </div>
          )}
          <PrimaryBtn onClick={convert}><RotateCcw size={14} />Convert</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="converted" className="w-full max-h-36 object-contain rounded-xl" style={{ border: '1px solid hsla(162,72%,38%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download (.{format})
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
        <Upload size={28} style={{ color: 'hsl(258,78%,55%)' }} /><span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Image</span><input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && (
        <>
          <img src={imgSrc} alt="orig" className="w-full max-h-36 object-contain rounded-xl" />
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}><span>Quality</span><span style={{ color: 'hsl(258,78%,50%)' }}>{quality}%</span></div>
            <input type="range" min={10} max={99} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
          </div>
          <PrimaryBtn onClick={compress}><Scissors size={14} />Compress</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: 'hsla(0,72%,50%,0.07)', border: '1.5px solid hsla(0,72%,50%,0.18)' }}>
              <p className="text-xl font-black" style={{ color: 'hsl(0,72%,50%)' }}>{sizes.orig} KB</p>
              <p className="text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}>Before</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'hsla(162,72%,38%,0.07)', border: '1.5px solid hsla(162,72%,38%,0.18)' }}>
              <p className="text-xl font-black" style={{ color: 'hsl(162,72%,38%)' }}>{sizes.compressed} KB</p>
              <p className="text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}>After</p>
            </div>
          </div>
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download
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
      <ToolInput value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter topic — e.g. Fashion, Digital Marketing..." rows={2} />
      <PrimaryBtn onClick={generate} loading={loading}><Hash size={14} />Generate Hashtags</PrimaryBtn>
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
            <Copy size={13} />Copy All
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
      setResult(data?.result ?? 'Something went wrong, please try again.');
    } catch { setResult('Server error. Please try again later.'); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <ToolInput value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} rows={4} />
      {extraFields}
      <PrimaryBtn onClick={generate} loading={loading}><Wand2 size={14} />{btnLabel}</PrimaryBtn>
      {result && (
        <div className="relative rounded-xl p-5" style={{ background: 'hsla(162,72%,38%,0.06)', border: '1.5px solid hsla(162,72%,38%,0.22)' }}>
          <div className="absolute top-3 right-3"><CopyBtn text={result} /></div>
          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-headings:font-bold prose-h2:text-base prose-h3:text-sm prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

const FacebookCaptionGen = () => {
  const [tone] = useState('engaging');
  return (
    <div className="space-y-4">
      <AiToolBase tool="fb-caption" placeholder="Describe your post topic — e.g. new product launch, offer, event..." label="" btnLabel="Generate Caption" getPromptPayload={() => ({ tone })}>
      </AiToolBase>
    </div>
  );
};

const YoutubeTitleGen = () => (
  <AiToolBase tool="yt-title" placeholder="Describe your video topic — e.g. How to start freelancing..." label="" btnLabel="Generate Title" getPromptPayload={() => ({})} />
);

const AdCopyGen = () => (
  <AiToolBase tool="ad-copy" placeholder="Describe your product or service..." label="" btnLabel="Generate Ad Copy" getPromptPayload={() => ({})} />
);

const BlogWriterTool = () => (
  <AiToolBase tool="blog-writer" placeholder="Enter blog topic — e.g. How to learn digital marketing..." label="" btnLabel="Generate Blog Draft" getPromptPayload={() => ({})} />
);

const EmailWriterTool = () => (
  <AiToolBase tool="email-writer" placeholder="Describe the email subject and purpose..." label="" btnLabel="Write Email" getPromptPayload={() => ({})} />
);

const ProductDescGen = () => (
  <AiToolBase tool="product-desc" placeholder="Enter product name and features..." label="" btnLabel="Generate Description" getPromptPayload={() => ({})} />
);

const GrammarFixer = () => (
  <AiToolBase tool="grammar-fix" placeholder="Paste text with grammar errors — it will be corrected..." label="" btnLabel="Fix Grammar" getPromptPayload={() => ({})} />
);

const Paraphraser = () => (
  <AiToolBase tool="paraphrase" placeholder="Enter text you want to rewrite..." label="" btnLabel="Paraphrase" getPromptPayload={() => ({})} />
);

const TextSummarizer = () => (
  <AiToolBase tool="summarize" placeholder="Paste long text — it will be summarized..." label="" btnLabel="Summarize" getPromptPayload={() => ({})} />
);

const SeoMetaGen = () => (
  <AiToolBase tool="seo-meta" placeholder="Describe your page or article topic..." label="" btnLabel="Generate SEO Meta" getPromptPayload={() => ({})} />
);

const BusinessNameGen = () => (
  <AiToolBase tool="business-name" placeholder="Describe your business type and keywords..." label="" btnLabel="Generate Names" getPromptPayload={() => ({})} />
);

const ResumeGen = () => (
  <AiToolBase tool="resume" placeholder="Enter your name, experience, skills briefly..." label="" btnLabel="Generate Resume Draft" getPromptPayload={() => ({})} />
);

const TikTokCaptionGen = () => (
  <AiToolBase tool="tiktok-caption" placeholder="Describe your video topic..." label="" btnLabel="Generate TikTok Caption" getPromptPayload={() => ({})} />
);

const KeywordGen = () => (
  <AiToolBase tool="keyword-gen" placeholder="Enter your business or topic..." label="" btnLabel="Generate Keywords" getPromptPayload={() => ({})} />
);

const BioGen = () => (
  <AiToolBase tool="bio-gen" placeholder="Enter your profession and specialty — for Facebook/Instagram bio..." label="" btnLabel="Generate Bio" getPromptPayload={() => ({})} />
);

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE BLUR TOOL
// ═══════════════════════════════════════════════════════════════════════════
const ImageBlurTool = () => {
  const [imgSrc, setImgSrc] = useState('');
  const [blurAmount, setBlurAmount] = useState(5);
  const [outputUrl, setOutputUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImgSrc(ev.target?.result as string); setOutputUrl(''); };
    reader.readAsDataURL(file);
  };
  const applyBlur = () => {
    if (!imgSrc) return;
    const img = new window.Image(); img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(img, 0, 0);
      setOutputUrl(canvas.toDataURL('image/png'));
    };
  };
  const download = () => { if (!outputUrl) return; const a = document.createElement('a'); a.href = outputUrl; a.download = 'blurred.png'; a.click(); };
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(162,72%,38%,0.30)', background: 'hsla(162,72%,38%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(162,72%,38%)' }} />
        <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Image</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && (
        <>
          <img src={imgSrc} alt="original" className="w-full max-h-36 object-contain rounded-xl" />
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}>
              <span>Blur Amount</span><span style={{ color: 'hsl(162,72%,38%)' }}>{blurAmount}px</span>
            </div>
            <input type="range" min={1} max={30} value={blurAmount} onChange={e => setBlurAmount(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: 'hsl(162,72%,38%)' }} />
          </div>
          <PrimaryBtn onClick={applyBlur}><Droplets size={14} />Apply Blur</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="blurred" className="w-full max-h-36 object-contain rounded-xl" style={{ border: '1px solid hsla(162,72%,38%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WATERMARK TOOL
// ═══════════════════════════════════════════════════════════════════════════
const WatermarkTool = () => {
  const [imgSrc, setImgSrc] = useState('');
  const [text, setText] = useState('© Shahed Store');
  const [position, setPosition] = useState<'center' | 'bottom-right' | 'bottom-left' | 'top-right'>('bottom-right');
  const [opacity, setOpacity] = useState(70);
  const [fontSize, setFontSize] = useState(36);
  const [outputUrl, setOutputUrl] = useState('');

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImgSrc(ev.target?.result as string); setOutputUrl(''); };
    reader.readAsDataURL(file);
  };
  const applyWatermark = () => {
    if (!imgSrc || !text.trim()) return;
    const img = new window.Image(); img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      const metrics = ctx.measureText(text);
      const pad = 20;
      let x = canvas.width / 2, y = canvas.height / 2;
      if (position === 'bottom-right') { x = canvas.width - metrics.width / 2 - pad; y = canvas.height - pad; }
      else if (position === 'bottom-left') { x = metrics.width / 2 + pad; y = canvas.height - pad; }
      else if (position === 'top-right') { x = canvas.width - metrics.width / 2 - pad; y = fontSize + pad; }
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
      ctx.fillText(text, x, y);
      setOutputUrl(canvas.toDataURL('image/png'));
    };
  };
  const download = () => { if (!outputUrl) return; const a = document.createElement('a'); a.href = outputUrl; a.download = 'watermarked.png'; a.click(); };
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(258,78%,55%,0.30)', background: 'hsla(258,78%,55%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(258,78%,55%)' }} />
        <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Image</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && <>
        <img src={imgSrc} alt="original" className="w-full max-h-36 object-contain rounded-xl" />
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Watermark Text</label>
          <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full rounded-xl p-3 text-sm" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Position</label>
            <select value={position} onChange={e => setPosition(e.target.value as typeof position)} className="w-full rounded-xl p-2.5 text-sm" style={inputStyle}>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="center">Center</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Font Size: {fontSize}px</label>
            <input type="range" min={16} max={80} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full mt-2 cursor-pointer" style={{ accentColor: 'hsl(258,78%,55%)' }} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}><span>Opacity</span><span style={{ color: 'hsl(258,78%,50%)' }}>{opacity}%</span></div>
          <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: 'hsl(258,78%,55%)' }} />
        </div>
        <PrimaryBtn onClick={applyWatermark}><Stamp size={14} />Add Watermark</PrimaryBtn>
      </>}
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="watermarked" className="w-full max-h-36 object-contain rounded-xl" style={{ border: '1px solid hsla(162,72%,38%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MEME GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
const MemeGenerator = () => {
  const [imgSrc, setImgSrc] = useState('');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [outputUrl, setOutputUrl] = useState('');

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImgSrc(ev.target?.result as string); setOutputUrl(''); };
    reader.readAsDataURL(file);
  };
  const generate = () => {
    if (!imgSrc) return;
    const img = new window.Image(); img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const fs = Math.max(24, Math.round(img.width / 14));
      ctx.font = `bold ${fs}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = fs / 8;
      if (topText.trim()) {
        ctx.strokeText(topText.toUpperCase(), img.width / 2, fs + 10);
        ctx.fillText(topText.toUpperCase(), img.width / 2, fs + 10);
      }
      if (bottomText.trim()) {
        ctx.strokeText(bottomText.toUpperCase(), img.width / 2, img.height - 15);
        ctx.fillText(bottomText.toUpperCase(), img.width / 2, img.height - 15);
      }
      setOutputUrl(canvas.toDataURL('image/png'));
    };
  };
  const download = () => { if (!outputUrl) return; const a = document.createElement('a'); a.href = outputUrl; a.download = 'meme.png'; a.click(); };
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(38,92%,50%,0.30)', background: 'hsla(38,92%,50%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(38,92%,50%)' }} />
        <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Image</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {imgSrc && <>
        <img src={imgSrc} alt="original" className="w-full max-h-36 object-contain rounded-xl" />
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Top Text</label>
          <input type="text" value={topText} onChange={e => setTopText(e.target.value)} placeholder="TOP TEXT..." className="w-full rounded-xl p-3 text-sm" style={inputStyle} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Bottom Text</label>
          <input type="text" value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="BOTTOM TEXT..." className="w-full rounded-xl p-3 text-sm" style={inputStyle} />
        </div>
        <PrimaryBtn onClick={generate}><Laugh size={14} />Generate Meme</PrimaryBtn>
      </>}
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="meme" className="w-full max-h-48 object-contain rounded-xl" style={{ border: '1px solid hsla(38,92%,50%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download Meme
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// THUMBNAIL MAKER
// ═══════════════════════════════════════════════════════════════════════════
const ThumbnailMaker = () => {
  const [imgSrc, setImgSrc] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [preset, setPreset] = useState<'youtube' | 'instagram' | 'facebook'>('youtube');
  const [bgColor, setBgColor] = useState('#1a0533');
  const [textColor, setTextColor] = useState('#ffffff');
  const [outputUrl, setOutputUrl] = useState('');

  const PRESETS = { youtube: { w: 1280, h: 720, label: 'YouTube (1280×720)' }, instagram: { w: 1080, h: 1080, label: 'Instagram (1080×1080)' }, facebook: { w: 1200, h: 630, label: 'Facebook (1200×630)' } };

  const generate = () => {
    const { w, h } = PRESETS[preset];
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, bgColor); grad.addColorStop(1, '#0f2b6e');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    // overlay image
    if (imgSrc) {
      const img = new window.Image(); img.src = imgSrc;
      ctx.drawImage(img, w * 0.5, 0, w * 0.5, h);
      ctx.fillStyle = `${bgColor}cc`; ctx.fillRect(w * 0.5, 0, w * 0.5, h);
    }
    // title text
    if (title.trim()) {
      const fs = Math.round(h / 8);
      ctx.font = `bold ${fs}px Arial Black, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      const maxW = imgSrc ? w * 0.48 : w - 80;
      const words = title.split(' ');
      let line = '', lines: string[] = [], y = h / 2 - fs;
      words.forEach(word => {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) { lines.push(line.trim()); line = word + ' '; }
        else line = test;
      });
      lines.push(line.trim());
      lines.forEach((l, i) => ctx.fillText(l, 40, y + i * (fs * 1.2)));
    }
    if (subtitle.trim()) {
      ctx.font = `${Math.round(h / 16)}px Arial, sans-serif`;
      ctx.fillStyle = `${textColor}cc`;
      ctx.textAlign = 'left';
      ctx.fillText(subtitle, 40, h * 0.82);
    }
    setOutputUrl(canvas.toDataURL('image/png'));
  };
  const download = () => { if (!outputUrl) return; const a = document.createElement('a'); a.href = outputUrl; a.download = `thumbnail-${preset}.png`; a.click(); };
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsla(200,90%,45%,0.08)' }}>
        {(Object.entries(PRESETS) as [typeof preset, typeof PRESETS[typeof preset]][]).map(([k, v]) => (
          <button key={k} onClick={() => setPreset(k)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{ background: preset === k ? 'hsl(200,90%,45%)' : 'transparent', color: preset === k ? 'white' : 'hsl(200,90%,40%)' }}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      <label className="flex flex-col items-center gap-2 p-5 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(200,90%,45%,0.30)', background: 'hsla(200,90%,45%,0.03)' }}>
        <Upload size={22} style={{ color: 'hsl(200,90%,45%)' }} />
        <span className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Background Image (optional)</span>
        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setImgSrc(ev.target?.result as string); r.readAsDataURL(f); }} />
      </label>
      <div className="space-y-1">
        <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Title Text</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter thumbnail title..." className="w-full rounded-xl p-3 text-sm" style={inputStyle} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Subtitle (optional)</label>
        <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle or channel name..." className="w-full rounded-xl p-3 text-sm" style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>BG Color</label>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: '1.5px solid hsla(200,90%,45%,0.18)' }}>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <span className="text-xs font-mono" style={{ color: 'hsl(226,35%,40%)' }}>{bgColor}</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Text Color</label>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: '1.5px solid hsla(200,90%,45%,0.18)' }}>
            <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <span className="text-xs font-mono" style={{ color: 'hsl(226,35%,40%)' }}>{textColor}</span>
          </div>
        </div>
      </div>
      <PrimaryBtn onClick={generate}><Film size={14} />Generate Thumbnail</PrimaryBtn>
      {outputUrl && (
        <div className="space-y-3">
          <img src={outputUrl} alt="thumbnail" className="w-full rounded-xl" style={{ border: '1px solid hsla(200,90%,45%,0.25)' }} />
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download ({PRESETS[preset].label})
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PDF TOOLS (client-side using browser APIs)
// ═══════════════════════════════════════════════════════════════════════════
const ImageToPdf = () => {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [outputUrl, setOutputUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const readers = files.map(f => new Promise<{ name: string; url: string }>(res => {
      const r = new FileReader();
      r.onload = ev => res({ name: f.name, url: ev.target?.result as string });
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => setImages(p => [...p, ...imgs]));
  };

  const convert = async () => {
    if (!images.length) return;
    setLoading(true);
    // Build a simple PDF with raw bytes using canvas → PNG → PDF structure
    const A4_W = 595, A4_H = 842;
    const pages: string[] = [];
    for (const img of images) {
      await new Promise<void>(res => {
        const i = new window.Image(); i.src = img.url;
        i.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(A4_W / i.width, A4_H / i.height);
          canvas.width = A4_W; canvas.height = A4_H;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = 'white'; ctx.fillRect(0, 0, A4_W, A4_H);
          const dw = i.width * scale, dh = i.height * scale;
          ctx.drawImage(i, (A4_W - dw) / 2, (A4_H - dh) / 2, dw, dh);
          pages.push(canvas.toDataURL('image/jpeg', 0.92));
          res();
        };
      });
    }
    // Use jsPDF-like manual PDF construction via a simple approach with blob URL
    // We use a printable HTML approach converted via blob
    const html = `<html><head><style>@page{margin:0;size:A4}body{margin:0}img{width:100%;page-break-after:always}</style></head><body>${pages.map(p => `<img src="${p}"/>`).join('')}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    setOutputUrl(URL.createObjectURL(blob));
    setLoading(false);
  };

  const download = () => {
    if (!outputUrl) return;
    const a = document.createElement('a'); a.href = outputUrl; a.download = 'images.html'; a.click();
  };
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(162,72%,38%,0.30)', background: 'hsla(162,72%,38%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(162,72%,38%)' }} />
        <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload Images (multiple)</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
      </label>
      {images.length > 0 && (
        <>
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'hsla(162,72%,38%,0.06)', border: '1px solid hsla(162,72%,38%,0.18)' }}>
                <div className="flex items-center gap-2">
                  <img src={img.url} alt={img.name} className="w-8 h-8 object-cover rounded" />
                  <span className="text-xs font-medium truncate max-w-[180px]" style={{ color: 'hsl(226,35%,35%)' }}>{img.name}</span>
                </div>
                <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: 'hsl(0,72%,50%)', background: 'hsla(0,72%,50%,0.08)' }}>✕</button>
              </div>
            ))}
          </div>
          <PrimaryBtn onClick={convert} loading={loading}><FileImage size={14} />Convert to Printable PDF</PrimaryBtn>
        </>
      )}
      {outputUrl && (
        <div className="space-y-2">
          <p className="text-xs text-center" style={{ color: 'hsl(226,35%,45%)' }}>Open in browser → Print → Save as PDF</p>
          <button onClick={download} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'hsla(162,72%,38%,0.10)', color: 'hsl(162,72%,30%)', border: '1.5px solid hsla(162,72%,38%,0.25)' }}>
            <Download size={14} />Download & Print as PDF
          </button>
        </div>
      )}
    </div>
  );
};

const PdfMergeTool = () => {
  const [files, setFiles] = useState<File[]>([]);
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => setFiles(p => [...p, ...Array.from(e.target.files ?? [])]);
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer" style={{ border: '2px dashed hsla(0,72%,50%,0.30)', background: 'hsla(0,72%,50%,0.03)' }}>
        <Upload size={28} style={{ color: 'hsl(0,72%,50%)' }} />
        <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Upload PDFs to Merge</span>
        <input type="file" accept=".pdf" multiple className="hidden" onChange={onFiles} />
      </label>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'hsla(0,72%,50%,0.06)', border: '1px solid hsla(0,72%,50%,0.18)' }}>
              <span className="text-xs font-medium truncate max-w-[220px]" style={{ color: 'hsl(226,35%,35%)' }}>📄 {f.name}</span>
              <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: 'hsl(0,72%,50%)', background: 'hsla(0,72%,50%,0.08)' }}>✕</button>
            </div>
          ))}
          <div className="rounded-xl p-4 text-center space-y-2" style={{ background: 'hsla(38,92%,50%,0.08)', border: '1.5px solid hsla(38,92%,50%,0.22)' }}>
            <p className="text-sm font-bold" style={{ color: 'hsl(38,92%,38%)' }}>💡 Pro Tip</p>
            <p className="text-xs" style={{ color: 'hsl(226,35%,45%)' }}>To merge PDFs use <strong>ilovepdf.com</strong> or <strong>smallpdf.com</strong> — they offer free merging with drag & drop.</p>
            <a href="https://ilovepdf.com/merge_pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold mt-1"
              style={{ background: 'hsl(0,72%,50%)', color: 'white' }}>
              Open PDF Merger <ArrowRight size={12} />
            </a>
          </div>
        </div>
      )}
      {!files.length && (
        <div className="rounded-xl p-4 text-center space-y-2" style={{ background: 'hsla(0,72%,50%,0.06)', border: '1.5px solid hsla(0,72%,50%,0.18)' }}>
          <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>Upload your PDFs above to get started, or use the quick links below:</p>
          <div className="flex gap-2 justify-center flex-wrap mt-2">
            {[['ilovepdf.com', 'https://ilovepdf.com/merge_pdf'], ['smallpdf.com', 'https://smallpdf.com/merge-pdf'], ['pdf2go.com', 'https://www.pdf2go.com/merge-pdf']].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'hsla(0,72%,50%,0.10)', color: 'hsl(0,72%,40%)', border: '1px solid hsla(0,72%,50%,0.22)' }}>{label}</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PdfCompressTool = () => (
  <div className="space-y-4">
    <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: 'linear-gradient(135deg, hsla(200,90%,45%,0.06), hsla(258,78%,55%,0.06))', border: '1.5px solid hsla(200,90%,45%,0.20)' }}>
      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'hsla(200,90%,45%,0.12)', border: '1.5px solid hsla(200,90%,45%,0.25)' }}>
        <Minimize2 size={24} style={{ color: 'hsl(200,90%,45%)' }} />
      </div>
      <h3 className="font-bold" style={{ color: 'hsl(226,35%,18%)' }}>PDF Compress</h3>
      <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>Compress PDF files online — free, fast and secure.</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {[['ilovepdf.com', 'https://ilovepdf.com/compress_pdf'], ['smallpdf.com', 'https://smallpdf.com/compress-pdf'], ['pdf2go.com', 'https://www.pdf2go.com/compress-pdf']].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'hsl(200,90%,45%)', color: 'white' }}>{label} <ArrowRight size={12} /></a>
        ))}
      </div>
    </div>
  </div>
);

const PdfSplitTool = () => (
  <div className="space-y-4">
    <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: 'linear-gradient(135deg, hsla(38,92%,50%,0.06), hsla(258,78%,55%,0.06))', border: '1.5px solid hsla(38,92%,50%,0.20)' }}>
      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'hsla(38,92%,50%,0.12)', border: '1.5px solid hsla(38,92%,50%,0.25)' }}>
        <SplitSquareVertical size={24} style={{ color: 'hsl(38,92%,45%)' }} />
      </div>
      <h3 className="font-bold" style={{ color: 'hsl(226,35%,18%)' }}>PDF Split</h3>
      <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>Split a PDF into separate pages or page ranges online.</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {[['ilovepdf.com', 'https://ilovepdf.com/split_pdf'], ['smallpdf.com', 'https://smallpdf.com/split-pdf'], ['pdf2go.com', 'https://www.pdf2go.com/split-pdf']].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'hsl(38,92%,45%)', color: 'white' }}>{label} <ArrowRight size={12} /></a>
        ))}
      </div>
    </div>
  </div>
);

const PdfLockTool = () => (
  <div className="space-y-4">
    <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.06), hsla(162,72%,38%,0.06))', border: '1.5px solid hsla(258,78%,55%,0.20)' }}>
      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'hsla(258,78%,55%,0.12)', border: '1.5px solid hsla(258,78%,55%,0.25)' }}>
        <FileLock2 size={24} style={{ color: 'hsl(258,78%,55%)' }} />
      </div>
      <h3 className="font-bold" style={{ color: 'hsl(226,35%,18%)' }}>PDF Lock / Unlock</h3>
      <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>Add password protection or remove it from your PDF files.</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {[['Protect PDF', 'https://ilovepdf.com/protect_pdf'], ['Unlock PDF', 'https://ilovepdf.com/unlock_pdf'], ['smallpdf.com', 'https://smallpdf.com/protect-pdf']].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'hsl(258,78%,55%)', color: 'white' }}>{label} <ArrowRight size={12} /></a>
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// TOOL REGISTRY — categorized
// ═══════════════════════════════════════════════════════════════════════════
type ToolDef = { id: string; icon: React.ReactNode; title: string; subtitle: string; color: string; badge?: string; component: React.ReactNode };
type Category = { id: string; label: string; emoji: string; color: string; tools: ToolDef[] };

const CATEGORIES: Category[] = [
  {
    id: 'utility', label: 'Utility Tools', emoji: '⚙️', color: 'hsl(258,78%,55%)',
    tools: [
      { id: 'password-gen', icon: <Shield size={20} />, title: 'Password Generator', subtitle: 'Generate strong secure passwords', color: 'hsl(162,72%,38%)', badge: 'Secure', component: <PasswordGenerator /> },
      { id: 'case-converter', icon: <Type size={20} />, title: 'Case Converter', subtitle: 'Convert text case easily', color: 'hsl(200,90%,45%)', component: <CaseConverter /> },
      { id: 'age-calculator', icon: <Clock size={20} />, title: 'Age Calculator', subtitle: 'Exact age in years, months & days', color: 'hsl(38,92%,50%)', component: <AgeCalculator /> },
      { id: 'profit-calculator', icon: <DollarSign size={20} />, title: 'Profit Calculator', subtitle: 'Calculate profit, loss & margin', color: 'hsl(162,72%,38%)', component: <ProfitCalculator /> },
      { id: 'url-encoder', icon: <Link2 size={20} />, title: 'URL Encoder/Decoder', subtitle: 'Encode & decode URLs', color: 'hsl(258,78%,55%)', component: <UrlEncoder /> },
      { id: 'base64', icon: <FileText size={20} />, title: 'Base64 Encoder', subtitle: 'Convert text to Base64', color: 'hsl(330,85%,55%)', component: <Base64Tool /> },
      { id: 'qr-generator', icon: <QrCode size={20} />, title: 'QR Code Generator', subtitle: 'Create custom color QR codes', color: 'hsl(258,78%,55%)', badge: 'New', component: <QrGenerator /> },
      { id: 'hashtag-gen', icon: <Hash size={20} />, title: 'Hashtag Generator', subtitle: 'Generate hashtags with AI', color: 'hsl(200,90%,45%)', badge: 'AI', component: <HashtagGenerator /> },
    ]
  },
  {
    id: 'image', label: 'Image Tools', emoji: '🖼️', color: 'hsl(200,90%,45%)',
    tools: [
      { id: 'img-resizer', icon: <Maximize2 size={20} />, title: 'Image Resizer', subtitle: 'Resize images to custom dimensions', color: 'hsl(200,90%,45%)', badge: 'New', component: <ImageResizer /> },
      { id: 'img-converter', icon: <RotateCcw size={20} />, title: 'Image Converter', subtitle: 'Convert PNG ↔ JPG ↔ WebP', color: 'hsl(258,78%,55%)', badge: 'New', component: <ImageConverter /> },
      { id: 'img-compressor', icon: <Scissors size={20} />, title: 'Image Compressor', subtitle: 'Reduce image size, keep quality', color: 'hsl(38,92%,50%)', badge: 'New', component: <ImageCompressor /> },
      { id: 'img-blur', icon: <Droplets size={20} />, title: 'Image Blur Tool', subtitle: 'Blur images easily', color: 'hsl(162,72%,38%)', badge: 'New', component: <ImageBlurTool /> },
      { id: 'watermark', icon: <Stamp size={20} />, title: 'Watermark Tool', subtitle: 'Add text watermarks to images', color: 'hsl(258,78%,55%)', badge: 'New', component: <WatermarkTool /> },
      { id: 'meme-gen', icon: <Laugh size={20} />, title: 'Meme Generator', subtitle: 'Create funny memes instantly', color: 'hsl(38,92%,50%)', badge: 'New', component: <MemeGenerator /> },
      { id: 'thumbnail-maker', icon: <Film size={20} />, title: 'Thumbnail Maker', subtitle: 'Create YouTube/Social thumbnails', color: 'hsl(200,90%,45%)', badge: 'New', component: <ThumbnailMaker /> },
    ]
  },
  {
    id: 'social', label: 'Social Media', emoji: '📱', color: 'hsl(330,85%,55%)',
    tools: [
      { id: 'fb-caption', icon: <Facebook size={20} />, title: 'Facebook Caption', subtitle: 'AI-powered engaging FB captions', color: 'hsl(200,90%,45%)', badge: 'AI', component: <FacebookCaptionGen /> },
      { id: 'tiktok-caption', icon: <Zap size={20} />, title: 'TikTok Caption', subtitle: 'Viral TikTok captions generator', color: 'hsl(330,85%,55%)', badge: 'AI', component: <TikTokCaptionGen /> },
      { id: 'yt-title', icon: <Youtube size={20} />, title: 'YouTube Title', subtitle: 'SEO-optimized YouTube titles', color: 'hsl(0,72%,50%)', badge: 'AI', component: <YoutubeTitleGen /> },
      { id: 'bio-gen', icon: <AtSign size={20} />, title: 'Bio Generator', subtitle: 'Create FB/Instagram bio', color: 'hsl(258,78%,55%)', badge: 'AI', component: <BioGen /> },
      { id: 'hashtag-social', icon: <Hash size={20} />, title: 'Hashtag Generator', subtitle: 'Generate trending hashtags', color: 'hsl(200,90%,45%)', badge: 'AI', component: <HashtagGenerator /> },
    ]
  },
  {
    id: 'ai', label: 'AI Content Writer', emoji: '🤖', color: 'hsl(162,72%,38%)',
    tools: [
      { id: 'blog-writer', icon: <BookOpen size={20} />, title: 'Blog Writer', subtitle: 'Generate full blog posts with AI', color: 'hsl(258,78%,55%)', badge: 'AI', component: <BlogWriterTool /> },
      { id: 'ad-copy', icon: <TrendingUp size={20} />, title: 'Ad Copy Generator', subtitle: 'Create compelling ad copy', color: 'hsl(38,92%,50%)', badge: 'AI', component: <AdCopyGen /> },
      { id: 'product-desc', icon: <Tag size={20} />, title: 'Product Description', subtitle: 'Generate product descriptions', color: 'hsl(162,72%,38%)', badge: 'AI', component: <ProductDescGen /> },
      { id: 'email-writer', icon: <Mail size={20} />, title: 'Email Writer', subtitle: 'Formal & marketing emails', color: 'hsl(200,90%,45%)', badge: 'AI', component: <EmailWriterTool /> },
      { id: 'resume-gen', icon: <Briefcase size={20} />, title: 'Resume Generator', subtitle: 'Professional resume drafts', color: 'hsl(330,85%,55%)', badge: 'AI', component: <ResumeGen /> },
      { id: 'grammar-fix', icon: <Check size={20} />, title: 'Grammar Fixer', subtitle: 'Fix English grammar errors', color: 'hsl(162,72%,38%)', badge: 'AI', component: <GrammarFixer /> },
      { id: 'paraphrase', icon: <RotateCcw size={20} />, title: 'Paraphrasing Tool', subtitle: 'Rewrite text in a new way', color: 'hsl(258,78%,55%)', badge: 'AI', component: <Paraphraser /> },
      { id: 'summarize', icon: <FileText size={20} />, title: 'Text Summarizer', subtitle: 'Summarize long content', color: 'hsl(38,92%,50%)', badge: 'AI', component: <TextSummarizer /> },
      { id: 'seo-meta', icon: <Search size={20} />, title: 'SEO Meta Generator', subtitle: 'Generate title & meta description', color: 'hsl(200,90%,45%)', badge: 'AI', component: <SeoMetaGen /> },
      { id: 'business-name', icon: <Globe size={20} />, title: 'Business Name Generator', subtitle: 'Business name & domain ideas', color: 'hsl(162,72%,38%)', badge: 'AI', component: <BusinessNameGen /> },
      { id: 'keyword-gen', icon: <Tag size={20} />, title: 'Keyword Generator', subtitle: 'Generate SEO keywords', color: 'hsl(258,78%,55%)', badge: 'AI', component: <KeywordGen /> },
    ]
  },
  {
    id: 'pdf', label: 'PDF Tools', emoji: '📄', color: 'hsl(0,72%,50%)',
    tools: [
      { id: 'pdf-merge', icon: <Combine size={20} />, title: 'PDF Merge', subtitle: 'Merge multiple PDFs into one', color: 'hsl(0,72%,50%)', badge: 'New', component: <PdfMergeTool /> },
      { id: 'pdf-split', icon: <SplitSquareVertical size={20} />, title: 'PDF Split', subtitle: 'Split PDF into separate files', color: 'hsl(38,92%,50%)', badge: 'New', component: <PdfSplitTool /> },
      { id: 'pdf-compress', icon: <Minimize2 size={20} />, title: 'PDF Compress', subtitle: 'Reduce PDF file size', color: 'hsl(200,90%,45%)', badge: 'New', component: <PdfCompressTool /> },
      { id: 'img-to-pdf', icon: <FileImage size={20} />, title: 'Image to PDF', subtitle: 'Convert images to PDF', color: 'hsl(162,72%,38%)', badge: 'New', component: <ImageToPdf /> },
      { id: 'pdf-lock', icon: <FileLock2 size={20} />, title: 'PDF Lock/Unlock', subtitle: 'Add or remove PDF password', color: 'hsl(258,78%,55%)', badge: 'New', component: <PdfLockTool /> },
    ]
  },
];

// flatten for easy lookup
const ALL_TOOLS = CATEGORIES.flatMap(c => c.tools);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
const FreeTools = () => {
  const { toolId } = useParams<{ toolId?: string }>();
  const navigate = useNavigate();
  const activeTool = toolId ?? null;

  const activeTolObj = ALL_TOOLS.find(t => t.id === activeTool);
  const setActiveTool = (id: string | null) => {
    if (id) navigate(`/free-tools/${id}`);
    else navigate('/free-tools');
  };

  const initialCat = activeTolObj
    ? CATEGORIES.find(c => c.tools.some(t => t.id === activeTolObj.id))?.id ?? 'ai'
    : 'ai';
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeTolObj) {
      const catId = CATEGORIES.find(c => c.tools.some(t => t.id === activeTolObj.id))?.id;
      if (catId) setActiveCategory(catId);
    }
  }, [activeTolObj?.id]);

  const currentCat = CATEGORIES.find(c => c.id === activeCategory)!;
  const filteredTools = search.trim()
    ? ALL_TOOLS.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.subtitle.toLowerCase().includes(search.toLowerCase()))
    : currentCat.tools;
  const totalTools = ALL_TOOLS.length;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <SEOHead
        title={activeTolObj ? `${activeTolObj.title} — Free Online Tool | Shahed Store` : 'Free Online Tools | Shahed Store'}
        description={activeTolObj ? `${activeTolObj.subtitle}. 100% free, no signup required.` : '100% free — Image Resizer, QR Generator, AI Caption, Hashtag Generator, Password Generator and 40+ more tools.'}
        canonical={`https://shahedstore.com.bd/free-tools${activeTool ? '/' + activeTool : ''}`}
      />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 px-4"
        style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.07) 0%, hsla(200,90%,45%,0.05) 50%, hsla(162,72%,38%,0.06) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: 'hsla(162,72%,38%,0.10)', border: '1.5px solid hsla(162,72%,38%,0.25)', color: 'hsl(162,72%,30%)' }}>
            <Gift size={14} />Completely Free — {totalTools}+ Tools
          </div>
          <h1 className="font-sora font-black text-4xl sm:text-5xl leading-tight" style={{ color: 'hsl(226,35%,12%)' }}>
            Free Online <span style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tools</span>
          </h1>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'hsl(226,35%,40%)' }}>
            Image, AI, PDF, Social Media and all essential tools — no account or payment required
          </p>
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'hsl(258,78%,55%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm"
              style={{ background: 'hsla(0,0%,100%,0.85)', backdropFilter: 'blur(12px)', border: '1.5px solid hsla(258,78%,55%,0.22)', color: 'hsl(226,35%,18%)', outline: 'none' }} />
          </div>
        </div>
      </section>

      <section className="container-fluid py-12">
        {activeTool ? (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setActiveTool(null)}
              className="flex items-center gap-2 mb-8 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ color: 'hsl(226,35%,40%)', background: 'hsla(226,35%,50%,0.08)', border: '1px solid hsla(226,35%,50%,0.15)' }}>
              <ChevronLeft size={16} />All Tools
            </button>
            {activeTolObj && (
              <div className="rounded-3xl overflow-hidden"
                style={{
                  ...glass(activeTolObj.color),
                  boxShadow: `0 8px 48px ${activeTolObj.color.replace('hsl(', 'hsla(').replace(')', ',0.15)')}`,
                }}>
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
            <div className="mt-8">
              <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(226,35%,40%)' }}>Other Tools:</p>
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
          <div className="space-y-8">
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
            {!search.trim() && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentCat.emoji}</span>
                <div>
                  <h2 className="font-sora font-black text-xl" style={{ color: 'hsl(226,35%,14%)' }}>{currentCat.label}</h2>
                  <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>{currentCat.tools.length} tools available</p>
                </div>
              </div>
            )}
            {search.trim() && (
              <p className="text-sm font-semibold" style={{ color: 'hsl(226,35%,45%)' }}>
                {filteredTools.length} result(s) for "{search}"
              </p>
            )}
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
                  {/* shimmer line top */}
                  <div className="absolute top-0 left-4 right-4 h-px rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.35)')}, transparent)` }} />

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
                    Use Tool <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bottom CTA — Footer glassmorphism style */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16 relative overflow-hidden rounded-3xl"
        style={{
          background: 'hsla(0,0%,100%,0.72)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1.5px solid hsla(258,78%,75%,0.22)',
          boxShadow: '0 8px 40px hsla(258,78%,55%,0.10), inset 0 1px 0 hsla(0,0%,100%,0.80)',
        }}>

        {/* Background decorative blobs — same as footer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-80 h-64"
            style={{ background: 'radial-gradient(ellipse at 80% 0%, hsla(258,78%,55%,0.07), transparent 65%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-48"
            style={{ background: 'radial-gradient(ellipse at 0% 100%, hsla(200,90%,45%,0.06), transparent 65%)' }} />
          <div className="absolute inset-0 rounded-3xl"
            style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.035) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-8 py-14 text-center space-y-5">

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2"
            style={{
              background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))',
              boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)',
            }}>
            <Sparkles size={22} className="text-white" />
          </div>

          {/* Heading */}
          <h2 className="font-sora font-black text-3xl" style={{ color: 'hsl(226,35%,12%)' }}>
            More Tools Coming Soon!
          </h2>

          {/* Sub text */}
          <p className="text-base max-w-xl mx-auto" style={{ color: 'hsl(226,35%,45%)' }}>
            PDF Tools, Background Remover, Meme Generator and many more tools will be added soon. Have a suggestion? Let us know!
          </p>

          {/* Buttons — footer chip style */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a href="/contact"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105"
              style={{
                background: 'hsla(0,0%,100%,0.70)',
                backdropFilter: 'blur(10px)',
                color: 'hsl(258,78%,45%)',
                border: '1px solid hsla(258,78%,75%,0.35)',
                boxShadow: '0 1px 4px hsla(226,35%,12%,0.05)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsla(258,78%,55%,0.08)'; e.currentTarget.style.boxShadow = '0 2px 10px hsla(258,78%,55%,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'hsla(0,0%,100%,0.70)'; e.currentTarget.style.boxShadow = '0 1px 4px hsla(226,35%,12%,0.05)'; }}>
              Suggest a Tool <ArrowRight size={14} />
            </a>
            <a href="/shop"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))',
                color: 'white',
                border: '1px solid hsla(258,78%,75%,0.30)',
                boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)',
              }}>
              Browse Products <ArrowRight size={14} />
            </a>
          </div>

          {/* Status badge — like footer */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'hsla(162,72%,38%,0.08)', border: '1px solid hsla(162,72%,38%,0.20)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-fira font-medium" style={{ color: 'hsl(162,72%,30%)' }}>New tools added regularly</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default FreeTools;
