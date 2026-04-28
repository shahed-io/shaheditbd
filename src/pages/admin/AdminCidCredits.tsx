import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Coins, Plus, Minus, Search, RefreshCw, Loader2, History, User as UserIcon,
  Mail, Download, UserSearch, ClipboardList, Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface CidAccount {
  user_id: string;
  balance: number;
  total_added: number;
  total_used: number;
  updated_at?: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
}

interface GenerationLog {
  id: string;
  created_at: string;
  operator: string;
  number: string | null;
  status: string;
  cost: number;
}

interface AdjustmentLog {
  id: string;
  created_at: string;
  delta: number;
  balance_after: number;
  note: string | null;
  adjusted_by: string | null;
}

const PRESETS = [10, 25, 50, 100, 500];

export default function AdminCidCredits() {
  const [accounts, setAccounts] = useState<CidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CidAccount | null>(null);
  const [delta, setDelta] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [historyUser, setHistoryUser] = useState<CidAccount | null>(null);
  const [history, setHistory] = useState<GenerationLog[]>([]);
  const [adjLog, setAdjLog] = useState<AdjustmentLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Lookup-by-email panel
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<CidAccount[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDelta, setBulkDelta] = useState('');
  const [bulkNote, setBulkNote] = useState('');

  // Recent adjustments tab
  const [recentAdj, setRecentAdj] = useState<(AdjustmentLog & { user_id: string; user: CidAccount | null })[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: balances, error } = await supabase
        .from('cid_balances')
        .select('user_id, balance, total_added, total_used, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1000);
      if (error) throw error;

      const ids = (balances || []).map(b => b.user_id);
      const profMap = new Map<string, { display_name: string | null; email: string | null; phone: string | null }>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, phone')
          .in('user_id', ids);
        (profs || []).forEach(p => profMap.set(p.user_id, {
          display_name: p.display_name, email: p.email, phone: p.phone,
        }));
      }
      setAccounts((balances || []).map(b => ({
        ...b,
        display_name: profMap.get(b.user_id)?.display_name ?? null,
        email: profMap.get(b.user_id)?.email ?? null,
        phone: profMap.get(b.user_id)?.phone ?? null,
      })));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load CID accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentAdjustments = useCallback(async () => {
    setRecentLoading(true);
    try {
      const { data, error } = await supabase
        .from('cid_balance_adjustments')
        .select('id, user_id, delta, balance_after, note, adjusted_by, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const ids = Array.from(new Set((data || []).map(d => d.user_id)));
      const userMap = new Map<string, CidAccount>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, phone')
          .in('user_id', ids);
        (profs || []).forEach(p => userMap.set(p.user_id, {
          user_id: p.user_id,
          balance: 0, total_added: 0, total_used: 0,
          display_name: p.display_name, email: p.email, phone: p.phone,
        }));
      }
      setRecentAdj((data || []).map((d: any) => ({ ...d, user: userMap.get(d.user_id) || null })));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load adjustments');
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(a =>
      (a.display_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.phone || '').toLowerCase().includes(q) ||
      a.user_id.toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const totals = useMemo(() => ({
    users: accounts.length,
    balance: accounts.reduce((s, a) => s + (a.balance || 0), 0),
    added: accounts.reduce((s, a) => s + (a.total_added || 0), 0),
    used: accounts.reduce((s, a) => s + (a.total_used || 0), 0),
  }), [accounts]);

  const adjust = async (sign: 1 | -1) => {
    if (!editing) return;
    const n = parseInt(delta, 10);
    if (!n || n <= 0) { toast.error('Enter a valid positive number'); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('admin_adjust_cid_balance', {
        p_user_id: editing.user_id,
        p_delta: sign * n,
        p_note: note || null,
      });
      if (error) throw error;
      const res = data as any;
      if (!res?.success) throw new Error(res?.error || 'Failed');
      toast.success(`${sign > 0 ? 'Added' : 'Deducted'} ${n} credits. New balance: ${res.new_balance}`);
      setEditing(null);
      setDelta('');
      setNote('');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (acc: CidAccount) => {
    setHistoryUser(acc);
    setHistoryLoading(true);
    try {
      const [genRes, adjRes] = await Promise.all([
        supabase.from('cid_generations')
          .select('id, created_at, operator, number, status, cost')
          .eq('user_id', acc.user_id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('cid_balance_adjustments')
          .select('id, created_at, delta, balance_after, note, adjusted_by')
          .eq('user_id', acc.user_id)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      if (genRes.error) throw genRes.error;
      if (adjRes.error) throw adjRes.error;
      setHistory((genRes.data || []) as GenerationLog[]);
      setAdjLog((adjRes.data || []) as AdjustmentLog[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const runLookup = async () => {
    const q = lookupQuery.trim();
    if (!q) { toast.error('Enter an email, phone, name, or user ID'); return; }
    setLookupLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_find_user_for_cid', { p_query: q });
      if (error) throw error;
      const rows = (data || []) as CidAccount[];
      setLookupResults(rows);
      if (rows.length === 0) toast.info('No matching user found');
    } catch (e: any) {
      toast.error(e.message || 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(f => f.user_id)));
  };

  const runBulk = async (sign: 1 | -1) => {
    const n = parseInt(bulkDelta, 10);
    if (!n || n <= 0) { toast.error('Enter a valid amount'); return; }
    if (selected.size === 0) { toast.error('No users selected'); return; }
    setSubmitting(true);
    let ok = 0, fail = 0;
    for (const uid of selected) {
      try {
        const { data, error } = await supabase.rpc('admin_adjust_cid_balance', {
          p_user_id: uid, p_delta: sign * n, p_note: bulkNote || `Bulk ${sign > 0 ? 'add' : 'deduct'} of ${n}`,
        });
        if (error) throw error;
        const res = data as any;
        if (!res?.success) throw new Error(res?.error);
        ok++;
      } catch { fail++; }
    }
    setSubmitting(false);
    setBulkOpen(false);
    setSelected(new Set());
    setBulkDelta(''); setBulkNote('');
    toast.success(`Bulk done — ${ok} succeeded, ${fail} failed`);
    load();
  };

  const exportCsv = () => {
    const rows = [
      ['user_id', 'name', 'email', 'phone', 'balance', 'total_added', 'total_used', 'updated_at'],
      ...accounts.map(a => [
        a.user_id, a.display_name || '', a.email || '', a.phone || '',
        String(a.balance), String(a.total_added), String(a.total_used), a.updated_at || '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cid-balances-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" /> CID Credits Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Find any user by email/phone and add or deduct CID credits — even users who never generated before.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2" disabled={accounts.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Users with Balance" value={totals.users} />
        <StatCard label="Total Balance" value={totals.balance} />
        <StatCard label="Total Added" value={totals.added} />
        <StatCard label="Total Used" value={totals.used} />
      </div>

      {/* Quick lookup by email/phone — works for ANY user */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserSearch className="h-4 w-4 text-primary" /> Find User by Email / Phone / Name
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="user@example.com or 017xxxxxxxx or name"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runLookup()}
                className="pl-9"
              />
            </div>
            <Button onClick={runLookup} disabled={lookupLoading} className="gap-2">
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search User
            </Button>
          </div>
          {lookupResults.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lookupResults.map(r => (
                    <TableRow key={r.user_id}>
                      <TableCell className="font-medium">{r.display_name || 'Unnamed'}</TableCell>
                      <TableCell className="text-xs">
                        <div className="break-all">{r.email || '—'}</div>
                        <div className="text-muted-foreground">{r.phone || ''}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.balance > 0 ? 'default' : 'secondary'}>{r.balance}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="gap-1" onClick={() => { setEditing(r); setDelta(''); setNote(''); }}>
                          <Coins className="h-3.5 w-3.5" /> Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Accounts</TabsTrigger>
          <TabsTrigger value="adjustments" onClick={loadRecentAdjustments} className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Recent Adjustments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CardTitle className="text-base">All Accounts with Balance</CardTitle>
                <div className="relative sm:ml-auto w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, phone, or ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {selected.size > 0 && (
                  <Button size="sm" onClick={() => setBulkOpen(true)} className="gap-1">
                    <Coins className="h-3.5 w-3.5" /> Bulk Adjust ({selected.size})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No accounts with balance yet. Use the search above to find any user by email.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selected.size === filtered.length && filtered.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Added</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead>Last Update</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((a) => (
                        <TableRow key={a.user_id} data-state={selected.has(a.user_id) ? 'selected' : undefined}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(a.user_id)}
                              onCheckedChange={() => toggleSelect(a.user_id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                {a.display_name || 'Unnamed'}
                              </span>
                              <span className="text-xs text-muted-foreground break-all">{a.email || a.phone || a.user_id}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={a.balance > 0 ? 'default' : 'secondary'}>{a.balance}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">+{a.total_added}</TableCell>
                          <TableCell className="text-right text-rose-600 dark:text-rose-400">−{a.total_used}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {a.updated_at ? new Date(a.updated_at).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => openHistory(a)}>
                                <History className="h-3.5 w-3.5" /> History
                              </Button>
                              <Button size="sm" className="gap-1" onClick={() => { setEditing(a); setDelta(''); setNote(''); }}>
                                <Coins className="h-3.5 w-3.5" /> Adjust
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Admin Adjustments (Last 100)</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : recentAdj.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No adjustments yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead className="text-right">Balance After</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAdj.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{new Date(a.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium">{a.user?.display_name || 'Unnamed'}</div>
                            <div className="text-muted-foreground break-all">{a.user?.email || a.user_id}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={a.delta > 0 ? 'default' : 'destructive'}>
                              {a.delta > 0 ? '+' : ''}{a.delta}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{a.balance_after}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{a.note || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust CID Credits</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1">
                <div className="font-medium text-foreground">{editing?.display_name || 'Unnamed'}</div>
                <div className="text-xs break-all">{editing?.email || editing?.phone || editing?.user_id}</div>
                <div>Current balance: <strong className="text-foreground">{editing?.balance ?? 0}</strong></div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cid-delta">Amount</Label>
              <Input
                id="cid-delta"
                type="number"
                min={1}
                placeholder="e.g. 10"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESETS.map(p => (
                  <Button key={p} type="button" size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => setDelta(String(p))}>
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="cid-note">Note (optional)</Label>
              <Textarea
                id="cid-note"
                placeholder="Reason for adjustment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="gap-1 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950"
              disabled={submitting}
              onClick={() => adjust(-1)}
            >
              <Minus className="h-4 w-4" /> Deduct
            </Button>
            <Button className="gap-1" disabled={submitting} onClick={() => adjust(1)}>
              <Plus className="h-4 w-4" /> Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk adjust dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Adjust {selected.size} Users</DialogTitle>
            <DialogDescription>
              Same amount will be applied to all selected users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount per user</Label>
              <Input type="number" min={1} value={bulkDelta} onChange={(e) => setBulkDelta(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="gap-1 text-rose-600" disabled={submitting} onClick={() => runBulk(-1)}>
              <Minus className="h-4 w-4" /> Deduct from all
            </Button>
            <Button className="gap-1" disabled={submitting} onClick={() => runBulk(1)}>
              <Plus className="h-4 w-4" /> Add to all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyUser} onOpenChange={(o) => !o && setHistoryUser(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User History</DialogTitle>
            <DialogDescription>
              {historyUser?.display_name || historyUser?.email || historyUser?.user_id}
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Tabs defaultValue="adj" className="w-full">
              <TabsList>
                <TabsTrigger value="adj">Admin Adjustments ({adjLog.length})</TabsTrigger>
                <TabsTrigger value="gen">CID Generations ({history.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="adj" className="mt-3 max-h-96 overflow-y-auto">
                {adjLog.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No adjustments yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead className="text-right">After</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adjLog.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{new Date(a.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={a.delta > 0 ? 'default' : 'destructive'}>
                              {a.delta > 0 ? '+' : ''}{a.delta}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{a.balance_after}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.note || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="gen" className="mt-3 max-h-96 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No generation history.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="text-xs">{new Date(h.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{h.operator}</TableCell>
                          <TableCell>
                            <Badge variant={h.status === 'success' ? 'default' : 'destructive'}>{h.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{h.cost}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
