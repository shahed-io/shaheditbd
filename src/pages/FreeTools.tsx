import { useState } from 'react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { FloatingButtons } from '@/components/store/Extras';
import SEOHead from '@/components/seo/SEOHead';
import {
  Hash, FileText, Type, Clock, Calculator, Link2, Image,
  Copy, Check, RefreshCw, Trash2, ArrowRight, Sparkles, Zap, Gift, Shield
} from 'lucide-react';

// ──────────────────────────────────────────────
// Individual Tool Components
// ──────────────────────────────────────────────

const WordCounter = () => {
  const [text, setText] = useState('');
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="এখানে আপনার টেক্সট লিখুন বা পেস্ট করুন..."
        rows={6}
        className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all"
        style={{
          background: 'hsla(258,78%,55%,0.04)',
          border: '1.5px solid hsla(258,78%,55%,0.18)',
          color: 'hsl(226,35%,18%)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px hsla(258,78%,55%,0.08)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.18)'; e.currentTarget.style.boxShadow = 'none'; }}
      />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'শব্দ', value: words },
          { label: 'অক্ষর', value: chars },
          { label: 'স্পেস ছাড়া', value: charsNoSpace },
          { label: 'বাক্য', value: sentences },
          { label: 'পড়ার সময়', value: `${readTime} মি.` },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 text-center"
            style={{ background: 'hsla(258,78%,55%,0.06)', border: '1px solid hsla(258,78%,55%,0.12)' }}>
            <p className="text-xl font-black" style={{ color: 'hsl(258,78%,50%)' }}>{stat.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'hsl(226,35%,45%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>
      {text && (
        <button onClick={() => setText('')}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all"
          style={{ color: 'hsl(0,72%,50%)', background: 'hsla(0,72%,50%,0.07)', border: '1px solid hsla(0,72%,50%,0.18)' }}>
          <Trash2 size={14} /> ক্লিয়ার করুন
        </button>
      )}
    </div>
  );
};

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNum, setUseNum] = useState(true);
  const [useSymbol, setUseSymbol] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let chars = '';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNum)   chars += '0123456789';
    if (useSymbol) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) { setPassword('কমপক্ষে একটি অপশন বেছে নিন'); return; }
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    setPassword(Array.from(arr).map(b => chars[b % chars.length]).join(''));
    setCopied(false);
  };

  const copy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = () => {
    const opts = [useUpper, useLower, useNum, useSymbol].filter(Boolean).length;
    if (length < 8 || opts < 2) return { label: 'দুর্বল', color: 'hsl(0,72%,50%)', w: '25%' };
    if (length < 12 || opts < 3) return { label: 'মোটামুটি', color: 'hsl(38,92%,50%)', w: '55%' };
    if (length < 16) return { label: 'ভালো', color: 'hsl(200,90%,45%)', w: '75%' };
    return { label: 'শক্তিশালী', color: 'hsl(162,72%,38%)', w: '100%' };
  };

  const s = strength();

  return (
    <div className="space-y-5">
      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'বড় হাতের (A-Z)', val: useUpper, set: setUseUpper },
          { label: 'ছোট হাতের (a-z)', val: useLower, set: setUseLower },
          { label: 'সংখ্যা (0-9)', val: useNum, set: setUseNum },
          { label: 'চিহ্ন (!@#$)', val: useSymbol, set: setUseSymbol },
        ].map(opt => (
          <label key={opt.label}
            className="flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all select-none"
            style={{
              background: opt.val ? 'hsla(258,78%,55%,0.08)' : 'hsla(226,35%,50%,0.05)',
              border: `1.5px solid ${opt.val ? 'hsla(258,78%,55%,0.30)' : 'hsla(226,35%,50%,0.12)'}`,
            }}>
            <input type="checkbox" className="hidden" checked={opt.val} onChange={e => opt.set(e.target.checked)} />
            <span className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: opt.val ? 'hsl(258,78%,55%)' : 'transparent', border: `2px solid ${opt.val ? 'hsl(258,78%,55%)' : 'hsl(226,35%,55%)'}` }}>
              {opt.val && <Check size={10} className="text-white" />}
            </span>
            <span className="text-xs font-medium" style={{ color: opt.val ? 'hsl(258,78%,45%)' : 'hsl(226,35%,40%)' }}>{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Length */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>দৈর্ঘ্য</span>
          <span className="font-black text-lg" style={{ color: 'hsl(258,78%,50%)' }}>{length}</span>
        </div>
        <input type="range" min={6} max={64} value={length} onChange={e => setLength(Number(e.target.value))}
          className="w-full accent-violet-600 cursor-pointer" />
      </div>

      {/* Strength */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium" style={{ color: 'hsl(226,35%,45%)' }}>
          <span>শক্তিমাত্রা</span>
          <span style={{ color: s.color }}>{s.label}</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: 'hsla(226,35%,50%,0.12)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: s.w, background: s.color }} />
        </div>
      </div>

      {/* Generate */}
      <button onClick={generate}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
        <span className="flex items-center justify-center gap-2"><RefreshCw size={14} /> পাসওয়ার্ড তৈরি করুন</span>
      </button>

      {/* Result */}
      {password && (
        <div className="flex items-center gap-2 p-4 rounded-xl"
          style={{ background: 'hsla(162,72%,38%,0.06)', border: '1.5px solid hsla(162,72%,38%,0.22)' }}>
          <code className="flex-1 text-sm font-mono break-all" style={{ color: 'hsl(226,35%,18%)' }}>{password}</code>
          <button onClick={copy}
            className="p-2 rounded-lg flex-shrink-0 transition-all"
            style={{ background: copied ? 'hsla(162,72%,38%,0.15)' : 'hsla(258,78%,55%,0.10)', color: copied ? 'hsl(162,72%,35%)' : 'hsl(258,78%,50%)' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      )}
    </div>
  );
};

const CaseConverter = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = (type: string) => {
    switch (type) {
      case 'upper': setResult(input.toUpperCase()); break;
      case 'lower': setResult(input.toLowerCase()); break;
      case 'title': setResult(input.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())); break;
      case 'sentence': setResult(input.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())); break;
      case 'alternate': setResult(input.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('')); break;
      case 'reverse': setResult(input.split('').reverse().join('')); break;
    }
    setCopied(false);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buttons = [
    { label: 'UPPER CASE', type: 'upper' },
    { label: 'lower case', type: 'lower' },
    { label: 'Title Case', type: 'title' },
    { label: 'Sentence case', type: 'sentence' },
    { label: 'aLtErNaTe', type: 'alternate' },
    { label: 'esreveR', type: 'reverse' },
  ];

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="কনভার্ট করতে চান এমন টেক্সট লিখুন..."
        rows={4}
        className="w-full rounded-xl p-4 text-sm resize-none outline-none"
        style={{ background: 'hsla(258,78%,55%,0.04)', border: '1.5px solid hsla(258,78%,55%,0.18)', color: 'hsl(226,35%,18%)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.55)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.18)'; }}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {buttons.map(btn => (
          <button key={btn.type} onClick={() => convert(btn.type)}
            className="py-2.5 px-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]"
            style={{ background: 'hsla(258,78%,55%,0.08)', color: 'hsl(258,78%,45%)', border: '1.5px solid hsla(258,78%,55%,0.20)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'hsla(258,78%,55%,0.16)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'hsla(258,78%,55%,0.08)'; }}>
            {btn.label}
          </button>
        ))}
      </div>
      {result && (
        <div className="p-4 rounded-xl relative"
          style={{ background: 'hsla(200,90%,45%,0.06)', border: '1.5px solid hsla(200,90%,45%,0.22)' }}>
          <p className="text-sm pr-10" style={{ color: 'hsl(226,35%,18%)' }}>{result}</p>
          <button onClick={copy}
            className="absolute top-3 right-3 p-2 rounded-lg transition-all"
            style={{ color: copied ? 'hsl(162,72%,35%)' : 'hsl(200,90%,42%)' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      )}
    </div>
  );
};

const AgeCalculator = () => {
  const [dob, setDob] = useState('');
  const [result, setResult] = useState<{ years: number; months: number; days: number; totalDays: number } | null>(null);

  const calculate = () => {
    if (!dob) return;
    const birth = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    if (days < 0) { months--; const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0); days += prevMonth.getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    setResult({ years, months, days, totalDays });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>জন্মতারিখ বেছে নিন</label>
        <input type="date" value={dob} onChange={e => setDob(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full rounded-xl p-3.5 text-sm outline-none"
          style={{ background: 'hsla(258,78%,55%,0.04)', border: '1.5px solid hsla(258,78%,55%,0.18)', color: 'hsl(226,35%,18%)' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.55)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.18)'; }}
        />
      </div>
      <button onClick={calculate}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
        বয়স হিসাব করুন
      </button>
      {result && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'বছর', value: result.years, color: 'hsl(258,78%,50%)' },
            { label: 'মাস', value: result.months, color: 'hsl(200,90%,42%)' },
            { label: 'দিন', value: result.days, color: 'hsl(162,72%,38%)' },
            { label: 'মোট দিন', value: result.totalDays.toLocaleString('bn-BD'), color: 'hsl(38,92%,50%)' },
          ].map(r => (
            <div key={r.label} className="rounded-xl p-4 text-center"
              style={{ background: r.color.replace('hsl(', 'hsla(').replace(')', ',0.07)'), border: `1.5px solid ${r.color.replace('hsl(', 'hsla(').replace(')', ',0.20)')}` }}>
              <p className="text-3xl font-black" style={{ color: r.color }}>{r.value}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: 'hsl(226,35%,45%)' }}>{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UrlEncoder = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const process = () => {
    setError('');
    try {
      setResult(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch {
      setError('ভুল ইনপুট — ডিকোড করা সম্ভব হয়নি');
    }
    setCopied(false);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(''); setError(''); }}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: mode === m ? 'hsl(258,78%,55%)' : 'transparent',
              color: mode === m ? 'white' : 'hsl(258,78%,50%)',
            }}>
            {m === 'encode' ? 'Encode' : 'Decode'}
          </button>
        ))}
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={mode === 'encode' ? 'URL এনকোড করতে এখানে লিখুন...' : 'ডিকোড করতে এনকোডেড URL দিন...'}
        rows={4}
        className="w-full rounded-xl p-4 text-sm resize-none outline-none font-mono"
        style={{ background: 'hsla(258,78%,55%,0.04)', border: '1.5px solid hsla(258,78%,55%,0.18)', color: 'hsl(226,35%,18%)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.55)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.18)'; }}
      />
      <button onClick={process}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
        {mode === 'encode' ? 'Encode করুন' : 'Decode করুন'}
      </button>
      {error && <p className="text-sm font-medium" style={{ color: 'hsl(0,72%,50%)' }}>{error}</p>}
      {result && (
        <div className="p-4 rounded-xl relative"
          style={{ background: 'hsla(162,72%,38%,0.06)', border: '1.5px solid hsla(162,72%,38%,0.22)' }}>
          <p className="text-sm font-mono pr-10 break-all" style={{ color: 'hsl(226,35%,18%)' }}>{result}</p>
          <button onClick={copy}
            className="absolute top-3 right-3 p-2 rounded-lg transition-all"
            style={{ color: copied ? 'hsl(162,72%,35%)' : 'hsl(200,90%,42%)' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      )}
    </div>
  );
};

const Base64Tool = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const process = () => {
    setError('');
    try {
      setResult(mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input))));
    } catch {
      setError('ভুল ইনপুট — প্রসেস করা সম্ভব হয়নি');
    }
    setCopied(false);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'hsla(258,78%,55%,0.06)' }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(''); setError(''); }}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: mode === m ? 'hsl(258,78%,55%)' : 'transparent', color: mode === m ? 'white' : 'hsl(258,78%,50%)' }}>
            {m === 'encode' ? 'Encode' : 'Decode'}
          </button>
        ))}
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={mode === 'encode' ? 'টেক্সট Base64 তে রূপান্তর করতে লিখুন...' : 'Base64 থেকে ডিকোড করতে লিখুন...'}
        rows={4}
        className="w-full rounded-xl p-4 text-sm resize-none outline-none font-mono"
        style={{ background: 'hsla(258,78%,55%,0.04)', border: '1.5px solid hsla(258,78%,55%,0.18)', color: 'hsl(226,35%,18%)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.55)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.18)'; }}
      />
      <button onClick={process}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
        {mode === 'encode' ? 'Encode করুন' : 'Decode করুন'}
      </button>
      {error && <p className="text-sm font-medium" style={{ color: 'hsl(0,72%,50%)' }}>{error}</p>}
      {result && (
        <div className="p-4 rounded-xl relative"
          style={{ background: 'hsla(162,72%,38%,0.06)', border: '1.5px solid hsla(162,72%,38%,0.22)' }}>
          <p className="text-sm font-mono pr-10 break-all" style={{ color: 'hsl(226,35%,18%)' }}>{result}</p>
          <button onClick={copy}
            className="absolute top-3 right-3 p-2 rounded-lg transition-all"
            style={{ color: copied ? 'hsl(162,72%,35%)' : 'hsl(200,90%,42%)' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Tool Registry
// ──────────────────────────────────────────────

const TOOLS = [
  {
    id: 'word-counter',
    icon: <Hash size={22} />,
    title: 'ওয়ার্ড কাউন্টার',
    subtitle: 'শব্দ, অক্ষর ও পড়ার সময় গণনা',
    color: 'hsl(258,78%,55%)',
    badge: 'জনপ্রিয়',
    component: <WordCounter />,
  },
  {
    id: 'password-gen',
    icon: <Shield size={22} />,
    title: 'পাসওয়ার্ড জেনারেটর',
    subtitle: 'শক্তিশালী র‍্যান্ডম পাসওয়ার্ড তৈরি',
    color: 'hsl(162,72%,38%)',
    badge: 'সিকিউর',
    component: <PasswordGenerator />,
  },
  {
    id: 'case-converter',
    icon: <Type size={22} />,
    title: 'কেস কনভার্টার',
    subtitle: 'টেক্সটের কেস পরিবর্তন করুন',
    color: 'hsl(200,90%,45%)',
    badge: null,
    component: <CaseConverter />,
  },
  {
    id: 'age-calculator',
    icon: <Clock size={22} />,
    title: 'বয়স ক্যালকুলেটর',
    subtitle: 'সঠিক বয়স বছর, মাস ও দিনে',
    color: 'hsl(38,92%,50%)',
    badge: null,
    component: <AgeCalculator />,
  },
  {
    id: 'url-encoder',
    icon: <Link2 size={22} />,
    title: 'URL Encoder / Decoder',
    subtitle: 'URL এনকোড ও ডিকোড করুন',
    color: 'hsl(258,78%,55%)',
    badge: null,
    component: <UrlEncoder />,
  },
  {
    id: 'base64',
    icon: <FileText size={22} />,
    title: 'Base64 Encoder',
    subtitle: 'টেক্সট Base64 তে রূপান্তর',
    color: 'hsl(330,85%,55%)',
    badge: null,
    component: <Base64Tool />,
  },
];

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

const FreeTools = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const active = TOOLS.find(t => t.id === activeTool);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <SEOHead
        title="ফ্রি টুলস"
        description="Shahed Store এর ফ্রি অনলাইন টুলস — ওয়ার্ড কাউন্টার, পাসওয়ার্ড জেনারেটর, বয়স ক্যালকুলেটর, URL Encoder সহ আরও অনেক কিছু।"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4"
        style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.06) 0%, hsla(200,90%,45%,0.04) 50%, hsla(162,72%,38%,0.05) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: 'hsla(162,72%,38%,0.10)', border: '1.5px solid hsla(162,72%,38%,0.25)', color: 'hsl(162,72%,30%)' }}>
            <Gift size={14} /> সম্পূর্ণ বিনামূল্যে
          </div>
          <h1 className="font-sora font-black text-4xl sm:text-5xl leading-tight" style={{ color: 'hsl(226,35%,12%)' }}>
            ফ্রি অনলাইন <span style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>টুলস</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'hsl(226,35%,40%)' }}>
            আমাদের কাস্টমারদের জন্য সম্পূর্ণ বিনামূল্যে ব্যবহারযোগ্য দরকারি অনলাইন টুলস। কোনো একাউন্ট বা পেমেন্ট ছাড়াই ব্যবহার করুন।
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[`${TOOLS.length}টি টুলস`, 'রেজিস্ট্রেশন নেই', '১০০% ফ্রি', 'তাৎক্ষণিক'].map(tag => (
              <span key={tag} className="px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.18)', color: 'hsl(258,78%,45%)' }}>
                <Zap size={11} className="inline mr-1" />{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid + Detail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!activeTool ? (
          // ── Grid view ──
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map(tool => (
              <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                className="group relative text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, hsla(0,0%,100%,0.85) 0%, hsla(0,0%,100%,0.65) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: `1.5px solid ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.18)')}`,
                  boxShadow: `0 4px 24px ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.08)')}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.22)')}`;
                  (e.currentTarget as HTMLElement).style.borderColor = tool.color.replace('hsl(', 'hsla(').replace(')', ',0.40)');
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.08)')}`;
                  (e.currentTarget as HTMLElement).style.borderColor = tool.color.replace('hsl(', 'hsla(').replace(')', ',0.18)');
                }}>
                {tool.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full"
                    style={{ background: tool.color.replace('hsl(', 'hsla(').replace(')', ',0.12)'), color: tool.color, border: `1px solid ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.25)')}` }}>
                    {tool.badge}
                  </span>
                )}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.15)')}, ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.08)')})`,
                    border: `1.5px solid ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.25)')}`,
                    color: tool.color,
                  }}>
                  {tool.icon}
                </div>
                <h3 className="font-sora font-black text-lg mb-1.5" style={{ color: 'hsl(226,35%,14%)' }}>{tool.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(226,35%,45%)' }}>{tool.subtitle}</p>
                <div className="flex items-center gap-1.5 mt-4 text-sm font-bold transition-all"
                  style={{ color: tool.color }}>
                  ব্যবহার করুন <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          // ── Detail view ──
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setActiveTool(null)}
              className="flex items-center gap-2 mb-8 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ color: 'hsl(226,35%,40%)', background: 'hsla(226,35%,50%,0.08)', border: '1px solid hsla(226,35%,50%,0.15)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsla(258,78%,55%,0.08)'; e.currentTarget.style.color = 'hsl(258,78%,50%)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'hsla(226,35%,50%,0.08)'; e.currentTarget.style.color = 'hsl(226,35%,40%)'; }}>
              ← সব টুলস দেখুন
            </button>

            {active && (
              <div className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, hsla(0,0%,100%,0.92) 0%, hsla(0,0%,100%,0.78) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: `1.5px solid ${active.color.replace('hsl(', 'hsla(').replace(')', ',0.22)')}`,
                  boxShadow: `0 8px 48px ${active.color.replace('hsl(', 'hsla(').replace(')', ',0.14)')}`,
                }}>
                {/* Header */}
                <div className="p-6 border-b flex items-center gap-4"
                  style={{ borderColor: active.color.replace('hsl(', 'hsla(').replace(')', ',0.12)'), background: active.color.replace('hsl(', 'hsla(').replace(')', ',0.04)') }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${active.color.replace('hsl(', 'hsla(').replace(')', ',0.16)')}, ${active.color.replace('hsl(', 'hsla(').replace(')', ',0.08)')})`,
                      border: `1.5px solid ${active.color.replace('hsl(', 'hsla(').replace(')', ',0.30)')}`,
                      color: active.color,
                    }}>
                    {active.icon}
                  </div>
                  <div>
                    <h2 className="font-sora font-black text-xl" style={{ color: 'hsl(226,35%,12%)' }}>{active.title}</h2>
                    <p className="text-sm" style={{ color: 'hsl(226,35%,45%)' }}>{active.subtitle}</p>
                  </div>
                </div>
                {/* Tool body */}
                <div className="p-6">{active.component}</div>
              </div>
            )}

            {/* Other tools quick nav */}
            <div className="mt-8">
              <p className="text-sm font-semibold mb-4" style={{ color: 'hsl(226,35%,40%)' }}>অন্য টুলসগুলো:</p>
              <div className="flex flex-wrap gap-2">
                {TOOLS.filter(t => t.id !== activeTool).map(tool => (
                  <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: tool.color, background: tool.color.replace('hsl(', 'hsla(').replace(')', ',0.07)'), border: `1px solid ${tool.color.replace('hsl(', 'hsla(').replace(')', ',0.20)')}` }}
                    onMouseEnter={e => { e.currentTarget.style.background = tool.color.replace('hsl(', 'hsla(').replace(')', ',0.14)'); }}
                    onMouseLeave={e => { e.currentTarget.style.background = tool.color.replace('hsl(', 'hsla(').replace(')', ',0.07)'); }}>
                    {tool.icon}
                    <span>{tool.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16 rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,42%))', boxShadow: '0 12px 48px hsla(258,78%,55%,0.30)' }}>
        <div className="max-w-4xl mx-auto px-8 py-12 text-center text-white space-y-4">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'hsla(0,0%,100%,0.18)', backdropFilter: 'blur(12px)' }}>
            <Sparkles size={24} />
          </div>
          <h2 className="font-sora font-black text-3xl">আরও টুলস চান?</h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">নতুন কোনো টুল যোগ করলে ভালো হবে মনে করলে আমাদের জানান। আমরা আপনার পরামর্শ অনুযায়ী নতুন টুলস যোগ করব।</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a href="/contact"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'hsla(0,0%,100%,0.18)', backdropFilter: 'blur(12px)', border: '1.5px solid hsla(0,0%,100%,0.30)' }}>
              পরামর্শ দিন <ArrowRight size={14} />
            </a>
            <a href="/shop"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 text-white"
              style={{ background: 'hsla(0,0%,100%,0.25)', backdropFilter: 'blur(12px)', border: '1.5px solid hsla(0,0%,100%,0.40)' }}>
              আমাদের প্রোডাক্ট দেখুন <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default FreeTools;
