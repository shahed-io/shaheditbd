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
  Users, Plus, Trash2, KeyRound, Wallet, ShieldCheck, Loader2, RefreshCw, Search,
} from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  is_admin: boolean;
  balance_cents: number;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_cids: number;
  total_balance_cents: number;
}

const callAdmin = async (body: object) => {
  const token = localStorage.getItem('rs_token');
  if (!token) throw new Error('No reseller session. Please login on the CID For Reseller page first.');
  const { data, error } = await supabase.functions.invoke('reseller-admin', { body: { ...body, token } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const AdminResellerAccounts = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newBalance, setNewBalance] = useState('0');
  const [topupAmount, setTopupAmount] = useState('');
  const [changePassword, setChangePassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        callAdmin({ action: 'list_users' }),
        callAdmin({ action: 'stats' }),
      ]);
      setUsers(usersRes.users || []);
      setStats(statsRes);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword) return;
    setActionLoading(true);
    try {
      await callAdmin({
        action: 'create_user',
        username: newUsername.trim(),
        password: newPassword,
        is_admin: newIsAdmin,
        balance_cents: parseInt(newBalance) || 0,
      });
      toast.success('User created successfully');
      setCreateOpen(false);
      setNewUsername(''); setNewPassword(''); setNewIsAdmin(false); setNewBalance('0');
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  };

  const handleTopup = async () => {
    if (!selectedUser || !topupAmount) return;
    setActionLoading(true);
    try {
      await callAdmin({ action: 'topup', user_id: selectedUser.id, amount_cents: parseInt(topupAmount) });
      toast.success('Balance added successfully');
      setTopupOpen(false); setTopupAmount('');
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !changePassword) return;
    setActionLoading(true);
    try {
      await callAdmin({ action: 'change_password', user_id: selectedUser.id, new_password: changePassword });
      toast.success('Password changed successfully');
      setPasswordOpen(false); setChangePassword('');
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await callAdmin({ action: 'delete_user', user_id: selectedUser.id });
      toast.success('User deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  };

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reseller Accounts</h1>
          <p className="text-muted-foreground text-sm">Reseller user management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New User
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
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total CIDs</p>
                  <p className="text-2xl font-bold">{stats.total_cids}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">৳{(stats.total_balance_cents / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">User List</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                  ) : filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>
                        <Badge variant={u.is_admin ? 'default' : 'secondary'}>
                          {u.is_admin ? 'Admin' : 'Reseller'}
                        </Badge>
                      </TableCell>
                      <TableCell>৳{(u.balance_cents / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('en-US')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(u); setTopupOpen(true); }}>
                            <Wallet className="h-3.5 w-3.5 mr-1" /> Top Up
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(u); setPasswordOpen(true); }}>
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => { setSelectedUser(u); setDeleteOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Reseller</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label className="text-sm font-medium">Initial Balance (cents)</label>
              <Input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} />
              Create as Admin
            </label>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topup Dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Balance Top Up — {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Current Balance: ৳{((selectedUser?.balance_cents || 0) / 100).toFixed(2)}</p>
            <div>
              <label className="text-sm font-medium">Top Up Amount (cents)</label>
              <Input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder="e.g. 1000 = ৳10" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleTopup} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Top Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Password — {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" value={changePassword} onChange={e => setChangePassword(e.target.value)} placeholder="Minimum 6 characters" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleChangePassword} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{selectedUser?.username}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResellerAccounts;
