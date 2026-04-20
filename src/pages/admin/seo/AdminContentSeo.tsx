import { useState } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Eye } from 'lucide-react';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'shall',
  'can', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'i',
  'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'he', 'him',
  'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those',
]);

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const calcReadability = (text: string) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((acc, w) => {
    const s = w.toLowerCase().replace(/[^a-z]/g, '').replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
    return acc + Math.max(1, s?.length || 0);
  }, 0);
  const wordsPerSentence = words.length / Math.max(1, sentences.length);
  const syllablesPerWord = syllables / Math.max(1, words.length);
  // Flesch Reading Ease score
  const flesch = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  let level = '';
  if (flesch >= 90) level = 'Very Easy (5th grade)';
  else if (flesch >= 80) level = 'Easy (6th grade)';
  else if (flesch >= 70) level = 'Fairly Easy (7th grade)';
  else if (flesch >= 60) level = 'Standard (8-9th grade) ✅';
  else if (flesch >= 50) level = 'Fairly Difficult (10-12th)';
  else if (flesch >= 30) level = 'Difficult (College)';
  else level = 'Very Difficult';
  return { flesch: Math.max(0, Math.round(flesch)), level, wordsPerSentence: wordsPerSentence.toFixed(1), syllablesPerWord: syllablesPerWord.toFixed(2), totalWords: words.length, totalSentences: sentences.length };
};

const calcKeywordDensity = (text: string, focus: string) => {
  const cleaned = text.toLowerCase();
  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w) && /^[a-z\u0980-\u09FF]+$/.test(w));
  const counts: Record<string, number> = {};
  words.forEach(w => { counts[w] = (counts[w] || 0) + 1; });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const top = sorted.map(([word, count]) => ({ word, count, density: ((count / words.length) * 100).toFixed(2) }));

  let focusStats = null;
  if (focus.trim()) {
    const f = focus.trim().toLowerCase();
    const occurrences = (cleaned.match(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const density = words.length > 0 ? ((occurrences * f.split(/\s+/).length) / words.length) * 100 : 0;
    focusStats = { keyword: f, occurrences, density: density.toFixed(2), recommended: density >= 0.5 && density <= 2.5 };
  }

  return { totalWords: words.length, top, focusStats };
};

const analyzeStructure = (rawHtml: string) => {
  const h1 = (rawHtml.match(/<h1[^>]*>/gi) || []).length;
  const h2 = (rawHtml.match(/<h2[^>]*>/gi) || []).length;
  const h3 = (rawHtml.match(/<h3[^>]*>/gi) || []).length;
  const links = (rawHtml.match(/<a [^>]*href=/gi) || []).length;
  const images = (rawHtml.match(/<img [^>]*>/gi) || []).length;
  const imagesNoAlt = (rawHtml.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;
  return { h1, h2, h3, links, images, imagesNoAlt };
};

const AdminContentSeo = () => {
  const [content, setContent] = useState('');
  const [focus, setFocus] = useState('');
  const [title, setTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  const text = stripHtml(content);
  const readability = text.length > 50 ? calcReadability(text) : null;
  const keywords = text.length > 50 ? calcKeywordDensity(text, focus) : null;
  const structure = content.includes('<') ? analyzeStructure(content) : null;

  const titleLen = title.length;
  const descLen = metaDesc.length;
  const titleStatus = titleLen === 0 ? 'empty' : titleLen < 30 ? 'short' : titleLen > 60 ? 'long' : 'good';
  const descStatus = descLen === 0 ? 'empty' : descLen < 120 ? 'short' : descLen > 160 ? 'long' : 'good';

  const score = (() => {
    let s = 0; let max = 0;
    if (readability) { max += 20; if (readability.flesch >= 60) s += 20; else if (readability.flesch >= 50) s += 15; else s += 5; }
    if (keywords?.focusStats) { max += 20; if (keywords.focusStats.recommended) s += 20; else s += 5; }
    max += 15; if (titleStatus === 'good') s += 15; else if (titleStatus !== 'empty') s += 5;
    max += 15; if (descStatus === 'good') s += 15; else if (descStatus !== 'empty') s += 5;
    if (structure) { max += 30; if (structure.h1 === 1) s += 10; else if (structure.h1 === 0) s += 0; else s += 3; if (structure.h2 >= 2) s += 10; else s += 5; if (structure.images === 0 || structure.imagesNoAlt === 0) s += 10; else s += Math.max(0, 10 - structure.imagesNoAlt * 2); }
    return max ? Math.round((s / max) * 100) : 0;
  })();

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { color: string; label: string }> = {
      good: { color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', label: '✅ Good' },
      short: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: '⚠️ Too Short' },
      long: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: '⚠️ Too Long' },
      empty: { color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', label: '❌ Empty' },
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[status].color}`}>{map[status].label}</span>;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2"><Sparkles className="text-primary" size={24} /> Content SEO Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-1">প্রোডাক্ট ডেসক্রিপশন বা ব্লগ পোস্ট paste করুন — keyword density, readability ও SEO score real-time দেখুন।</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 border border-border">
            <label className="text-xs font-bold uppercase">Focus Keyword</label>
            <input type="text" value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. windows 11 key bangladesh" className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div className="glass-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase">SEO Title</label>
              <StatusBadge status={titleStatus} />
            </div>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Page title (50-60 chars)" className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <div className="text-[11px] text-muted-foreground mt-1">{titleLen}/60</div>
          </div>
          <div className="glass-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase">Meta Description</label>
              <StatusBadge status={descStatus} />
            </div>
            <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Meta description (140-160 chars)" rows={3} className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none" />
            <div className="text-[11px] text-muted-foreground mt-1">{descLen}/160</div>
          </div>
          <div className="glass-card rounded-xl p-4 border border-border">
            <label className="text-xs font-bold uppercase">Content (HTML or plain text)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your blog/product content here..." rows={14} className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
            <div className="text-[11px] text-muted-foreground mt-1">{text.split(/\s+/).filter(Boolean).length} words</div>
          </div>
        </div>

        {/* Analysis */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 text-center bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
            <div className="text-xs uppercase font-bold text-muted-foreground">Overall SEO Score</div>
            <div className={`text-5xl font-black mt-2 ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-500' : 'text-destructive'}`}>{score}</div>
            <div className="text-xs text-muted-foreground mt-1">/100</div>
          </div>

          {readability && (
            <div className="glass-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-sm flex items-center gap-2"><Eye size={14} /> Readability</h3>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><div className="text-[11px] text-muted-foreground">Flesch Score</div><div className="text-lg font-bold">{readability.flesch}</div></div>
                <div><div className="text-[11px] text-muted-foreground">Reading Level</div><div className="text-xs font-semibold">{readability.level}</div></div>
                <div><div className="text-[11px] text-muted-foreground">Words/Sentence</div><div className="text-sm font-semibold">{readability.wordsPerSentence}</div></div>
                <div><div className="text-[11px] text-muted-foreground">Syllables/Word</div><div className="text-sm font-semibold">{readability.syllablesPerWord}</div></div>
              </div>
            </div>
          )}

          {keywords?.focusStats && (
            <div className="glass-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-sm flex items-center gap-2"><Search size={14} /> Focus Keyword</h3>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">"{keywords.focusStats.keyword}"</div>
                  <div className="text-2xl font-bold mt-1">{keywords.focusStats.density}%</div>
                  <div className="text-[10px] text-muted-foreground">{keywords.focusStats.occurrences} occurrences</div>
                </div>
                {keywords.focusStats.recommended ?
                  <CheckCircle2 className="text-green-500" size={28} /> :
                  <AlertCircle className="text-amber-500" size={28} />}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">Recommended: 0.5% - 2.5%</div>
            </div>
          )}

          {keywords && keywords.top.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-sm flex items-center gap-2"><TrendingUp size={14} /> Top Keywords</h3>
              <div className="mt-3 space-y-1">
                {keywords.top.slice(0, 10).map(k => (
                  <div key={k.word} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                    <span className="font-mono">{k.word}</span>
                    <span className="text-muted-foreground">{k.count}× ({k.density}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {structure && (
            <div className="glass-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-sm">HTML Structure</h3>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className={`p-2 rounded ${structure.h1 === 1 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
                  <div className="text-lg font-bold">{structure.h1}</div>
                  <div className="text-[10px]">H1 (need 1)</div>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <div className="text-lg font-bold">{structure.h2}</div>
                  <div className="text-[10px]">H2</div>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <div className="text-lg font-bold">{structure.h3}</div>
                  <div className="text-[10px]">H3</div>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <div className="text-lg font-bold">{structure.links}</div>
                  <div className="text-[10px]">Links</div>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <div className="text-lg font-bold">{structure.images}</div>
                  <div className="text-[10px]">Images</div>
                </div>
                <div className={`p-2 rounded ${structure.imagesNoAlt === 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                  <div className="text-lg font-bold">{structure.imagesNoAlt}</div>
                  <div className="text-[10px]">No Alt</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContentSeo;
