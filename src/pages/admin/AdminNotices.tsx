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
import { Plus, Edit3, Trash2, Eye, Sparkles, Mic, MicOff, Loader2, Send, FileText, Printer, RotateCcw, Download } from 'lucide-react';
import NoticeTemplate, { NoticeData } from '@/components/notices/NoticeTemplate';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import NoticeSignatureManager from '@/components/admin/NoticeSignatureManager';
import { loadNoticeSignature, type NoticeSignature, DEFAULT_NOTICE_SIGNATURE } from '@/lib/noticeSignature';
import { downloadNoticePdf } from '@/lib/noticePdf';

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> Notice System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI দিয়ে notice তৈরি করুন (text বা voice) — invoice-style design, public/customer audience সমর্থিত।
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Notice
        </Button>
      </div>

      <div className="mb-6">
        <NoticeSignatureManager onChanged={setSignature} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Notices ({list.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading...</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              কোনো notice নেই। উপরে "New Notice" ক্লিক করে শুরু করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 px-2 text-left">Title</th>
                    <th className="py-2 px-2 text-left">Ref</th>
                    <th className="py-2 px-2 text-left">Audience</th>
                    <th className="py-2 px-2 text-left">Status</th>
                    <th className="py-2 px-2 text-left">Updated</th>
                    <th className="py-2 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((n) => (
                    <tr key={n.id} className="border-b hover:bg-muted/40">
                      <td className="py-2 px-2">
                        <div className="font-medium">{n.pinned && '📌 '}{n.title}</div>
                        {n.summary && <div className="text-xs text-muted-foreground line-clamp-1">{n.summary}</div>}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{n.reference_no || '—'}</td>
                      <td className="py-2 px-2"><Badge variant="outline" className="capitalize">{n.audience}</Badge></td>
                      <td className="py-2 px-2">
                        <Badge variant={n.status === 'published' ? 'default' : 'secondary'} className="capitalize">{n.status}</Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{new Date(n.updated_at).toLocaleDateString()}</td>
                      <td className="py-2 px-2 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewing(n)} title="Preview"><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => downloadNotice(n)} disabled={downloadingId === n.id} title="Download PDF">
                            {downloadingId === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(n)} title="Edit"><Edit3 className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => togglePublish(n)} title="Toggle publish">
                            <Send className={`w-4 h-4 ${n.status === 'published' ? 'text-emerald-600' : ''}`} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(n)} title="Delete"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

              <Button onClick={runAI} disabled={aiBusy || !aiPrompt.trim()} className="w-full gap-2">
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
              <div className="flex gap-2">
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
    </div>
  );
}
