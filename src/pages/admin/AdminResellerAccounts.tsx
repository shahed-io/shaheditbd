import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, Wallet, ShieldCheck, Loader2, RefreshCw, Search,
  UserPlus, UserMinus, Power, PowerOff,
} from 'lucide-react';

interface AppUser {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

interface ResellerProfile {
  user_id: string;
  balance_cents: number;
  is_active: boolean;
}

interface ResellerRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  balance_cents: number;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  total_resellers: number;
  active_resellers: number;
  total_balance_cents: number;
}

const AdminResellerAccounts = () => {
  const [resellers, setResellers] = useState<ResellerRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [grantOpen, setGrantOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selected, setSelected] = useState<ResellerRow | null>(null);

  // Grant flow state
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Topup state
  const [topupAmountTk, setTopupAmountTk] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Fetch reseller list (joined with profiles) ─────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get reseller role assignments
      const { data: roleRows, error: roleErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'reseller');
      if (roleErr) throw roleErr;

      const resellerUserIds = (roleRows ?? []).map(r => r.user_id);

      if (resellerUserIds.length === 0) {
        setResellers([]);
        setStats({ total_resellers: 0, active_resellers: 0, total_balance_cents: 0 });
        return;
      }

      const [profilesRes, accountsRes] = await Promise.all([
        supabase
          .from('reseller_profiles')
          .select('user_id, balance_cents, is_active')
          .in('user_id', resellerUserIds),
        supabase
          .from('profiles')
          .select('user_id, email, display_name, created_at')
          .in('user_id', resellerUserIds),
      ]);

      const profileMap = new Map<string, ResellerProfile>(
        (profilesRes.data ?? []).map(p => [p.user_id, p as ResellerProfile])
      );
      const accountMap = new Map<string, AppUser>(
        (accountsRes.data ?? []).map(a => [a.user_id, a as AppUser])
      );

      const rows: ResellerRow[] = resellerUserIds.map(uid => {
        const prof = profileMap.get(uid);
        const acc  = accountMap.get(uid);
        return {
          user_id: uid,
          email: acc?.email ?? null,
          display_name: acc?.display_name ?? null,
          balance_cents: prof?.balance_cents ?? 0,
          is_active: prof?.is_active ?? true,
          created_at: acc?.created_at ?? new Date().toISOString(),
        };
      });

      const totalBalance = rows.reduce((sum, r) => sum + r.balance_cents, 0);
      const activeCount  = rows.filter(r => r.is_active).length;

      setResellers(rows);
      setStats({
        total_resellers: rows.length,
        active_resellers: activeCount,
        total_balance_cents: totalBalance,
      });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Search users to grant reseller role ─────────────────────────────
  const searchUsers = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      // Get current reseller user_ids to exclude
      const existingIds = new Set(resellers.map(r => r.user_id));

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name, created_at')
        .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(20);
      if (error) throw error;
      const filtered = (data ?? []).filter(u => !existingIds.has(u.user_id));
      setSearchResults(filtered as AppUser[]);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSearching(false);
    }
  }, [resellers]);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch, searchUsers]);

  // ─── Grant reseller role ────────────────────────────────────────────
  const handleGrant = async (targetUserId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: targetUserId, role: 'reseller' });
      if (error) {
        if (error.code === '23505') throw new Error('User is already a reseller');
        throw error;
      }
      toast.success('Reseller role granted');
      setGrantOpen(false);
      setUserSearch('');
      setSearchResults([]);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Revoke reseller role ───────────────────────────────────────────
  const handleRevoke = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selected.user_id)
        .eq('role', 'reseller');
      if (error) throw error;
      toast.success('Reseller role revoked');
      setRevokeOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Top up reseller balance (in BDT taka, 1 USD = 100 cents = ৳118 approx; we store cents matching $) ──
  // Actually: cents represent USD cents per CID pricing. Admin enters dollars.
  const handleTopup = async () => {
    if (!selected || !topupAmountTk) return;
    const dollars = parseFloat(topupAmountTk);
    if (isNaN(dollars) || dollars <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setActionLoading(true);
    try {
      const newBalance = selected.balance_cents + Math.round(dollars * 100);
      const { error } = await supabase
        .from('reseller_profiles')
        .update({ balance_cents: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', selected.user_id);
      if (error) throw error;
      toast.success(`Added $${dollars.toFixed(2)} to ${selected.email}`);
      setTopupOpen(false);
      setTopupAmountTk('');
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Toggle active ──────────────────────────────────────────────────
  const handleToggleActive = async (row: ResellerRow) => {
    try {
      const { error } = await supabase
        .from('reseller_profiles')
        .update({ is_active: !row.is_active, updated_at: new Date().toISOString() })
        .eq('user_id', row.user_id);
      if (error) throw error;
      toast.success(row.is_active ? 'Account suspended' : 'Account activated');
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const filtered = resellers.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reseller Accounts</h1>
          <p className="text-muted-foreground text-sm">Grant reseller access to existing user accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setGrantOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Grant Reseller Role
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Resellers</p>
                  <p className="text-2xl font-bold">{stats.total_resellers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active_resellers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance (USD)</p>
                  <p className="text-2xl font-bold">${(stats.total_balance_cents / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Reseller List</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No resellers found. Click "Grant Reseller Role" to add one.</TableCell></TableRow>
                  ) : filtered.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="font-medium">{u.display_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{u.email || u.user_id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'default' : 'secondary'}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">${(u.balance_cents / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('en-US')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setSelected(u); setTopupOpen(true); }}>
                            <Wallet className="h-3.5 w-3.5 mr-1" /> Top Up
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleToggleActive(u)}>
                            {u.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => { setSelected(u); setRevokeOpen(true); }}>
                            <UserMinus className="h-3.5 w-3.5" />
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

      {/* Grant Role Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Reseller Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Search users by email or name</label>
              <Input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="At least 2 characters..."
              />
            </div>
            <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
              {searching ? (
                <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 mx-auto animate-spin" /></div>
              ) : searchResults.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {userSearch.length < 2 ? 'Type to search for users' : 'No matching users found'}
                </p>
              ) : searchResults.map(u => (
                <div key={u.user_id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">{u.display_name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <Button size="sm" onClick={() => handleGrant(u.user_id)} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Grant'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topup Dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Balance — {selected?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Current Balance: ${((selected?.balance_cents || 0) / 100).toFixed(2)}</p>
            <div>
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                step="0.01"
                value={topupAmountTk}
                onChange={e => setTopupAmountTk(e.target.value)}
                placeholder="e.g. 10.00"
              />
              <p className="text-xs text-muted-foreground mt-1">Each CID generation costs $1.00</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleTopup} disabled={actionLoading || !topupAmountTk}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revoke Reseller Role</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Remove reseller access from <strong>{selected?.email}</strong>?
            <br />Their balance and history will be preserved but they will lose access to the portal.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleRevoke} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResellerAccounts;
