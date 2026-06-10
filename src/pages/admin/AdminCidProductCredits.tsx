import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Coins, Plus, Search, RefreshCw, Loader2, Trash2, Power, PowerOff, Wand2, Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  status: string;
}

interface Mapping {
  id: string;
  product_id: string;
  cid_credits: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
}

const KEYWORD_PRESETS = ['windows', 'office', 'microsoft 365', 'ms office'];

export default function AdminCidProductCredits() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [defaultCredits, setDefaultCredits] = useState<number>(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>('1');

  const fetchAll = async () => {
    setLoading(true);
    const [m, p] = await Promise.all([
      supabase.from('cid_product_credits').select('*').order('updated_at', { ascending: false }),
      supabase.from('products').select('id, name, slug, image_url, status').order('name'),
    ]);
    const prods = (p.data || []) as Product[];
    const productMap = new Map(prods.map(x => [x.id, x]));
    const list = ((m.data || []) as Mapping[]).map(it => ({ ...it, product: productMap.get(it.product_id) }));
    setMappings(list);
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const mappedIds = useMemo(() => new Set(mappings.map(m => m.product_id)), [mappings]);

  const filteredMappings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mappings;
    return mappings.filter(m => (m.product?.name || '').toLowerCase().includes(q));
  }, [mappings, search]);

  const unmappedProducts = useMemo(() => {
    return products.filter(p => !mappedIds.has(p.id) && p.status === 'active');
  }, [products, mappedIds]);

  const filteredPicker = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return unmappedProducts;
    return unmappedProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [unmappedProducts, pickerSearch]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const togglePick = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }));

  const pickAllVisible = () => {
    const next: Record<string, boolean> = { ...selected };
    filteredPicker.forEach(p => { next[p.id] = true; });
    setSelected(next);
  };

  const clearPicks = () => setSelected({});

  const autoSelectWindowsOffice = () => {
    const next: Record<string, boolean> = {};
    unmappedProducts.forEach(p => {
      const n = p.name.toLowerCase();
      if (KEYWORD_PRESETS.some(k => n.includes(k))) next[p.id] = true;
    });
    setSelected(next);
    const c = Object.values(next).filter(Boolean).length;
    toast.success(`${c} Windows/Office product(s) selected`);
  };

  const handleBulkAdd = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (!ids.length) { toast.error('No products selected'); return; }
    if (!defaultCredits || defaultCredits < 1) { toast.error('Credits must be at least 1'); return; }
    setSaving(true);
    const rows = ids.map(product_id => ({
      product_id, cid_credits: defaultCredits, is_active: true,
    }));
    const { error } = await supabase.from('cid_product_credits').insert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} product(s) added`);
    setSelected({});
    setAddOpen(false);
    fetchAll();
  };

  const handleSaveCredits = async (id: string) => {
    const n = parseInt(editVal, 10);
    if (!n || n < 1) { toast.error('Must be ≥ 1'); return; }
    const { error } = await supabase.from('cid_product_credits')
      .update({ cid_credits: n, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setMappings(prev => prev.map(m => m.id === id ? { ...m, cid_credits: n } : m));
    setEditingRow(null);
    toast.success('Updated');
  };

  const handleToggleActive = async (m: Mapping) => {
    const next = !m.is_active;
    const { error } = await supabase.from('cid_product_credits')
      .update({ is_active: next, updated_at: new Date().toISOString() }).eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    setMappings(prev => prev.map(x => x.id === m.id ? { ...x, is_active: next } : x));
    toast.success(next ? 'Activated' : 'Deactivated');
  };

  const handleDelete = async (m: Mapping) => {
    if (!confirm(`Remove "${m.product?.name || m.product_id}" from auto-credit list?`)) return;
    const { error } = await supabase.from('cid_product_credits').delete().eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    setMappings(prev => prev.filter(x => x.id !== m.id));
    toast.success('Removed');
  };

  const stats = useMemo(() => ({
    total: mappings.length,
    active: mappings.filter(m => m.is_active).length,
    totalCredits: mappings.filter(m => m.is_active).reduce((s, m) => s + m.cid_credits, 0),
  }), [mappings]);

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Coins className="text-primary" size={22} />
            Product → CID Credit Mapping
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure which products automatically credit the customer's CID balance when an order completes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button size="sm" onClick={() => { setAddOpen(true); setSelected({}); setPickerSearch(''); }}>
            <Plus size={14} /> Add Products
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Mapped products</p>
          <p className="text-2xl font-black mt-1">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Active (auto-credit on)</p>
          <p className="text-2xl font-black mt-1 text-emerald-600">{stats.active}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Credits per 1 of each (sum)</p>
          <p className="text-2xl font-black mt-1 text-primary">{stats.totalCredits}</p>
        </CardContent></Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Mapped Products</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product name..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" /></div>
          ) : filteredMappings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Coins size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No product mappings yet</p>
              <p className="text-xs mt-1">Click "Add Products" to choose which products auto-credit CID.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-40">Credits / purchase</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {m.product?.image_url ? (
                            <img src={m.product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Coins size={14} /></div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{m.product?.name || '(Deleted product)'}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{m.product?.slug || m.product_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingRow === m.id ? (
                          <div className="flex gap-1">
                            <Input type="number" min={1} value={editVal} onChange={e => setEditVal(e.target.value)} className="h-8 w-20" />
                            <Button size="sm" variant="default" className="h-8 px-2" onClick={() => handleSaveCredits(m.id)}>
                              <Save size={12} />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingRow(null)}>✕</Button>
                          </div>
                        ) : (
                          <button
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition"
                            onClick={() => { setEditingRow(m.id); setEditVal(String(m.cid_credits)); }}
                          >
                            {m.cid_credits} CID
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.is_active ? 'default' : 'secondary'}>
                          {m.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleToggleActive(m)}
                            title={m.is_active ? 'Disable' : 'Enable'}>
                            {m.is_active ? <PowerOff size={13} /> : <Power size={13} className="text-emerald-600" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => handleDelete(m)} title="Remove">
                            <Trash2 size={13} />
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

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add products to auto-credit list</DialogTitle>
            <DialogDescription>
              Select one or more products. When a customer's order with these products is completed, their CID balance gets credited automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label className="text-xs">Credits per purchase (each)</Label>
              <Input type="number" min={1} value={defaultCredits}
                onChange={e => setDefaultCredits(parseInt(e.target.value) || 1)} className="mt-1" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" className="w-full" onClick={autoSelectWindowsOffice}>
                <Wand2 size={14} /> Auto-select Windows / Office
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
              placeholder="Search products..." className="pl-9" />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
            <span>{filteredPicker.length} available · {selectedCount} selected</span>
            <div className="flex gap-3">
              <button onClick={pickAllVisible} className="hover:text-primary font-semibold">Select visible</button>
              <button onClick={clearPicks} className="hover:text-destructive font-semibold">Clear</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg divide-y">
            {filteredPicker.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No unmapped active products match.
              </div>
            ) : filteredPicker.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/40 cursor-pointer">
                <input type="checkbox" checked={!!selected[p.id]} onChange={() => togglePick(p.id)}
                  className="w-4 h-4 accent-primary" />
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-9 h-9 rounded object-cover border" />
                ) : (
                  <div className="w-9 h-9 rounded bg-muted" />
                )}
                <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{p.slug}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleBulkAdd} disabled={saving || !selectedCount}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add {selectedCount || ''} {selectedCount === 1 ? 'product' : 'products'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
