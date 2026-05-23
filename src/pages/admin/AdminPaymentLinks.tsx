import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Copy, Edit, Trash2, Eye, Check, X as XIcon, Pause, Play, QrCode, ExternalLink, Loader2, Link2, Inbox } from 'lucide-react';

type PaymentMethod = { name: string; number?: string; instructions?: string };
type CustomField = { label: string; type?: 'text' | 'email' | 'number'; required?: boolean };

const emptyLink = {
  id: '' as string | undefined,
  slug: '', title: '', description: '',
  product_id: null as string | null,
  product_name: '', product_image: '',
  amount: 0, original_amount: null as number | null,
  quantity: 1, allow_qty_change: false,
  payment_methods: [{ name: 'bKash', number: '', instructions: 'Send Money to this number and submit the Transaction ID below.' }] as PaymentMethod[],
  required_fields: { name: true, phone: true, email: false, address: false, note: false },
  custom_fields: [] as CustomField[],
  max_uses: null as number | null,
  expires_at: null as string | null,
  status: 'active' as 'active' | 'paused',
  redirect_url: '',
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) ||
  Math.random().toString(36).slice(2, 10);

export default function AdminPaymentLinks() {
  const [tab, setTab] = useState<'links' | 'submissions'>('links');
  const [links, setLinks] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<typeof emptyLink | null>(null);
  const [viewSub, setViewSub] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewing, setReviewing] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const load = async () => {
    setLoading(true);
    const [l, s, p] = await Promise.all([
      supabase.from('payment_links').select('*').order('created_at', { ascending: false }),
      supabase.from('payment_link_submissions').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('products').select('id, name, price, image').eq('status', 'active').order('name').limit(500),
    ]);
    setLinks(l.data || []);
    setSubs(s.data || []);
    setProducts(p.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-pls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_link_submissions' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const quickGenerate = async () => {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const slug = `pay-${Date.now().toString(36)}-${rand.toLowerCase()}`;
    const payload = {
      slug,
      title: `Quick Payment Link ${rand}`,
      description: null,
      product_id: null,
      product_name: null,
      product_image: null,
      amount: null,
      original_amount: null,
      quantity: 1,
      allow_qty_change: false,
      is_open_form: true,
      payment_methods: [
        { name: 'bKash', number: '', instructions: 'Send Money and submit the Transaction ID below.' },
        { name: 'Nagad', number: '', instructions: 'Send Money and submit the Transaction ID below.' },
        { name: 'Rocket', number: '', instructions: 'Send Money and submit the Transaction ID below.' },
      ],
      required_fields: { name: true, phone: true, email: false, address: false, note: true },
      custom_fields: [],
      max_uses: null,
      expires_at: null,
      status: 'active',
      redirect_url: null,
    };
    try {
      const { data, error } = await supabase.from('payment_links').insert(payload).select('slug').single();
      if (error) throw error;
      const url = `${window.location.origin}/pay/${data.slug}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success('Link generated & copied to clipboard');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    }
  };

  const saveLink = async () => {
    if (!editor) return;
    if (!editor.title.trim() || !editor.product_name.trim() || editor.amount <= 0) {
      return toast.error('Title, product name and amount are required');
    }
    const slug = editor.slug.trim() || slugify(editor.title);
    const payload = { ...editor, slug, original_amount: editor.original_amount || null, max_uses: editor.max_uses || null, expires_at: editor.expires_at || null };
    delete (payload as any).id;
    try {
      if (editor.id) {
        const { error } = await supabase.from('payment_links').update(payload).eq('id', editor.id);
        if (error) throw error;
        toast.success('Updated');
      } else {
        const { error } = await supabase.from('payment_links').insert(payload);
        if (error) throw error;
        toast.success('Created');
      }
      setEditor(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    await supabase.from('payment_links').delete().eq('id', id);
    load();
  };

  const toggleStatus = async (l: any) => {
    await supabase.from('payment_links').update({ status: l.status === 'active' ? 'paused' : 'active' }).eq('id', l.id);
    load();
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/pay/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const reviewSubmission = async (action: 'approve' | 'reject') => {
    if (!viewSub) return;
    setReviewing(true);
    try {
      const { data, error } = await supabase.functions.invoke('review-payment-submission', {
        body: { submission_id: viewSub.id, action, admin_note: adminNote || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(action === 'approve' ? `Approved → Order ${(data as any).order_number}` : 'Rejected');
      setViewSub(null);
      setAdminNote('');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally { setReviewing(false); }
  };

  const filteredSubs = subs.filter(s => filter === 'all' ? true : s.status === filter);
  const pendingCount = subs.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Link2 className="w-6 h-6 text-primary" /> Payment Links</h1>
          <p className="text-sm text-muted-foreground">Create shareable payment links and review customer submissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={quickGenerate}>
            <Plus className="w-4 h-4 mr-2" /> Quick Generate Link
          </Button>
          <Button variant="outline" onClick={() => setEditor({ ...emptyLink })}>
            <Edit className="w-4 h-4 mr-2" /> Custom Link
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions {pendingCount > 0 && <Badge className="ml-2" variant="destructive">{pendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links">
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow> :
                  links.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No links yet</TableCell></TableRow> :
                  links.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-xs text-muted-foreground">{l.product_name}</div>
                      </TableCell>
                      <TableCell><code className="text-xs">{l.slug}</code></TableCell>
                      <TableCell>৳{Number(l.amount).toLocaleString()}</TableCell>
                      <TableCell>{l.current_uses}{l.max_uses ? `/${l.max_uses}` : ''}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === 'active' ? 'default' : 'secondary'}>{l.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => copyLink(l.slug)}><Copy className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" asChild><a href={`/pay/${l.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleStatus(l)}>{l.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditor({ ...l })}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteLink(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="submissions">
          <div className="flex gap-2 mb-3 flex-wrap">
            {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground"><Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />No submissions</TableCell></TableRow> :
                  filteredSubs.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{s.customer_phone}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.product_name}</TableCell>
                      <TableCell>৳{Number(s.total).toLocaleString()}</TableCell>
                      <TableCell><code className="text-xs">{s.transaction_id}</code></TableCell>
                      <TableCell>{s.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}>{s.status}</Badge>
                        {s.order_number && <div className="text-xs mt-1 font-mono">{s.order_number}</div>}
                      </TableCell>
                      <TableCell className="text-xs">{new Date(s.created_at).toLocaleString()}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => { setViewSub(s); setAdminNote(s.admin_note || ''); }}><Eye className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Link editor */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Link2 className="w-5 h-5 text-primary" />
              {editor?.id ? 'Edit Payment Link' : 'New Payment Link'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Configure a shareable checkout link for your customers.</p>
          </DialogHeader>
          {editor && (
            <div className="px-6 py-5 space-y-5">
              {/* Basics */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Basics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Title <span className="text-destructive">*</span></Label>
                    <Input value={editor.title} onChange={e => setEditor({ ...editor, title: e.target.value, slug: editor.slug || slugify(e.target.value) })} placeholder="e.g. Office 365 — 1 Year" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slug (URL)</Label>
                    <Input value={editor.slug} onChange={e => setEditor({ ...editor, slug: slugify(e.target.value) })} placeholder="auto-generated" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea rows={2} value={editor.description || ''} onChange={e => setEditor({ ...editor, description: e.target.value })} placeholder="Shown on the payment page below the title" />
                </div>
              </section>

              {/* Product */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Product</h3>
                <div className="space-y-1.5">
                  <Label>Pick from catalog</Label>
                  <Select value={editor.product_id || 'custom'} onValueChange={v => {
                    if (v === 'custom') return setEditor({ ...editor, product_id: null });
                    const p = products.find(x => x.id === v);
                    if (p) setEditor({ ...editor, product_id: p.id, product_name: p.name, product_image: p.image, amount: p.price });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">— Custom product —</SelectItem>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (৳{p.price})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Product name <span className="text-destructive">*</span></Label>
                    <Input value={editor.product_name} onChange={e => setEditor({ ...editor, product_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Product image URL</Label>
                    <Input value={editor.product_image} onChange={e => setEditor({ ...editor, product_image: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Pricing & Quantity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Amount (৳) <span className="text-destructive">*</span></Label>
                    <Input type="number" value={editor.amount} onChange={e => setEditor({ ...editor, amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Original amount</Label>
                    <Input type="number" value={editor.original_amount || ''} onChange={e => setEditor({ ...editor, original_amount: parseFloat(e.target.value) || null })} placeholder="Optional (strike-through)" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quantity</Label>
                    <Input type="number" value={editor.quantity} onChange={e => setEditor({ ...editor, quantity: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                  <Label className="cursor-pointer">Allow customer to change quantity</Label>
                  <Switch checked={editor.allow_qty_change} onCheckedChange={v => setEditor({ ...editor, allow_qty_change: v })} />
                </div>
              </section>

              {/* Customer fields */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Required Customer Fields</h3>
                <p className="text-xs text-muted-foreground">Name & phone are always required.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['email', 'address', 'note'] as const).map(f => (
                    <div key={f} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                      <Label className="capitalize cursor-pointer">{f}</Label>
                      <Switch checked={!!(editor.required_fields as any)[f]} onCheckedChange={v => setEditor({ ...editor, required_fields: { ...editor.required_fields, [f]: v } })} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment methods */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Payment Methods</h3>
                  <Button size="sm" variant="outline" onClick={() => setEditor({ ...editor, payment_methods: [...editor.payment_methods, { name: '', number: '', instructions: '' }] })}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                <div className="space-y-2">
                  {editor.payment_methods.map((m, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center rounded-lg border border-border/60 bg-background/60 p-2">
                      <Input className="col-span-3" placeholder="Name (bKash)" value={m.name} onChange={e => { const a = [...editor.payment_methods]; a[i] = { ...a[i], name: e.target.value }; setEditor({ ...editor, payment_methods: a }); }} />
                      <Input className="col-span-3" placeholder="Number" value={m.number} onChange={e => { const a = [...editor.payment_methods]; a[i] = { ...a[i], number: e.target.value }; setEditor({ ...editor, payment_methods: a }); }} />
                      <Input className="col-span-5" placeholder="Instructions" value={m.instructions} onChange={e => { const a = [...editor.payment_methods]; a[i] = { ...a[i], instructions: e.target.value }; setEditor({ ...editor, payment_methods: a }); }} />
                      <Button size="sm" variant="ghost" className="col-span-1" onClick={() => setEditor({ ...editor, payment_methods: editor.payment_methods.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Custom fields */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Custom Fields</h3>
                  <Button size="sm" variant="outline" onClick={() => setEditor({ ...editor, custom_fields: [...editor.custom_fields, { label: '', type: 'text', required: false }] })}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                {editor.custom_fields.length === 0 && <p className="text-xs text-muted-foreground">No custom fields. Add fields like "PC Username", "Device ID" etc.</p>}
                <div className="space-y-2">
                  {editor.custom_fields.map((f, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center rounded-lg border border-border/60 bg-background/60 p-2">
                      <Input className="col-span-6" placeholder="Field label (e.g. PC Username)" value={f.label} onChange={e => { const a = [...editor.custom_fields]; a[i] = { ...a[i], label: e.target.value }; setEditor({ ...editor, custom_fields: a }); }} />
                      <Select value={f.type || 'text'} onValueChange={v => { const a = [...editor.custom_fields]; a[i] = { ...a[i], type: v as any }; setEditor({ ...editor, custom_fields: a }); }}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="number">Number</SelectItem></SelectContent>
                      </Select>
                      <label className="col-span-2 flex items-center gap-1 text-xs"><Switch checked={!!f.required} onCheckedChange={v => { const a = [...editor.custom_fields]; a[i] = { ...a[i], required: v }; setEditor({ ...editor, custom_fields: a }); }} /> Req</label>
                      <Button size="sm" variant="ghost" className="col-span-1" onClick={() => setEditor({ ...editor, custom_fields: editor.custom_fields.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Limits & Status */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Limits & Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Max uses</Label>
                    <Input type="number" value={editor.max_uses || ''} onChange={e => setEditor({ ...editor, max_uses: parseInt(e.target.value) || null })} placeholder="Unlimited" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expires at</Label>
                    <Input type="datetime-local" value={editor.expires_at?.slice(0, 16) || ''} onChange={e => setEditor({ ...editor, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={editor.status} onValueChange={v => setEditor({ ...editor, status: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Redirect URL after submission</Label>
                  <Input value={editor.redirect_url || ''} onChange={e => setEditor({ ...editor, redirect_url: e.target.value })} placeholder="https://... (optional)" />
                </div>
              </section>
            </div>
          )}
          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-card/30">
            <Button variant="outline" onClick={() => setEditor(null)}>Cancel</Button>
            <Button onClick={saveLink}>{editor?.id ? 'Update Link' : 'Create Link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission viewer */}
      <Dialog open={!!viewSub} onOpenChange={(o) => !o && setViewSub(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submission Details</DialogTitle></DialogHeader>
          {viewSub && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Customer:</span> <div className="font-medium">{viewSub.customer_name}</div></div>
                <div><span className="text-muted-foreground">Phone:</span> <div className="font-medium">{viewSub.customer_phone}</div></div>
                {viewSub.customer_email && <div><span className="text-muted-foreground">Email:</span> <div>{viewSub.customer_email}</div></div>}
                {viewSub.customer_address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <div>{viewSub.customer_address}</div></div>}
                <div><span className="text-muted-foreground">Product:</span> <div className="font-medium">{viewSub.product_name}</div></div>
                <div><span className="text-muted-foreground">Quantity × Amount:</span> <div>{viewSub.quantity} × ৳{Number(viewSub.amount).toLocaleString()} = <b>৳{Number(viewSub.total).toLocaleString()}</b></div></div>
                <div><span className="text-muted-foreground">Payment method:</span> <div className="font-medium">{viewSub.payment_method}</div></div>
                <div><span className="text-muted-foreground">Transaction ID:</span> <div className="font-mono">{viewSub.transaction_id}</div></div>
                {viewSub.sender_number && <div><span className="text-muted-foreground">Sender number:</span> <div className="font-mono">{viewSub.sender_number}</div></div>}
                <div><span className="text-muted-foreground">Status:</span> <Badge>{viewSub.status}</Badge></div>
              </div>
              {viewSub.customer_note && <div><span className="text-muted-foreground">Customer note:</span><div className="p-2 bg-muted/40 rounded mt-1 whitespace-pre-line">{viewSub.customer_note}</div></div>}
              {viewSub.custom_field_values && Object.keys(viewSub.custom_field_values).length > 0 && (
                <div>
                  <span className="text-muted-foreground">Custom fields:</span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(viewSub.custom_field_values).map(([k, v]) => (
                      <div key={k} className="flex gap-2"><span className="text-muted-foreground">{k}:</span> <span className="font-medium">{String(v)}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {viewSub.payment_screenshot_url && (
                <div>
                  <span className="text-muted-foreground">Payment screenshot:</span>
                  <a href={viewSub.payment_screenshot_url} target="_blank" rel="noreferrer" className="block mt-2">
                    <img src={viewSub.payment_screenshot_url} className="max-w-full max-h-80 rounded border" />
                  </a>
                </div>
              )}
              {viewSub.order_number && <div className="p-3 bg-green-50 border border-green-200 rounded"><b>Order created:</b> <span className="font-mono">{viewSub.order_number}</span></div>}
              {viewSub.status === 'pending' && (
                <div>
                  <Label>Admin note (optional)</Label>
                  <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Reason for rejection or extra notes" />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {viewSub?.status === 'pending' ? (
              <>
                <Button variant="destructive" disabled={reviewing} onClick={() => reviewSubmission('reject')}><XIcon className="w-4 h-4 mr-1" /> Reject</Button>
                <Button disabled={reviewing} onClick={() => reviewSubmission('approve')}>{reviewing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Approve & Create Order</Button>
              </>
            ) : <Button variant="outline" onClick={() => setViewSub(null)}>Close</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
