import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles, Loader2, Plus, Trash2, Play, X, BookOpen,
  CheckCircle2, AlertCircle, ExternalLink, Zap, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// Seeded topic library — Bangladesh-focused informational SEO targets.
const SEED_TOPICS: { title: string; intent: string }[] = [
  // User-requested examples
  { title: 'Windows 11 Pro vs Home — কোনটা কিনবেন বাংলাদেশে?', intent: 'comparison' },
  { title: 'Best Antivirus in Bangladesh 2026 — Top 10 Reviewed', intent: 'best-of' },
  { title: 'ChatGPT Plus বাংলাদেশে কিভাবে কিনবেন (Full Guide)', intent: 'how-to' },
  { title: 'Adobe Photoshop Original License Guide for Bangladesh', intent: 'how-to' },
  { title: 'Netflix Premium BD Price 2026 — All Plans & Payment Methods', intent: 'pricing' },
  { title: 'Best VPN for Bangladesh 2026 — Speed, Price & Privacy Compared', intent: 'best-of' },
  // High-value extensions
  { title: 'Office 365 vs Office 2021 — Bangladeshi Users এর জন্য কোনটি Best?', intent: 'comparison' },
  { title: 'IDM Lifetime Key বাংলাদেশে — Genuine vs Crack পার্থক্য', intent: 'how-to' },
  { title: 'Spotify Premium BD Price & কিভাবে Activate করবেন', intent: 'pricing' },
  { title: 'YouTube Premium Bangladesh — Family Plan Setup Guide', intent: 'how-to' },
  { title: 'Canva Pro বাংলাদেশে কিভাবে কিনবেন — Step by Step', intent: 'how-to' },
  { title: 'Grammarly Premium Bangladesh Price & Features Review', intent: 'pricing' },
  { title: 'Best Cloud Storage in Bangladesh — Google Drive vs OneDrive vs Dropbox', intent: 'comparison' },
  { title: 'Windows 10 to Windows 11 Upgrade Guide for Bangladesh', intent: 'how-to' },
  { title: 'Best Free vs Paid Antivirus — কোনটা আপনার জন্য?', intent: 'comparison' },
  { title: 'বাংলাদেশে Disney+ Hotstar কিভাবে দেখবেন (2026)', intent: 'how-to' },
  { title: 'Microsoft Office Bangladesh Price — Student, Home & Business Plans', intent: 'pricing' },
  { title: 'Best AI Tools for Students in Bangladesh 2026', intent: 'best-of' },
  { title: 'ESET, Kaspersky, Bitdefender — Bangladesh এ কোনটা Best?', intent: 'comparison' },
  { title: 'How to Buy Software with bKash in Bangladesh — Safe Guide', intent: 'how-to' },
];

type QueueItem = {
  id: string;
  title: string;
  intent: string;
  status: 'queued' | 'running' | 'success' | 'skipped' | 'error';
  message?: string;
  blog_slug?: string;
};

const AdminBlogTopics = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [autoPublish, setAutoPublish] = useState(false);
  const [singleTopic, setSingleTopic] = useState('');
  const [singleIntent, setSingleIntent] = useState('informational');
  const [singleGenerating, setSingleGenerating] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('blog_categories').select('id, name, slug').order('name').then(({ data }) => setCategories(data || []));
    refreshRecent();
  }, []);

  const refreshRecent = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    setRecentBlogs(data || []);
  };

  const generate = async (title: string, intent: string): Promise<QueueItem> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/generate-topic-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topic: title,
          intent,
          category_id: selectedCategory || null,
          auto_publish: autoPublish,
        }),
      });
      const j = await res.json();
      if (j.error) return { id: '', title, intent, status: 'error', message: j.error };
      if (j.status === 'skipped') return { id: '', title, intent, status: 'skipped', message: j.message, blog_slug: j.existing?.slug };
      return { id: j.blog_id, title, intent, status: 'success', blog_slug: j.slug, message: `${j.word_count}w • ${j.faq_count} FAQs` };
    } catch (err: any) {
      return { id: '', title, intent, status: 'error', message: err.message };
    }
  };

  const handleSingle = async () => {
    if (!singleTopic.trim()) return;
    setSingleGenerating(true);
    const result = await generate(singleTopic.trim(), singleIntent);
    setSingleGenerating(false);
    if (result.status === 'success') {
      toast.success(`Blog created: ${result.title}`);
      setSingleTopic('');
      refreshRecent();
    } else if (result.status === 'skipped') {
      toast.info(result.message || 'Already exists');
    } else {
      toast.error(result.message || 'Generation failed');
    }
  };

  const addSeedsToQueue = () => {
    const newItems: QueueItem[] = SEED_TOPICS.map((t, i) => ({
      id: `seed-${Date.now()}-${i}`,
      title: t.title,
      intent: t.intent,
      status: 'queued',
    }));
    setQueue((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length} seed topics added`);
  };

  const addBulkToQueue = () => {
    const lines = bulkInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const newItems: QueueItem[] = lines.map((line, i) => ({
      id: `bulk-${Date.now()}-${i}`,
      title: line,
      intent: 'informational',
      status: 'queued',
    }));
    setQueue((prev) => [...prev, ...newItems]);
    setBulkInput('');
    toast.success(`${newItems.length} topics added to queue`);
  };

  const removeFromQueue = (id: string) => setQueue((prev) => prev.filter((q) => q.id !== id));
  const clearQueue = () => setQueue([]);

  const runQueue = async () => {
    const targets = queue.filter((q) => q.status === 'queued' || q.status === 'error');
    if (targets.length === 0) { toast.info('Queue is empty'); return; }
    if (!confirm(`Generate ${targets.length} blog post${targets.length === 1 ? '' : 's'}? This may take ~${Math.ceil(targets.length * 15 / 60)} minutes.`)) return;

    cancelRef.current = false;
    setRunning(true);

    for (const item of targets) {
      if (cancelRef.current) break;
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'running' } : q)));
      const result = await generate(item.title, item.intent);
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, ...result, id: q.id } : q)));
      await new Promise((r) => setTimeout(r, 2000));
    }

    setRunning(false);
    refreshRecent();
    const done = queue.filter((q) => q.status === 'success').length;
    toast.success(`Queue finished: ${done} created`);
  };

  const stats = {
    queued: queue.filter((q) => q.status === 'queued').length,
    success: queue.filter((q) => q.status === 'success').length,
    error: queue.filter((q) => q.status === 'error').length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="text-primary" /> AI Blog Topics (Aggressive SEO)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate 1500-2500 word informational blog posts targeting Google Bangladesh + ChatGPT/Perplexity/AI Overview. Each post includes TL;DR, comparison tables, step-by-step guides, and 6-10 FAQ items.
        </p>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-border bg-card p-4 grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Blog Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">— Uncategorized —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} className="w-4 h-4" />
            Auto-publish (skip draft)
          </label>
        </div>
      </div>

      {/* Single topic generator */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><FileText size={16} /> Generate Single Blog</h3>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={singleTopic}
            onChange={(e) => setSingleTopic(e.target.value)}
            placeholder='e.g. "Windows 11 Pro vs Home বাংলাদেশে"'
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSingle(); }}
          />
          <select
            value={singleIntent}
            onChange={(e) => setSingleIntent(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="informational">Informational</option>
            <option value="comparison">Comparison (vs)</option>
            <option value="how-to">How-To Guide</option>
            <option value="best-of">Best-Of List</option>
            <option value="pricing">Pricing</option>
          </select>
          <button
            onClick={handleSingle}
            disabled={singleGenerating || !singleTopic.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {singleGenerating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
            Generate
          </button>
        </div>
      </div>

      {/* Bulk queue */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><BookOpen size={16} /> Bulk Queue</h3>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-muted">{stats.queued} queued</span>
            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">{stats.success} done</span>
            {stats.error > 0 && <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive">{stats.error} failed</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={addSeedsToQueue}
            disabled={running}
            className="px-3 py-2 rounded-lg border border-primary/50 text-primary hover:bg-primary/5 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={14} /> Add 20 Bangladesh SEO Seed Topics
          </button>
          <button
            onClick={runQueue}
            disabled={running || queue.length === 0}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {running ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
            Run Queue ({queue.filter((q) => q.status === 'queued' || q.status === 'error').length})
          </button>
          {running && (
            <button
              onClick={() => { cancelRef.current = true; }}
              className="px-3 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 text-sm flex items-center gap-2"
            >
              <X size={14} /> Cancel
            </button>
          )}
          {queue.length > 0 && !running && (
            <button onClick={clearQueue} className="px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm flex items-center gap-2">
              <Trash2 size={14} /> Clear Queue
            </button>
          )}
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">Add custom topics (one per line)</label>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={'How to install Office 365 in Bangladesh\nBest password manager for BD users\nWindows 11 system requirements explained'}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
          />
          <button
            onClick={addBulkToQueue}
            disabled={!bulkInput.trim()}
            className="mt-2 px-3 py-1.5 rounded-lg border border-border hover:bg-accent text-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={12} /> Add to queue
          </button>
        </div>

        {queue.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="text-left">
                  <th className="p-2 font-semibold">Topic</th>
                  <th className="p-2 font-semibold">Intent</th>
                  <th className="p-2 font-semibold">Status</th>
                  <th className="p-2 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id} className="border-t border-border">
                    <td className="p-2">
                      <div className="font-medium">{q.title}</div>
                      {q.message && <div className="text-xs text-muted-foreground mt-0.5">{q.message}</div>}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{q.intent}</td>
                    <td className="p-2">
                      {q.status === 'queued' && <span className="text-xs text-muted-foreground">Queued</span>}
                      {q.status === 'running' && <span className="text-xs text-primary flex items-center gap-1"><Loader2 className="animate-spin" size={11} /> Writing…</span>}
                      {q.status === 'success' && (
                        <a href={`/blog/${q.blog_slug}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 flex items-center gap-1 hover:underline">
                          <CheckCircle2 size={11} /> Done <ExternalLink size={10} />
                        </a>
                      )}
                      {q.status === 'skipped' && <span className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle size={11} /> Skipped</span>}
                      {q.status === 'error' && <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle size={11} /> Failed</span>}
                    </td>
                    <td className="p-2">
                      {!running && (
                        <button onClick={() => removeFromQueue(q.id)} className="p-1 rounded hover:bg-accent">
                          <X size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent blogs */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen size={16} /> Recent Blog Posts</h3>
        {recentBlogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blog posts yet.</p>
        ) : (
          <div className="space-y-2">
            {recentBlogs.map((b) => (
              <a
                key={b.id}
                href={`/blog/${b.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent text-sm"
              >
                <div>
                  <div className="font-medium">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                  {b.status}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlogTopics;
