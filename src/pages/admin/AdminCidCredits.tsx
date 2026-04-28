import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Coins, Plus, Minus, Search, RefreshCw, Loader2, History, User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface CidAccount {
  user_id: string;
  balance: number;
  total_added: number;
  total_used: number;
  updated_at: string;
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
  const [historyLoading, setHistoryLoading] = useState(false);

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
      let profMap = new Map<string, { display_name: string | null; email: string | null; phone: string | null }>();
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
      toast.success(`Balance updated. New: ${res.new_balance}`);
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
      const { data, error } = await supabase
        .from('cid_generations')
        .select('id, created_at, operator, number, status, cost')
        .eq('user_id', acc.user_id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setHistory((data || []) as GenerationLog[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" /> CID Credits Management
          </h1>
          <p className="text-sm text-muted-foreground">
            View every user's CID balance and add or deduct credits manually.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Users with Balance" value={totals.users} />
        <StatCard label="Total Balance" value={totals.balance} />
        <StatCard label="Total Added" value={totals.added} />
        <StatCard label="Total Used" value={totals.used} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base">All Accounts</CardTitle>
            <div className="relative sm:ml-auto w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or user ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={a.user_id}>
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
                        <Badge variant={a.balance > 0 ? 'default' : 'secondary'}>
                          {a.balance}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                        +{a.total_added}
                      </TableCell>
                      <TableCell className="text-right text-rose-600 dark:text-rose-400">
                        −{a.total_used}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(a.updated_at).toLocaleString()}
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

      {/* Adjust dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust CID Credits</DialogTitle>
            <DialogDescription>
              {editing?.display_name || editing?.email || editing?.user_id}
              <br />
              Current balance: <strong>{editing?.balance ?? 0}</strong>
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

      {/* History dialog */}
      <Dialog open={!!historyUser} onOpenChange={(o) => !o && setHistoryUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generation History</DialogTitle>
            <DialogDescription>
              {historyUser?.display_name || historyUser?.email || historyUser?.user_id}
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No generation history.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
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
            </div>
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
