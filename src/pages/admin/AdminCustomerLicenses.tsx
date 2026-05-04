import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, KeyRound, Plus, Trash2, Save, User, Mail, Phone, Package, Loader2, RefreshCw } from 'lucide-react';

interface CustomerHit {
  user_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
}

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  license_key: string | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  user_id: string | null;
  order_items: OrderItem[];
}

const ORDER_STATUSES = ['pending', 'processing', 'completed', 'delivered', 'cancelled', 'refunded', 'failed'];

export default function AdminCustomerLicenses() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [customers, setCustomers] = useState<CustomerHit[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<CustomerHit | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit dialog state
  const [editItem, setEditItem] = useState<{ orderId: string; item: OrderItem } | null>(null);
  const [editKey, setEditKey] = useState('');
  const [saving, setSaving] = useState(false);

  // Add new item dialog state
  const [addOrderId, setAddOrderId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  // ===== Search customers =====
  const search = async () => {
    const q = query.trim();
    if (!q) { toast.error('Type an email, phone, or name to search'); return; }
    setSearching(true);
    setCustomers([]);
    setActiveCustomer(null);
    setOrders([]);
    try {
      // Search profiles
      const { data: profileHits } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, phone')
        .or(`email.ilike.%${q}%,phone.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(20);

      const map = new Map<string, CustomerHit>();
      (profileHits || []).forEach((p: any) => {
        const k = (p.email || p.phone || p.user_id || '').toLowerCase();
        if (k) map.set(k, { user_id: p.user_id, display_name: p.display_name, email: p.email, phone: p.phone });
      });

      // Also search orders directly (covers guest checkouts)
      const { data: orderHits } = await supabase
        .from('orders')
        .select('user_id, customer_name, customer_email, customer_phone')
        .or(`customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_name.ilike.%${q}%`)
        .limit(50);

      (orderHits || []).forEach((o: any) => {
        const k = (o.customer_email || o.customer_phone || '').toLowerCase();
        if (!k) return;
        if (!map.has(k)) {
          map.set(k, {
            user_id: o.user_id,
            display_name: o.customer_name,
            email: o.customer_email,
            phone: o.customer_phone,
          });
        }
      });

      const list = Array.from(map.values());
      setCustomers(list);
      if (list.length === 0) toast.info('No customers found');
      else if (list.length === 1) loadOrders(list[0]);
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  // ===== Load all orders for a customer =====
  const loadOrders = async (c: CustomerHit) => {
    setActiveCustomer(c);
    setLoadingOrders(true);
    setOrders([]);
    try {
      let q = supabase
        .from('orders')
        .select('id, order_number, status, payment_status, total, created_at, customer_email, customer_name, customer_phone, user_id, order_items(id, product_id, product_name, quantity, license_key)')
        .order('created_at', { ascending: false });

      // Match by user_id OR by email/phone (handles guest orders too)
      const orFilters: string[] = [];
      if (c.user_id) orFilters.push(`user_id.eq.${c.user_id}`);
      if (c.email) orFilters.push(`customer_email.eq.${c.email}`);
      if (c.phone) orFilters.push(`customer_phone.eq.${c.phone}`);

      if (orFilters.length === 0) { setLoadingOrders(false); return; }
      q = q.or(orFilters.join(','));

      const { data, error } = await q;
      if (error) throw error;
      setOrders((data || []) as any);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const refresh = () => { if (activeCustomer) loadOrders(activeCustomer); };

  // ===== Update order status =====
  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status: status as any }).eq('id', orderId);
    if (error) { toast.error(error.message); return; }
    toast.success('Order status updated');
    refresh();
  };

  // ===== Save license key edit =====
  const openEdit = (orderId: string, item: OrderItem) => {
    setEditItem({ orderId, item });
    setEditKey(item.license_key || '');
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ license_key: editKey.trim() || null })
        .eq('id', editItem.item.id);
      if (error) throw error;
      toast.success('License key updated');
      setEditItem(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ===== Remove order item =====
  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this item from the order?')) return;
    const { error } = await supabase.from('order_items').delete().eq('id', itemId);
    if (error) { toast.error(error.message); return; }
    toast.success('Item removed');
    refresh();
  };

  // ===== Add new item =====
  const openAdd = (orderId: string) => {
    setAddOrderId(orderId);
    setNewProductName('');
    setNewLicenseKey('');
    setNewQty(1);
    setNewPrice(0);
  };

  const saveAdd = async () => {
    if (!addOrderId || !newProductName.trim()) { toast.error('Product name required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('order_items').insert({
        order_id: addOrderId,
        product_name: newProductName.trim(),
        quantity: newQty,
        price: newPrice,
        total: newPrice * newQty,
        license_key: newLicenseKey.trim() || null,
      });
      if (error) throw error;
      toast.success('Item added to order');
      setAddOrderId(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <KeyRound className="text-primary" /> Customer Licenses Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search a customer by email/phone/name and edit, add, or remove licenses on any of their orders.
        </p>
      </div>

      {/* Search bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search by email, phone, or name…"
            className="pl-9"
          />
        </div>
        <Button onClick={search} disabled={searching}>
          {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          <span className="ml-2">Search</span>
        </Button>
      </Card>

      {/* Customer list */}
      {customers.length > 1 && (
        <Card className="p-4 space-y-2">
          <p className="text-sm font-semibold mb-2">{customers.length} customers found — pick one:</p>
          {customers.map((c, i) => (
            <button
              key={c.user_id || c.email || i}
              onClick={() => loadOrders(c)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                activeCustomer?.email === c.email && activeCustomer?.phone === c.phone
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="font-medium flex items-center gap-1"><User size={14} /> {c.display_name || '—'}</span>
                {c.email && <span className="text-muted-foreground flex items-center gap-1"><Mail size={12} /> {c.email}</span>}
                {c.phone && <span className="text-muted-foreground flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                {!c.user_id && <Badge variant="outline" className="text-[10px]">Guest</Badge>}
              </div>
            </button>
          ))}
        </Card>
      )}

      {/* Active customer + orders */}
      {activeCustomer && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{activeCustomer.display_name || 'Customer'}</p>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                {activeCustomer.email && <span><Mail size={11} className="inline mr-1" />{activeCustomer.email}</span>}
                {activeCustomer.phone && <span><Phone size={11} className="inline mr-1" />{activeCustomer.phone}</span>}
                <span>{orders.length} orders</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loadingOrders}>
              <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
              <span className="ml-2">Refresh</span>
            </Button>
          </Card>

          {loadingOrders && <p className="text-center text-sm text-muted-foreground">Loading orders…</p>}

          {!loadingOrders && orders.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">No orders found for this customer.</Card>
          )}

          {orders.map((o) => (
            <Card key={o.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
                <div>
                  <p className="font-bold text-base">#{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()} · ৳{Number(o.total).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Badge variant={o.payment_status === 'paid' ? 'default' : 'outline'}>{o.payment_status}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                {o.order_items.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No items in this order.</p>
                )}
                {o.order_items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                    <Package className="text-primary mt-0.5" size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      {item.license_key ? (
                        <p className="text-xs font-mono mt-1 break-all bg-background px-2 py-1 rounded border inline-block max-w-full">
                          {item.license_key}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-1">No license assigned</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEdit(o.id, item)}>
                        <KeyRound size={13} /><span className="ml-1 hidden sm:inline">Edit Key</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive">
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => openAdd(o.id)} className="w-full mt-2">
                  <Plus size={14} className="mr-1" /> Add Item / License
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit License Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit License Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{editItem?.item.product_name}</p>
            <Textarea
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              placeholder="Enter license key, email|password, or any delivery info"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: Use <code>email|password</code> format for credentials. Leave blank to clear.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span className="ml-2">Save</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!addOrderId} onOpenChange={(o) => !o && setAddOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Product Name *</label>
              <Input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g. Office 365 — 1 Year" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Quantity</label>
                <Input type="number" min={1} value={newQty} onChange={(e) => setNewQty(Math.max(1, +e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium">Price (৳)</label>
                <Input type="number" min={0} value={newPrice} onChange={(e) => setNewPrice(+e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">License Key (optional)</label>
              <Textarea value={newLicenseKey} onChange={(e) => setNewLicenseKey(e.target.value)} rows={3} className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOrderId(null)}>Cancel</Button>
            <Button onClick={saveAdd} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              <span className="ml-2">Add</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
