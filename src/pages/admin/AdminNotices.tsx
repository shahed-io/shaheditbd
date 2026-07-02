// Admin Notices — list + AI-powered create/edit with voice input + invoice-style preview
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, Eye, Sparkles, Mic, MicOff, Loader2, Send, FileText, Printer, RotateCcw, Download, Megaphone, Pin, Users, CheckCircle2, FileEdit, Link2, Copy, ExternalLink, BellRing } from 'lucide-react';
import NoticeTemplate, { NoticeData } from '@/components/notices/NoticeTemplate';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import NoticeSignatureManager from '@/components/admin/NoticeSignatureManager';
import { loadNoticeSignature, type NoticeSignature, DEFAULT_NOTICE_SIGNATURE } from '@/lib/noticeSignature';
import { downloadNoticePdf } from '@/lib/noticePdf';
import SendToNotificationsDialog from '@/components/admin/SendToNotificationsDialog';

interface Notice extends NoticeData {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  pinned: boolean;
  updated_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim()
   .replace(/[^\w\s-]/g, '')
   .replace(/\s+/g, '-')
   .replace(/-+/g, '-')
   .slice(0, 80) || `notice-${Date.now()}`;

const blank = (sig?: { signedBy?: string; signedRole?: string }): Partial<Notice> => ({
  title: '',
  slug: '',
  summary: '',
  body: '',
  reference_no: `NTC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
  audience: 'public',
  status: 'draft',
  pinned: false,
  signed_by: sig?.signedBy || 'Shahed Store Authority',
  signed_role: sig?.signedRole || 'Management',
  effective_date: new Date().toISOString().slice(0, 10),
});

export default function AdminNotices() {
  const [list, setList] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Notice> | null>(null);
  const [previewing, setPreviewing] = useState<Notice | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'formal' | 'friendly' | 'urgent'>('formal');
  const [aiLang, setAiLang] = useState<'bn' | 'en'>('bn');
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notifyNotice, setNotifyNotice] = useState<Notice | null>(null);
  const [signature, setSignature] = useState<NoticeSignature>(DEFAULT_NOTICE_SIGNATURE);

  useEffect(() => { loadNoticeSignature().then(setSignature); }, []);

  const voice = useVoiceRecognition({ lang: aiLang === 'bn' ? 'bn-BD' : 'en-US' });

  // Append voice transcript into AI prompt
  useEffect(() => {
    if (voice.transcript) {
      setAiPrompt((prev) => (prev ? prev + ' ' + voice.transcript : voice.transcript));
      voice.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices').select('*')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) toast.error(error.message);
    setList((data as Notice[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(blank({ signedBy: signature.signedBy, signedRole: signature.signedRole })); setAiPrompt(''); };
  const openEdit = (n: Notice) => { setEditing({ ...n }); setAiPrompt(''); };

  const runAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Notice-এর বিস্তারিত লিখুন বা বলুন'); return; }
    setAiBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-generate-notice', {
        body: { prompt: aiPrompt, audience: editing?.audience || 'public', tone: aiTone, language: aiLang },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const n = data?.notice;
      if (!n) throw new Error('AI কোনো result দেয়নি');
      setEditing((prev) => ({
        ...(prev || {}),
        title: n.title || prev?.title || '',
        slug: prev?.slug || slugify(n.title || ''),
        summary: n.summary || prev?.summary || '',
        body: n.body_markdown || prev?.body || '',
        reference_no: n.reference_no || prev?.reference_no || '',
        signed_by: n.signed_by || prev?.signed_by || 'Shahed Store Authority',
        signed_role: n.signed_role || prev?.signed_role || 'Management',
        effective_date: n.effective_date || prev?.effective_date || new Date().toISOString().slice(0, 10),
      }));
      toast.success('AI notice তৈরি করেছে — preview tab-এ দেখুন');
    } catch (e: any) {
      toast.error(e?.message || 'AI generation ব্যর্থ হয়েছে');
    } finally {
      setAiBusy(false);
    }
  };

  const save = async (publish?: boolean) => {
    if (!editing) return;
    if (!editing.title || !editing.body) { toast.error('Title এবং body দরকার'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        title: editing.title,
        slug: editing.slug?.trim() || slugify(editing.title || ''),
        summary: editing.summary || null,
        body: editing.body,
        reference_no: editing.reference_no || null,
        audience: editing.audience || 'public',
        status: publish ? 'published' : (editing.status || 'draft'),
        pinned: !!editing.pinned,
        signed_by: editing.signed_by || null,
        signed_role: editing.signed_role || null,
        effective_date: editing.effective_date || null,
        published_at: publish ? new Date().toISOString() : ((editing as any).published_at ?? null),
      };
      if (!(editing as any).id) payload.created_by = user?.id || null;

      const { error } = (editing as any).id
        ? await supabase.from('notices').update(payload).eq('id', (editing as any).id)
        : await supabase.from('notices').insert(payload);
      if (error) throw error;
      toast.success(publish ? 'Notice published হয়েছে' : 'Notice save হয়েছে');
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Save ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (n: Notice) => {
    const next = n.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('notices').update({
      status: next,
      published_at: next === 'published' ? new Date().toISOString() : null,
    }).eq('id', n.id);
    if (error) return toast.error(error.message);
    toast.success(next === 'published' ? 'Published' : 'Unpublished');
    load();
  };

  const remove = async (n: Notice) => {
    if (!confirm(`"${n.title}" delete করবেন?`)) return;
    const { error } = await supabase.from('notices').delete().eq('id', n.id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const printPreview = () => {
    if (!previewing) return;
    window.print();
  };

  const downloadNotice = async (n: NoticeData & { id?: string; slug?: string }) => {
    try {
      setDownloadingId((n as any).id || 'preview');
      toast.info('PDF তৈরি হচ্ছে...');
      await downloadNoticePdf(n, {
        brand: { name: 'Shahed Store' },
        signatureUrl: signature.imageDataUrl || undefined,
      });
      toast.success('Notice download হয়েছে');
    } catch (e: any) {
      toast.error(e?.message || 'Download ব্যর্থ');
    } finally {
      setDownloadingId(null);
    }
  };

  const noticeUrl = (slug: string) => `${window.location.origin}/notices/${slug}`;

  const copyLink = async (slug: string) => {
    const url = noticeUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied — ' + url);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast.success('Link copied'); }
      catch { toast.error('Copy failed'); }
      ta.remove();
    }
  };


  const previewNotice: NoticeData | null = useMemo(() => editing ? {
    title: editing.title || 'Untitled Notice',
    summary: editing.summary || '',
    body: editing.body || '',
    reference_no: editing.reference_no || '',
    signed_by: editing.signed_by || '',
    signed_role: editing.signed_role || '',
    effective_date: editing.effective_date || null,
    audience: editing.audience || 'public',
  } : null, [editing]);

  const publishedCount = list.filter((n) => n.status === 'published').length;
  const draftCount = list.filter((n) => n.status === 'draft').length;
  const pinnedCount = list.filter((n) => n.pinned).length;

  const audienceStyle: Record<string, string> = {
    public: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    customers: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    both: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
  };
  const statusStyle: Record<string, string> = {
    published: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    draft: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    archived: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Gradient glassmorphism hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/40 dark:via-slate-950 dark:to-fuchsia-950/40 shadow-[0_10px_40px_-15px_rgba(139,92,246,0.35)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-fuchsia-400/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-violet-400/30 blur-3xl pointer-events-none" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Megaphone className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Notice System
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Compose polished, ready-to-publish circulars with AI (text or voice). Invoice-style layout, PDF export, public/customer audience.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur">
                  <FileText className="w-3 h-3 text-violet-600" /> {list.length} total
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {publishedCount} published
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur">
                  <FileEdit className="w-3 h-3 text-slate-600" /> {draftCount} draft
                </span>
                {pinnedCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur">
                    <Pin className="w-3 h-3 text-fuchsia-600" /> {pinnedCount} pinned
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={openNew}
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-lg shadow-violet-500/30 rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> New Notice
          </Button>
        </div>
      </div>

      {/* Signature manager — wrapped in glass card */}
      <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(139,92,246,0.2)] p-1">
        <NoticeSignatureManager onChanged={setSignature} />
      </div>

      {/* All notices — glass card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(139,92,246,0.2)]">
        <div className="px-5 py-4 border-b border-white/40 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-600" /> All Notices
            <span className="text-xs font-normal text-muted-foreground">({list.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gradient-to-br from-white/60 to-white/20 dark:from-white/5 dark:to-white/0 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
              <Megaphone className="w-10 h-10 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No notices yet</h3>
            <p className="text-sm text-muted-foreground mb-5">Click "New Notice" to compose your first announcement with AI.</p>
            <Button onClick={openNew} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Create Notice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Title</th>
                  <th className="py-3 px-4 text-left font-semibold">Ref</th>
                  <th className="py-3 px-4 text-left font-semibold">Audience</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Updated</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((n) => (
                  <tr key={n.id} className="border-t border-white/40 dark:border-white/5 hover:bg-violet-500/[0.04] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium flex items-center gap-1.5">
                        {n.pinned && <Pin className="w-3.5 h-3.5 text-fuchsia-600 fill-fuchsia-600" />}
                        <span className="line-clamp-1">{n.title}</span>
                      </div>
                      {n.summary && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.summary}</div>}
                      <button
                        type="button"
                        onClick={() => copyLink(n.slug)}
                        title="Click to copy link"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono text-violet-600 hover:text-violet-800 hover:underline max-w-full"
                      >
                        <Link2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">/notices/{n.slug}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">{n.reference_no || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge className={`capitalize border ${audienceStyle[n.audience] || audienceStyle.public}`}>
                        <Users className="w-3 h-3 mr-1" />{n.audience}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <Badge className={`capitalize border ${statusStyle[n.status] || statusStyle.draft}`}>{n.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(n.updated_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-0.5">
                        <Button size="sm" variant="ghost" onClick={() => copyLink(n.slug)} title="Copy public link" className="hover:bg-violet-500/10 hover:text-violet-700"><Copy className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" asChild title="Open public notice in new tab" className="hover:bg-violet-500/10 hover:text-violet-700">
                          <a href={`/notices/${n.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPreviewing(n)} title="Preview" className="hover:bg-violet-500/10 hover:text-violet-700"><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => downloadNotice(n)} disabled={downloadingId === n.id} title="Download PDF" className="hover:bg-violet-500/10 hover:text-violet-700">
                          {downloadingId === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(n)} title="Edit" className="hover:bg-violet-500/10 hover:text-violet-700"><Edit3 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => togglePublish(n)} title="Toggle publish" className="hover:bg-emerald-500/10">
                          <Send className={`w-4 h-4 ${n.status === 'published' ? 'text-emerald-600' : ''}`} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setNotifyNotice(n)} title="Send to user notifications" className="hover:bg-violet-500/10 text-violet-700">
                          <BellRing className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(n)} title="Delete" className="hover:bg-rose-500/10"><Trash2 className="w-4 h-4 text-rose-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Editor Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{(editing as any)?.id ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
            <DialogDescription>AI দিয়ে দ্রুত notice তৈরি করুন (text বা mic দিয়ে বলুন)। তারপর প্রয়োজনে edit করুন।</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="ai"><Sparkles className="w-4 h-4 mr-1" /> AI</TabsTrigger>
              <TabsTrigger value="edit"><Edit3 className="w-4 h-4 mr-1" /> Edit</TabsTrigger>
              <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-1" /> Preview</TabsTrigger>
            </TabsList>

            {/* AI tab */}
            <TabsContent value="ai" className="space-y-4 pt-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Language</Label>
                  <Select value={aiLang} onValueChange={(v: any) => setAiLang(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tone</Label>
                  <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal (Official)</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Audience</Label>
                  <Select value={editing?.audience || 'public'} onValueChange={(v: any) => setEditing((p) => ({ ...(p || {}), audience: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (website visitors)</SelectItem>
                      <SelectItem value="customers">Customers only (dashboard)</SelectItem>
                      <SelectItem value="both">Both (public + customers)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Notice-এর বিস্তারিত বলুন বা লিখুন</Label>
                  <div className="flex items-center gap-2">
                    {voice.supported && (
                      <Button
                        type="button"
                        size="sm"
                        variant={voice.listening ? 'destructive' : 'outline'}
                        onClick={voice.listening ? voice.stop : voice.start}
                        className="gap-1"
                      >
                        {voice.listening ? <><MicOff className="w-3.5 h-3.5" /> Stop</> : <><Mic className="w-3.5 h-3.5" /> Voice</>}
                      </Button>
                    )}
                    {aiPrompt && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setAiPrompt('')}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  rows={6}
                  value={aiPrompt + (voice.interimText ? ` ${voice.interimText}` : '')}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={'উদাহরণ: "আগামী শুক্রবার সকাল ১০টা থেকে দুপুর ২টা পর্যন্ত আমাদের server maintenance চলবে। এ সময় সাইট সাময়িকভাবে বন্ধ থাকতে পারে। গ্রাহকদের অসুবিধার জন্য আমরা দুঃখিত।"'}
                />
                {voice.listening && <p className="text-xs text-red-600 mt-1 animate-pulse">🎤 শুনছি... কথা বলুন</p>}
                {voice.error && <p className="text-xs text-red-600 mt-1">{voice.error}</p>}
                {!voice.supported && <p className="text-xs text-muted-foreground mt-1">Voice input এই browser-এ সাপোর্ট নেই (Chrome/Edge ব্যবহার করুন)।</p>}
              </div>

              <Button onClick={runAI} disabled={aiBusy || !aiPrompt.trim()} className="w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-lg shadow-violet-500/30">
                {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiBusy ? 'তৈরি করছি...' : 'AI দিয়ে Notice তৈরি করো'}
              </Button>
            </TabsContent>

            {/* Edit tab */}
            <TabsContent value="edit" className="space-y-3 pt-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Title</Label>
                  <Input value={editing?.title || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), title: e.target.value, slug: p?.slug || slugify(e.target.value) }))} />
                </div>
                <div>
                  <Label>Slug (URL)</Label>
                  <Input value={editing?.slug || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), slug: slugify(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Summary (preview-এ দেখাবে)</Label>
                <Input value={editing?.summary || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), summary: e.target.value }))} />
              </div>
              <div>
                <Label>Body (Markdown supported)</Label>
                <Textarea rows={12} value={editing?.body || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), body: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="grid sm:grid-cols-4 gap-3">
                <div>
                  <Label>Reference</Label>
                  <Input value={editing?.reference_no || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), reference_no: e.target.value }))} />
                </div>
                <div>
                  <Label>Effective Date</Label>
                  <Input type="date" value={editing?.effective_date || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), effective_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Signed By</Label>
                  <Input value={editing?.signed_by || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), signed_by: e.target.value }))} />
                </div>
                <div>
                  <Label>Signed Role</Label>
                  <Input value={editing?.signed_role || ''} onChange={(e) => setEditing((p) => ({ ...(p || {}), signed_role: e.target.value }))} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Audience</Label>
                  <Select value={editing?.audience || 'public'} onValueChange={(v: any) => setEditing((p) => ({ ...(p || {}), audience: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="customers">Customers only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing?.status || 'draft'} onValueChange={(v: any) => setEditing((p) => ({ ...(p || {}), status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!editing?.pinned} onChange={(e) => setEditing((p) => ({ ...(p || {}), pinned: e.target.checked }))} />
                    📌 Pin to top
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="pt-4">
              {previewNotice ? (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <NoticeTemplate notice={previewNotice} brand={{ name: 'Shahed Store' }} signatureUrl={signature.imageDataUrl || undefined} />
                </div>
              ) : <div className="text-center text-muted-foreground py-10">কিছু তথ্য দিন তারপর preview দেখুন</div>}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="secondary" onClick={() => save(false)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
            </Button>
            <Button onClick={() => save(true)} disabled={saving} className="gap-1">
              <Send className="w-4 h-4" /> {saving ? 'Saving...' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview-only dialog */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notice Preview</DialogTitle>
              <div className="flex flex-wrap gap-2">
                {previewing && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => copyLink(previewing.slug)} className="gap-1">
                      <Copy className="w-4 h-4" /> Copy Link
                    </Button>
                    <Button size="sm" variant="outline" asChild className="gap-1">
                      <a href={`/notices/${previewing.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => previewing && downloadNotice(previewing)}
                  disabled={!previewing || downloadingId !== null}
                  className="gap-1"
                >
                  {downloadingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
                </Button>
                <Button size="sm" variant="outline" onClick={printPreview} className="gap-1">
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </div>
          </DialogHeader>
          {previewing && (
            <div className="bg-gray-100 p-4 rounded-lg print:bg-white print:p-0">
              <NoticeTemplate notice={previewing} brand={{ name: 'Shahed Store' }} signatureUrl={signature.imageDataUrl || undefined} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SendToNotificationsDialog
        open={!!notifyNotice}
        onOpenChange={(o) => !o && setNotifyNotice(null)}
        defaultTitle={notifyNotice ? `📢 ${notifyNotice.title}` : ''}
        defaultMessage={notifyNotice ? (notifyNotice.summary || notifyNotice.title || '') : ''}
        defaultLink={notifyNotice ? `/notices/${notifyNotice.slug}` : ''}
        type="notice"
        sourceLabel={notifyNotice ? 'Notice' : undefined}
      />
    </div>
  );
}
