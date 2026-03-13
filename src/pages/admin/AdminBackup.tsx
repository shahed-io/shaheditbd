import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database, Download, RefreshCw, CheckCircle, Clock, FileJson, Package, ShoppingCart, Users, Tag } from 'lucide-react';
import { toast } from 'sonner';

const AdminBackup = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    // Load local backup history
    const saved = localStorage.getItem('admin_backup_history');
    if (saved) setBackupHistory(JSON.parse(saved));
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const [products, orders, customers, coupons, categories] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('coupons').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
    ]);
    setStats({
      products: products.count || 0,
      orders: orders.count || 0,
      customers: customers.count || 0,
      coupons: coupons.count || 0,
      categories: categories.count || 0,
    });
    setLoading(false);
  };

  const exportTable = async (tableName: string, label: string) => {
    setExporting(tableName);
    try {
      const { data, error } = await supabase.from(tableName as any).select('*');
      if (error) throw error;

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Save to history
      const newEntry = { id: Date.now(), label, tableName, date: new Date().toISOString(), records: data?.length || 0 };
      const updated = [newEntry, ...backupHistory].slice(0, 10);
      setBackupHistory(updated);
      localStorage.setItem('admin_backup_history', JSON.stringify(updated));

      toast.success(`${label} ব্যাকআপ ডাউনলোড হয়েছে (${data?.length} রেকর্ড)`);
    } catch (e: any) {
      toast.error('এক্সপোর্ট ফেল হয়েছে: ' + e.message);
    }
    setExporting(null);
  };

  const exportAll = async () => {
    setExporting('all');
    try {
      const tables = ['products', 'orders', 'order_items', 'profiles', 'coupons', 'categories', 'support_tickets'];
      const results: Record<string, any[]> = {};
      for (const table of tables) {
        const { data } = await supabase.from(table as any).select('*');
        results[table] = data || [];
      }
      const json = JSON.stringify({ exported_at: new Date().toISOString(), tables: results }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shahed_store_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const newEntry = { id: Date.now(), label: 'Full Backup', tableName: 'all', date: new Date().toISOString(), records: Object.values(results).reduce((s, v) => s + v.length, 0) };
      const updated = [newEntry, ...backupHistory].slice(0, 10);
      setBackupHistory(updated);
      localStorage.setItem('admin_backup_history', JSON.stringify(updated));

      toast.success('সম্পূর্ণ ব্যাকআপ ডাউনলোড হয়েছে!');
    } catch (e: any) {
      toast.error('ফুল ব্যাকআপ ফেল: ' + e.message);
    }
    setExporting(null);
  };

  const tableExports = [
    { table: 'products', label: 'Products', icon: Package, count: stats.products },
    { table: 'orders', label: 'Orders', icon: ShoppingCart, count: stats.orders },
    { table: 'profiles', label: 'Customers', icon: Users, count: stats.customers },
    { table: 'coupons', label: 'Coupons', icon: Tag, count: stats.coupons },
    { table: 'categories', label: 'Categories', icon: Database, count: stats.categories },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Backup & <span className="gradient-text">Export</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">ডেটাবেস ব্যাকআপ এবং JSON এক্সপোর্ট</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStats} disabled={loading} className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
          </button>
          <button onClick={exportAll} disabled={!!exporting} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
            {exporting === 'all' ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Full Backup
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-card rounded-2xl p-4 border border-primary/20 bg-primary/5 flex items-start gap-3">
        <Database size={18} className="text-primary mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold text-foreground">ব্যাকআপ সম্পর্কে</div>
          <div className="text-xs text-muted-foreground mt-1">
            এখানে আপনি স্টোরের সমস্ত ডেটা JSON ফরম্যাটে ডাউনলোড করতে পারবেন। প্রতিটি টেবিলের ডেটা আলাদাভাবে বা একসাথে "Full Backup" হিসেবে ডাউনলোড করুন।
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tableExports.map(({ table, label, icon: Icon, count }) => (
          <div key={table} className="glass-card-hover rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon size={18} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{loading ? '...' : `${count} রেকর্ড`}</span>
            </div>
            <div className="font-bold text-foreground mb-1">{label}</div>
            <div className="text-xs text-muted-foreground mb-4">{table}.json হিসেবে ডাউনলোড</div>
            <button onClick={() => exportTable(table, label)} disabled={!!exporting}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                exporting === table ? 'glass-card text-primary border border-primary/30' : 'glass-card hover:border-primary/40 text-muted-foreground hover:text-foreground'
              }`}>
              {exporting === table ? <><RefreshCw size={13} className="animate-spin" /> এক্সপোর্ট হচ্ছে...</> : <><Download size={13} /> ডাউনলোড করুন</>}
            </button>
          </div>
        ))}
      </div>

      {/* Backup History */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock size={15} className="text-primary" /> ব্যাকআপ হিস্ট্রি
          </h3>
        </div>
        {backupHistory.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            <FileJson size={28} className="mx-auto mb-2 opacity-30" />
            এখনো কোনো ব্যাকআপ নেওয়া হয়নি
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {backupHistory.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-xl bg-green-400/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={15} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{entry.label}</div>
                  <div className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString('bn-BD')} · {entry.records} রেকর্ড</div>
                </div>
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">সফল</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBackup;
