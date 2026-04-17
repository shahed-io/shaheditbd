import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, Copy, MessageCircle, Search, Filter, Package, Clock, CheckCircle, XCircle, Settings2 } from 'lucide-react';
import { usePasswordTypes } from '@/hooks/usePasswordTypes';
import PasswordTypesManager from '@/components/admin/PasswordTypesManager';

type PersonalLicense = {
  id: string;
  name: string;
  category: string;
  key_value: string | null;
  password: string | null;
  password_type: string | null;
  expires_at: string | null;
  note: string | null;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  name: '', category: 'general', key_value: '', password: '', password_type: '',
  expires_at: '', note: '', status: 'active', customer_name: '', customer_phone: '',
};

export default function AdminPersonalLicenses() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalLicense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [typesManagerOpen, setTypesManagerOpen] = useState(false);
  const { types: passwordTypes, getType } = usePasswordTypes();

  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['personal-licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_licenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PersonalLicense[];
    },
  });

  const categories = [...new Set(licenses.map(l => l.category))].filter(Boolean);

  const saveMut = useMutation({
    mutationFn: async (vals: typeof form) => {
      const payload: any = {
        name: vals.name,
        category: vals.category || 'general',
        key_value: vals.key_value || null,
        password: vals.password || null,
        password_type: vals.password_type || null,
        expires_at: vals.expires_at || null,
        note: vals.note || null,
        status: vals.status,
        customer_name: vals.customer_name || null,
        customer_phone: vals.customer_phone || null,
      };
      if (editing) {
        const { error } = await supabase.from('personal_licenses').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('personal_licenses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-licenses'] });
      toast.success(editing ? 'আপডেট হয়েছে' : 'যোগ হয়েছে');
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_licenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-licenses'] });
      toast.success('ডিলিট হয়েছে');
    },
  });

  const deliverMut = useMutation({
    mutationFn: async (lic: PersonalLicense) => {
      const { error } = await supabase.from('personal_licenses').update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      }).eq('id', lic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-licenses'] });
      toast.success('ডেলিভারি মার্ক হয়েছে');
    },
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(lic: PersonalLicense) {
    setEditing(lic);
    setForm({
      name: lic.name,
      category: lic.category || 'general',
      key_value: lic.key_value || '',
      password: lic.password || '',
      password_type: lic.password_type || '',
      expires_at: lic.expires_at ? lic.expires_at.split('T')[0] : '',
      note: lic.note || '',
      status: lic.status,
      customer_name: lic.customer_name || '',
      customer_phone: lic.customer_phone || '',
    });
    setOpen(true);
  }

  function closeDialog() { setOpen(false); setEditing(null); setForm(emptyForm); }

  function copyLicenseText(lic: PersonalLicense) {
    const pt = getType(lic.password_type);
    const lines = [`📦 ${lic.name}`];
    if (lic.key_value) lines.push(`🔑 Key: ${lic.key_value}`);
    if (lic.password) {
      const suffix = pt ? ` ${pt.emoji} (${pt.label})` : '';
      lines.push(`🔒 Password: ${lic.password}${suffix}`);
    }
    if (lic.expires_at) lines.push(`📅 মেয়াদ: ${new Date(lic.expires_at).toLocaleDateString('bn-BD')}`);
    if (lic.note) lines.push(`📝 নোট: ${lic.note}`);
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('কপি হয়েছে');
  }

  function sendWhatsApp(lic: PersonalLicense) {
    const pt = getType(lic.password_type);
    const lines = [`📦 *${lic.name}*`];
    if (lic.key_value) lines.push(`🔑 Key: \`${lic.key_value}\``);
    if (lic.password) {
      const suffix = pt ? ` ${pt.emoji} _${pt.label}_` : '';
      lines.push(`🔒 Password: \`${lic.password}\`${suffix}`);
      if (pt?.description) lines.push(`   _${pt.description}_`);
    }
    if (lic.expires_at) lines.push(`📅 মেয়াদ: ${new Date(lic.expires_at).toLocaleDateString('bn-BD')}`);
    if (lic.note) lines.push(`📝 ${lic.note}`);
    lines.push('\n✅ Shahed Store থেকে ডেলিভারি করা হলো।');
    const phone = lic.customer_phone?.replace(/[^0-9]/g, '') || '';
    const intlPhone = phone.startsWith('0') ? '88' + phone : phone;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
    // Mark as delivered
    deliverMut.mutate(lic);
  }

  const filtered = licenses.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterCategory !== 'all' && l.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) ||
        (l.key_value || '').toLowerCase().includes(q) ||
        (l.customer_name || '').toLowerCase().includes(q) ||
        (l.customer_phone || '').includes(q);
    }
    return true;
  });

  const statusBadge = (s: string) => {
    switch (s) {
      case 'active': return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />সক্রিয়</Badge>;
      case 'expired': return <Badge className="bg-red-500/10 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" />মেয়াদোত্তীর্ণ</Badge>;
      case 'delivered': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200"><Package className="w-3 h-3 mr-1" />ডেলিভার্ড</Badge>;
      default: return <Badge variant="secondary">{s}</Badge>;
    }
  };

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    delivered: licenses.filter(l => l.status === 'delivered').length,
    expired: licenses.filter(l => l.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">পার্সোনাল লাইসেন্স ইনভেন্টরি</h1>
          <p className="text-sm text-muted-foreground">আপনার সকল লাইসেন্স ও সাবস্ক্রিপশন এক জায়গায়</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTypesManagerOpen(true)}>
            <Settings2 className="w-4 h-4 mr-2" />পাসওয়ার্ড টাইপ
          </Button>
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />নতুন যোগ করুন</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-foreground">{stats.total}</div><div className="text-xs text-muted-foreground">মোট</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.active}</div><div className="text-xs text-muted-foreground">সক্রিয়</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.delivered}</div><div className="text-xs text-muted-foreground">ডেলিভার্ড</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{stats.expired}</div><div className="text-xs text-muted-foreground">মেয়াদোত্তীর্ণ</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="নাম, কি, কাস্টমার খুঁজুন..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
            <SelectItem value="active">সক্রিয়</SelectItem>
            <SelectItem value="delivered">ডেলিভার্ড</SelectItem>
            <SelectItem value="expired">মেয়াদোত্তীর্ণ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="ক্যাটাগরি" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>ক্যাটাগরি</TableHead>
                <TableHead>কি / পাসওয়ার্ড</TableHead>
                <TableHead>মেয়াদ</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead>কাস্টমার</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">কোনো লাইসেন্স পাওয়া যায়নি</TableCell></TableRow>
              ) : filtered.map(lic => (
                <TableRow key={lic.id}>
                  <TableCell className="font-medium">{lic.name}</TableCell>
                  <TableCell><Badge variant="outline">{lic.category}</Badge></TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs font-mono max-w-[220px] truncate">
                      {lic.key_value && <div title={lic.key_value}>🔑 {lic.key_value.substring(0, 20)}{lic.key_value.length > 20 ? '...' : ''}</div>}
                      {lic.password && (
                        <div className="flex items-center gap-1">
                          <span>🔒 ••••••</span>
                          {(() => {
                            const pt = getType(lic.password_type);
                            return pt ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {pt.emoji} {pt.label}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lic.expires_at ? (
                      <span className={`text-xs ${new Date(lic.expires_at) < new Date() ? 'text-red-500' : 'text-muted-foreground'}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(lic.expires_at).toLocaleDateString('bn-BD')}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>{statusBadge(lic.status)}</TableCell>
                  <TableCell>
                    {lic.customer_name ? (
                      <div className="text-xs">
                        <div>{lic.customer_name}</div>
                        {lic.customer_phone && <div className="text-muted-foreground">{lic.customer_phone}</div>}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => copyLicenseText(lic)} title="কপি">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => sendWhatsApp(lic)} title="WhatsApp ডেলিভারি" className="text-green-600 hover:text-green-700">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(lic)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => {
                        if (confirm('ডিলিট করতে চান?')) deleteMut.mutate(lic.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'লাইসেন্স এডিট' : 'নতুন লাইসেন্স যোগ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>নাম *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="যেমন: Office 365, Canva Pro" />
              </div>
              <div>
                <Label>ক্যাটাগরি</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="general" list="cat-list" />
                <datalist id="cat-list">
                  {categories.map(c => <option key={c} value={c!} />)}
                </datalist>
              </div>
              <div>
                <Label>স্ট্যাটাস</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">সক্রিয়</SelectItem>
                    <SelectItem value="delivered">ডেলিভার্ড</SelectItem>
                    <SelectItem value="expired">মেয়াদোত্তীর্ণ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>লাইসেন্স কি / ইমেইল</Label>
                <Input value={form.key_value} onChange={e => setForm(f => ({ ...f, key_value: e.target.value }))} placeholder="XXXXX-XXXXX-XXXXX" />
              </div>
              <div className="col-span-2">
                <Label>পাসওয়ার্ড</Label>
                <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="পাসওয়ার্ড (ঐচ্ছিক)" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <Label>পাসওয়ার্ডের ধরন (Type)</Label>
                  <button
                    type="button"
                    onClick={() => setTypesManagerOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    + টাইপ ম্যানেজ করুন
                  </button>
                </div>
                <Select
                  value={form.password_type || '__none__'}
                  onValueChange={v => setForm(f => ({ ...f, password_type: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="টাইপ নির্বাচন করুন (ঐচ্ছিক)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— কোনো টাইপ নয় —</SelectItem>
                    {passwordTypes.map(pt => (
                      <SelectItem key={pt.id} value={pt.id}>
                        <span className="flex items-center gap-2">
                          <span>{pt.emoji}</span>
                          <span>{pt.label}</span>
                          {pt.description && <span className="text-xs text-muted-foreground">— {pt.description}</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>মেয়াদ শেষ</Label>
                <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
              <div>
                <Label>কাস্টমার ফোন</Label>
                <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="01XXXXXXXXX" />
              </div>
              <div className="col-span-2">
                <Label>কাস্টমার নাম</Label>
                <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>নোট</Label>
                <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} placeholder="অতিরিক্ত তথ্য..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>বাতিল</Button>
              <Button type="submit" disabled={saveMut.isPending}>{saveMut.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PasswordTypesManager open={typesManagerOpen} onOpenChange={setTypesManagerOpen} />
    </div>
  );
}
