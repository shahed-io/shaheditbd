import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users, DollarSign, MousePointerClick, TrendingUp, Settings as SettingsIcon,
  CheckCircle2, XCircle, Clock, Wallet, Search, Loader2, Save, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

interface Settings {
  id: number;
  is_enabled: boolean;
  default_commission_percent: number;
  customer_discount_percent: number;
  enable_customer_discount: boolean;
  enable_affiliate_commission: boolean;
  minimum_withdrawal: number;
  cookie_duration_days: number;
  auto_approve_applications: boolean;
  terms_and_conditions: string | null;
}

interface Account {
  id: string;
  user_id: string;
  referral_code: string;
  status: string;
  custom_commission_percent: number | null;
  custom_customer_discount_percent: number | null;
  available_balance: number;
  total_earned: number;
  total_paid: number;
  total_clicks: number;
  total_conversions: number;
  application_note: string | null;
  admin_note: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  website_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  other_social_url?: string | null;
  audience_size?: string | null;
  niche?: string | null;
  why_join?: string | null;
  promotion_strategy?: string | null;
  payout_method: string | null;
  payout_account: string | null;
  payout_account_name: string | null;
  approved_at: string | null;
  created_at: string;
  email?: string;
  display_name?: string;
}

interface Conversion {
  id: string;
  affiliate_id: string;
  order_number: string;
  order_total: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  referral_code?: string;
}

interface Withdrawal {
  id: string;
  affiliate_id: string;
  user_id: string;
  amount: number;
  method: string;
  account_number: string;
  account_name: string | null;
  status: string;
  admin_notes: string | null;
  transaction_id: string | null;
  requested_at: string;
  referral_code?: string;
}

interface ProductCommission {
  id: string;
  product_id: string;
  commission_percent: number;
  customer_discount_percent: number | null;
  is_active: boolean;
  product_name?: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-700 border-red-500/30',
  paid: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  suspended: 'bg-gray-500/15 text-gray-700 border-gray-500/30',
};

const AdminAffiliates = () => {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [productCommissions, setProductCommissions] = useState<ProductCommission[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [withdrawalAction, setWithdrawalAction] = useState<{ w: Withdrawal; action: 'paid' | 'rejected' } | null>(null);
  const [withdrawalTxId, setWithdrawalTxId] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');

  const [newProductCommission, setNewProductCommission] = useState({ product_id: '', commission_percent: 10, customer_discount_percent: 0 });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, accountsRes, conversionsRes, withdrawalsRes, pcRes, productsRes] = await Promise.all([
        supabase.from('affiliate_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('affiliate_accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_conversions').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('affiliate_withdrawals').select('*').order('requested_at', { ascending: false }).limit(200),
        supabase.from('affiliate_product_commissions').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, name').eq('status', 'active').order('name').limit(500),
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data);
      } else {
        // Initialize defaults if missing
        const { data: created } = await supabase.from('affiliate_settings').insert({ id: 1 }).select().single();
        if (created) setSettings(created);
      }

      const accs = (accountsRes.data || []) as Account[];

      // Hydrate accounts with profile email/display_name
      if (accs.length) {
        const userIds = accs.map(a => a.user_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, email, display_name').in('user_id', userIds);
        const map = new Map((profiles || []).map(p => [p.user_id, p]));
        accs.forEach(a => {
          const p = map.get(a.user_id);
          a.email = p?.email || '';
          a.display_name = p?.display_name || '';
        });
      }
      setAccounts(accs);

      const convs = (conversionsRes.data || []) as Conversion[];
      const accMap = new Map(accs.map(a => [a.id, a.referral_code]));
      convs.forEach(c => { c.referral_code = accMap.get(c.affiliate_id) || ''; });
      setConversions(convs);

      const ws = (withdrawalsRes.data || []) as Withdrawal[];
      ws.forEach(w => { w.referral_code = accMap.get(w.affiliate_id) || ''; });
      setWithdrawals(ws);

      const prods = (productsRes.data || []) as { id: string; name: string }[];
      setProducts(prods);
      const pcs = (pcRes.data || []) as ProductCommission[];
      const prodMap = new Map(prods.map(p => [p.id, p.name]));
      pcs.forEach(pc => { pc.product_name = prodMap.get(pc.product_id) || 'Unknown'; });
      setProductCommissions(pcs);
    } catch (e: any) {
      toast.error('Failed to load affiliate data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('affiliate_settings')
      .update({
        is_enabled: settings.is_enabled,
        default_commission_percent: settings.default_commission_percent,
        customer_discount_percent: settings.customer_discount_percent,
        enable_customer_discount: settings.enable_customer_discount,
        enable_affiliate_commission: settings.enable_affiliate_commission,
        minimum_withdrawal: settings.minimum_withdrawal,
        cookie_duration_days: settings.cookie_duration_days,
        auto_approve_applications: settings.auto_approve_applications,
        terms_and_conditions: settings.terms_and_conditions,
      })
      .eq('id', 1);
    setSavingSettings(false);
    if (error) toast.error('Save failed: ' + error.message);
    else toast.success('Settings saved');
  };

  const updateAccountStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === 'approved') update.approved_at = new Date().toISOString();
    const { error } = await supabase.from('affiliate_accounts').update(update).eq('id', id);
    if (error) return toast.error('Update failed: ' + error.message);
    toast.success(`Account ${status}`);
    fetchAll();
  };

  const saveEditAccount = async () => {
    if (!editingAccount) return;
    const { error } = await supabase
      .from('affiliate_accounts')
      .update({
        custom_commission_percent: editingAccount.custom_commission_percent,
        custom_customer_discount_percent: editingAccount.custom_customer_discount_percent,
        admin_note: editingAccount.admin_note,
        status: editingAccount.status,
      })
      .eq('id', editingAccount.id);
    if (error) return toast.error('Save failed: ' + error.message);
    toast.success('Account updated');
    setEditingAccount(null);
    fetchAll();
  };

  const handleConversion = async (id: string, action: 'approve' | 'reject') => {
    const fn = action === 'approve' ? 'approve_affiliate_conversion' : 'reject_affiliate_conversion';
    const args: any = action === 'approve' ? { p_conversion_id: id } : { p_conversion_id: id, p_reason: 'Rejected by admin' };
    const { data, error } = await (supabase as any).rpc(fn, args);
    if (error || !data?.success) return toast.error(data?.error || error?.message || 'Failed');
    toast.success(`Conversion ${action}d`);
    fetchAll();
  };

  const submitWithdrawalAction = async () => {
    if (!withdrawalAction) return;
    const { data, error } = await (supabase as any).rpc('process_affiliate_withdrawal', {
      p_withdrawal_id: withdrawalAction.w.id,
      p_action: withdrawalAction.action,
      p_transaction_id: withdrawalTxId || null,
      p_admin_notes: withdrawalNotes || null,
    });
    if (error || !data?.success) return toast.error(data?.error || error?.message || 'Failed');
    toast.success('Withdrawal updated');
    setWithdrawalAction(null);
    setWithdrawalTxId('');
    setWithdrawalNotes('');
    fetchAll();
  };

  const addProductCommission = async () => {
    if (!newProductCommission.product_id) return toast.error('Select a product');
    const { error } = await supabase
      .from('affiliate_product_commissions')
      .upsert({
        product_id: newProductCommission.product_id,
        commission_percent: newProductCommission.commission_percent,
        customer_discount_percent: newProductCommission.customer_discount_percent,
        is_active: true,
      }, { onConflict: 'product_id' });
    if (error) return toast.error('Failed: ' + error.message);
    toast.success('Product commission saved');
    setNewProductCommission({ product_id: '', commission_percent: 10, customer_discount_percent: 0 });
    fetchAll();
  };

  const toggleProductCommission = async (id: string, is_active: boolean) => {
    await supabase.from('affiliate_product_commissions').update({ is_active }).eq('id', id);
    fetchAll();
  };

  const deleteProductCommission = async (id: string) => {
    if (!confirm('Delete this commission rule?')) return;
    await supabase.from('affiliate_product_commissions').delete().eq('id', id);
    fetchAll();
    toast.success('Deleted');
  };

  // Stats
  const stats = {
    totalAffiliates: accounts.filter(a => a.status === 'approved').length,
    pendingApps: accounts.filter(a => a.status === 'pending').length,
    totalCommissionPaid: accounts.reduce((s, a) => s + Number(a.total_paid), 0),
    pendingPayouts: withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0),
    pendingConversions: conversions.filter(c => c.status === 'pending').length,
    totalClicks: accounts.reduce((s, a) => s + a.total_clicks, 0),
  };

  const filteredAccounts = accounts.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (accountSearch) {
      const q = accountSearch.toLowerCase();
      return a.referral_code.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q) || (a.display_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage applications, commissions, conversions & payouts</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Active Affiliates" value={stats.totalAffiliates} color="text-emerald-600" />
        <StatCard icon={Clock} label="Pending Apps" value={stats.pendingApps} color="text-amber-600" />
        <StatCard icon={CheckCircle2} label="Pending Conv." value={stats.pendingConversions} color="text-blue-600" />
        <StatCard icon={Wallet} label="Pending Payouts" value={`৳${stats.pendingPayouts.toFixed(0)}`} color="text-purple-600" />
        <StatCard icon={DollarSign} label="Total Paid" value={`৳${stats.totalCommissionPaid.toFixed(0)}`} color="text-green-600" />
        <StatCard icon={MousePointerClick} label="Total Clicks" value={stats.totalClicks} color="text-pink-600" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview">Settings</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* SETTINGS */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {settings && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2"><SettingsIcon size={18} /> Global Settings</h3>
                <Button onClick={saveSettings} disabled={savingSettings} size="sm">
                  {savingSettings ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                  Save Settings
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <ToggleRow label="Enable Affiliate Program" desc="Master switch for the entire system"
                  checked={settings.is_enabled}
                  onChange={v => setSettings({ ...settings, is_enabled: v })} />
                <ToggleRow label="Affiliate Commission" desc="Pay commission to affiliates on referred orders"
                  checked={settings.enable_affiliate_commission}
                  onChange={v => setSettings({ ...settings, enable_affiliate_commission: v })} />
                <ToggleRow label="Customer Discount" desc="Give discount to customers using affiliate links"
                  checked={settings.enable_customer_discount}
                  onChange={v => setSettings({ ...settings, enable_customer_discount: v })} />
                <ToggleRow label="Auto-approve Applications" desc="Skip manual review of new affiliates"
                  checked={settings.auto_approve_applications}
                  onChange={v => setSettings({ ...settings, auto_approve_applications: v })} />
              </div>

              <div className="grid md:grid-cols-4 gap-3 pt-2 border-t border-border">
                <NumField label="Default Commission %" value={settings.default_commission_percent}
                  onChange={v => setSettings({ ...settings, default_commission_percent: v })} />
                <NumField label="Customer Discount %" value={settings.customer_discount_percent}
                  onChange={v => setSettings({ ...settings, customer_discount_percent: v })} />
                <NumField label="Min Withdrawal (৳)" value={settings.minimum_withdrawal}
                  onChange={v => setSettings({ ...settings, minimum_withdrawal: v })} />
                <NumField label="Cookie Duration (days)" value={settings.cookie_duration_days}
                  onChange={v => setSettings({ ...settings, cookie_duration_days: v })} />
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions (shown on application)</Label>
                <Textarea
                  rows={5}
                  placeholder="Enter terms..."
                  value={settings.terms_and_conditions || ''}
                  onChange={e => setSettings({ ...settings, terms_and_conditions: e.target.value })}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* ACCOUNTS */}
        <TabsContent value="accounts" className="space-y-3 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search code, email, name..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Commission %</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Clicks / Conv.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No accounts found</TableCell></TableRow>
                ) : filteredAccounts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-semibold">{a.referral_code}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{a.display_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[a.status] || ''} variant="outline">{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{a.custom_commission_percent ?? `${settings?.default_commission_percent}*`}%</TableCell>
                    <TableCell className="text-right">৳{Number(a.total_earned).toFixed(0)}</TableCell>
                    <TableCell className="text-right text-xs">{a.total_clicks} / {a.total_conversions}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {a.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-emerald-700 border-emerald-500/30" onClick={() => updateAccountStatus(a.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-700 border-red-500/30" onClick={() => updateAccountStatus(a.id, 'rejected')}>Reject</Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingAccount(a)}><Edit3 size={13} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* CONVERSIONS */}
        <TabsContent value="conversions" className="space-y-3 mt-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead className="text-right">Order Total</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No conversions yet</TableCell></TableRow>
                ) : conversions.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.order_number}</TableCell>
                    <TableCell className="font-mono">{c.referral_code}</TableCell>
                    <TableCell className="text-right">৳{Number(c.order_total).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">৳{Number(c.commission_amount).toFixed(2)} <span className="text-xs text-muted-foreground">({Number(c.commission_percent).toFixed(1)}%)</span></TableCell>
                    <TableCell><Badge className={STATUS_BADGE[c.status]} variant="outline">{c.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {c.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-emerald-700 border-emerald-500/30" onClick={() => handleConversion(c.id, 'approve')}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-700 border-red-500/30" onClick={() => handleConversion(c.id, 'reject')}>Reject</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">💡 When an order status changes to <strong>completed</strong>, pending conversions are auto-approved and credited to the affiliate's wallet.</p>
        </TabsContent>

        {/* WITHDRAWALS */}
        <TabsContent value="withdrawals" className="space-y-3 mt-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No withdrawals yet</TableCell></TableRow>
                ) : withdrawals.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono">{w.referral_code}</TableCell>
                    <TableCell className="text-right font-semibold">৳{Number(w.amount).toFixed(0)}</TableCell>
                    <TableCell className="capitalize">{w.method}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-mono">{w.account_number}</div>
                      {w.account_name && <div className="text-muted-foreground">{w.account_name}</div>}
                    </TableCell>
                    <TableCell><Badge className={STATUS_BADGE[w.status]} variant="outline">{w.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {w.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-blue-700 border-blue-500/30" onClick={() => { setWithdrawalAction({ w, action: 'paid' }); setWithdrawalTxId(''); setWithdrawalNotes(''); }}>Mark Paid</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-700 border-red-500/30" onClick={() => { setWithdrawalAction({ w, action: 'rejected' }); setWithdrawalTxId(''); setWithdrawalNotes(''); }}>Reject</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* PRODUCT COMMISSIONS */}
        <TabsContent value="products" className="space-y-3 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold">Add / Update Product Commission</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <select value={newProductCommission.product_id}
                onChange={e => setNewProductCommission({ ...newProductCommission, product_id: e.target.value })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2">
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input type="number" placeholder="Commission %" value={newProductCommission.commission_percent}
                onChange={e => setNewProductCommission({ ...newProductCommission, commission_percent: Number(e.target.value) })} />
              <Input type="number" placeholder="Customer discount %" value={newProductCommission.customer_discount_percent}
                onChange={e => setNewProductCommission({ ...newProductCommission, customer_discount_percent: Number(e.target.value) })} />
            </div>
            <Button onClick={addProductCommission} size="sm">Save Product Commission</Button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Commission %</TableHead>
                  <TableHead className="text-right">Customer Discount %</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productCommissions.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No per-product overrides. Default commission applies.</TableCell></TableRow>
                ) : productCommissions.map(pc => (
                  <TableRow key={pc.id}>
                    <TableCell>{pc.product_name}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(pc.commission_percent).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{pc.customer_discount_percent ? `${Number(pc.customer_discount_percent).toFixed(1)}%` : '—'}</TableCell>
                    <TableCell><Switch checked={pc.is_active} onCheckedChange={v => toggleProductCommission(pc.id, v)} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600 h-7 px-2" onClick={() => deleteProductCommission(pc.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Account Modal */}
      <Dialog open={!!editingAccount} onOpenChange={o => !o && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Affiliate</DialogTitle></DialogHeader>
          {editingAccount && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <div><strong>{editingAccount.display_name || '—'}</strong> ({editingAccount.email})</div>
                <div className="font-mono text-xs text-muted-foreground">Code: {editingAccount.referral_code}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Custom Commission %</Label>
                  <Input type="number" step="0.1"
                    placeholder={`Default ${settings?.default_commission_percent}%`}
                    value={editingAccount.custom_commission_percent ?? ''}
                    onChange={e => setEditingAccount({ ...editingAccount, custom_commission_percent: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Custom Discount %</Label>
                  <Input type="number" step="0.1"
                    placeholder="Optional"
                    value={editingAccount.custom_customer_discount_percent ?? ''}
                    onChange={e => setEditingAccount({ ...editingAccount, custom_customer_discount_percent: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select value={editingAccount.status}
                  onChange={e => setEditingAccount({ ...editingAccount, status: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Admin Note (private)</Label>
                <Textarea rows={3} value={editingAccount.admin_note || ''}
                  onChange={e => setEditingAccount({ ...editingAccount, admin_note: e.target.value })} />
              </div>
              {(editingAccount.applicant_name || editingAccount.applicant_email || editingAccount.website_url || editingAccount.facebook_url || editingAccount.why_join) && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="text-xs font-bold text-foreground">📋 Application Details</div>
                  {editingAccount.applicant_name && <div className="text-xs"><strong>Name:</strong> {editingAccount.applicant_name}</div>}
                  {editingAccount.applicant_email && <div className="text-xs"><strong>Email:</strong> {editingAccount.applicant_email}</div>}
                  {editingAccount.applicant_phone && <div className="text-xs"><strong>Phone:</strong> {editingAccount.applicant_phone}</div>}
                  {editingAccount.niche && <div className="text-xs"><strong>Niche:</strong> {editingAccount.niche}</div>}
                  {editingAccount.audience_size && <div className="text-xs"><strong>Audience:</strong> {editingAccount.audience_size}</div>}
                  {editingAccount.website_url && <div className="text-xs"><strong>Website:</strong> <a href={editingAccount.website_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{editingAccount.website_url}</a></div>}
                  {editingAccount.facebook_url && <div className="text-xs"><strong>Facebook:</strong> <a href={editingAccount.facebook_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{editingAccount.facebook_url}</a></div>}
                  {editingAccount.youtube_url && <div className="text-xs"><strong>YouTube:</strong> <a href={editingAccount.youtube_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{editingAccount.youtube_url}</a></div>}
                  {editingAccount.other_social_url && <div className="text-xs"><strong>Social:</strong> <a href={editingAccount.other_social_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{editingAccount.other_social_url}</a></div>}
                  {editingAccount.why_join && <div className="text-xs mt-2"><strong>কেন যোগ দিতে চান:</strong><div className="text-muted-foreground mt-1 whitespace-pre-wrap">{editingAccount.why_join}</div></div>}
                  {editingAccount.promotion_strategy && <div className="text-xs mt-2"><strong>প্রমোশন স্ট্র্যাটেজি:</strong><div className="text-muted-foreground mt-1 whitespace-pre-wrap">{editingAccount.promotion_strategy}</div></div>}
                </div>
              )}
              {editingAccount.application_note && (
                <div className="text-xs p-3 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">Additional note:</div>
                  <div>{editingAccount.application_note}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>Cancel</Button>
            <Button onClick={saveEditAccount}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Action Modal */}
      <Dialog open={!!withdrawalAction} onOpenChange={o => !o && setWithdrawalAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{withdrawalAction?.action === 'paid' ? 'Mark Withdrawal as Paid' : 'Reject Withdrawal'}</DialogTitle>
          </DialogHeader>
          {withdrawalAction && (
            <div className="space-y-4">
              <div className="text-sm bg-muted rounded-lg p-3 space-y-1">
                <div>Amount: <strong>৳{Number(withdrawalAction.w.amount).toFixed(0)}</strong></div>
                <div>Method: {withdrawalAction.w.method}</div>
                <div>Account: <span className="font-mono">{withdrawalAction.w.account_number}</span></div>
                {withdrawalAction.w.account_name && <div>Name: {withdrawalAction.w.account_name}</div>}
              </div>
              {withdrawalAction.action === 'paid' && (
                <div className="space-y-1.5">
                  <Label>Transaction ID *</Label>
                  <Input value={withdrawalTxId} onChange={e => setWithdrawalTxId(e.target.value)} placeholder="TRX12345..." />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea rows={3} value={withdrawalNotes} onChange={e => setWithdrawalNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawalAction(null)}>Cancel</Button>
            <Button onClick={submitWithdrawalAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-card border border-border rounded-2xl p-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={14} className={color} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

const ToggleRow = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/30">
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const NumField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <Input type="number" step="0.01" value={value} onChange={e => onChange(Number(e.target.value))} />
  </div>
);

export default AdminAffiliates;
