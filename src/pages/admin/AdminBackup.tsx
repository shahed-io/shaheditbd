import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Database, Download, RefreshCw, CheckCircle, Clock, FileJson,
  Package, ShoppingCart, Users, Tag, Upload, AlertTriangle,
  Shield, RotateCcw, Trash2, ChevronDown, ChevronUp, Loader2,
  HardDrive, BarChart3, BookOpen, Ticket, Key, Grid3X3
} from 'lucide-react';
import { toast } from 'sonner';

type BackupEntry = {
  id: number;
  label: string;
  tableName: string;
  date: string;
  records: number;
  type: 'export' | 'import';
  status: 'success' | 'error';
  error?: string;
};

const TABLES = [
  { table: 'products',       label: 'Products',        icon: Package,      color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  { table: 'categories',     label: 'Categories',      icon: Grid3X3,      color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  { table: 'orders',         label: 'Orders',          icon: ShoppingCart, color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  { table: 'order_items',    label: 'Order Items',     icon: Tag,          color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  { table: 'profiles',       label: 'Customers',       icon: Users,        color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { table: 'coupons',        label: 'Coupons',         icon: Tag,          color: 'text-pink-400',    bg: 'bg-pink-400/10' },
  { table: 'license_keys',   label: 'License Keys',    icon: Key,          color: 'text-cyan-400',    bg: 'bg-cyan-400/10' },
  { table: 'blog_posts',     label: 'Blog Posts',      icon: BookOpen,     color: 'text-indigo-400',  bg: 'bg-indigo-400/10' },
  { table: 'support_tickets',label: 'Support Tickets', icon: Ticket,       color: 'text-red-400',     bg: 'bg-red-400/10' },
  { table: 'site_settings',  label: 'Site Settings',   icon: Database,     color: 'text-primary',     bg: 'bg-primary/10' },
];

const AdminBackup = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<BackupEntry[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [restoreTab, setRestoreTab] = useState<'export' | 'import'>('export');
  const [importPreview, setImportPreview] = useState<{ table: string; data: any[]; file: string } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
    const saved = localStorage.getItem('admin_backup_history_v2');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (entries: BackupEntry[]) => {
    const trimmed = entries.slice(0, 20);
    setHistory(trimmed);
    localStorage.setItem('admin_backup_history_v2', JSON.stringify(trimmed));
  };

  const addHistory = (entry: Omit<BackupEntry, 'id'>) => {
    saveHistory([{ ...entry, id: Date.now() }, ...history]);
  };

  const fetchStats = async () => {
    setLoading(true);
    const results = await Promise.all(
      TABLES.map(({ table }) => supabase.from(table as any).select('id', { count: 'exact', head: true }))
    );
    const s: Record<string, number> = {};
    TABLES.forEach(({ table }, i) => { s[table] = results[i].count || 0; });
    setStats(s);
    setLoading(false);
  };

  // ─── Export Single Table ──────────────────────────────────────────
  const exportTable = async (tableName: string, label: string) => {
    setExporting(tableName);
    try {
      const { data, error } = await supabase.from(tableName as any).select('*');
      if (error) throw error;
      downloadJson(data, `${tableName}_backup_${today()}.json`);
      addHistory({ label, tableName, date: new Date().toISOString(), records: data?.length || 0, type: 'export', status: 'success' });
      toast.success(`✅ ${label} ব্যাকআপ ডাউনলোড (${data?.length} রেকর্ড)`);
    } catch (e: any) {
      addHistory({ label, tableName, date: new Date().toISOString(), records: 0, type: 'export', status: 'error', error: e.message });
      toast.error('এক্সপোর্ট ব্যর্থ: ' + e.message);
    }
    setExporting(null);
  };

  // ─── Full Export ──────────────────────────────────────────────────
  const exportAll = async () => {
    setExporting('all');
    try {
      const results: Record<string, any[]> = {};
      for (const { table } of TABLES) {
        const { data } = await supabase.from(table as any).select('*');
        results[table] = data || [];
      }
      const payload = { exported_at: new Date().toISOString(), version: '2.0', store: 'Shahed Store', tables: results };
      downloadJson(payload, `shahed_store_full_backup_${today()}.json`);
      const total = Object.values(results).reduce((s, v) => s + v.length, 0);
      addHistory({ label: 'Full Backup', tableName: 'all', date: new Date().toISOString(), records: total, type: 'export', status: 'success' });
      toast.success(`✅ Full Backup ডাউনলোড সম্পন্ন! (${total} রেকর্ড)`);
    } catch (e: any) {
      addHistory({ label: 'Full Backup', tableName: 'all', date: new Date().toISOString(), records: 0, type: 'export', status: 'error', error: e.message });
      toast.error('Full Backup ব্যর্থ: ' + e.message);
    }
    setExporting(null);
  };

  // ─── Import: read file ────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: 'single' | 'full') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (mode === 'full') {
          if (!parsed.tables) throw new Error('Invalid full backup format — missing "tables" key');
          // Show summary for full restore
          const totalRecords = Object.values(parsed.tables as Record<string, any[]>).reduce((s, v) => s + v.length, 0);
          setImportPreview({ table: '__full__', data: Object.keys(parsed.tables).map(t => ({ table: t, count: (parsed.tables[t] as any[]).length })), file: JSON.stringify(parsed) });
          toast.info(`Full backup loaded: ${Object.keys(parsed.tables).length} tables, ${totalRecords} records`);
        } else {
          // Single table — array of objects
          if (!Array.isArray(parsed)) throw new Error('Invalid backup format — expected JSON array');
          // Detect which table from filename
          const guess = TABLES.find(t => file.name.startsWith(t.table))?.table || '';
          setImportPreview({ table: guess, data: parsed, file: JSON.stringify(parsed) });
          toast.info(`${parsed.length} রেকর্ড লোড হয়েছে`);
        }
        setConfirmRestore(false);
      } catch (err: any) {
        toast.error('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Restore Single Table ─────────────────────────────────────────
  const restoreTable = async () => {
    if (!importPreview || !confirmRestore) return;
    if (!importPreview.table || importPreview.table === '__full__') {
      await restoreFull();
      return;
    }
    setRestoring(true);
    const { table, data } = importPreview;
    const label = TABLES.find(t => t.table === table)?.label || table;
    try {
      // Upsert records
      const { error } = await supabase.from(table as any).upsert(data, { onConflict: 'id' });
      if (error) throw error;
      addHistory({ label: `Restore: ${label}`, tableName: table, date: new Date().toISOString(), records: data.length, type: 'import', status: 'success' });
      toast.success(`✅ ${label} রিস্টোর সম্পন্ন! ${data.length} রেকর্ড আপডেট।`);
      setImportPreview(null);
      setConfirmRestore(false);
      fetchStats();
    } catch (e: any) {
      addHistory({ label: `Restore: ${label}`, tableName: table, date: new Date().toISOString(), records: 0, type: 'import', status: 'error', error: e.message });
      toast.error('রিস্টোর ব্যর্থ: ' + e.message);
    }
    setRestoring(false);
  };

  // ─── Restore Full ─────────────────────────────────────────────────
  const restoreFull = async () => {
    if (!importPreview) return;
    setRestoring(true);
    const backup = JSON.parse(importPreview.file);
    const tables: Record<string, any[]> = backup.tables;
    let totalRestored = 0;
    const errors: string[] = [];
    for (const [table, rows] of Object.entries(tables)) {
      if (!rows || rows.length === 0) continue;
      try {
        const { error } = await supabase.from(table as any).upsert(rows as any, { onConflict: 'id' });
        if (error) errors.push(`${table}: ${error.message}`);
        else totalRestored += rows.length;
      } catch (e: any) {
        errors.push(`${table}: ${e.message}`);
      }
    }
    addHistory({ label: 'Full Restore', tableName: 'all', date: new Date().toISOString(), records: totalRestored, type: 'import', status: errors.length === 0 ? 'success' : 'error', error: errors.join(', ') });
    if (errors.length > 0) toast.error(`রিস্টোরে ${errors.length}টি error: ${errors[0]}`);
    else toast.success(`✅ Full Restore সম্পন্ন! ${totalRestored} রেকর্ড রিস্টোর।`);
    setImportPreview(null);
    setConfirmRestore(false);
    fetchStats();
    setRestoring(false);
  };

  // ─── Helpers ──────────────────────────────────────────────────────
  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const totalRecords = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Backup & <span className="gradient-text">Restore</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">ডেটা ব্যাকআপ, JSON এক্সপোর্ট এবং রিস্টোর সিস্টেম</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStats} disabled={loading} className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
          </button>
          <button onClick={exportAll} disabled={!!exporting} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
            {exporting === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Full Backup
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট রেকর্ড', value: loading ? '...' : totalRecords.toLocaleString(), icon: HardDrive, color: 'text-primary' },
          { label: 'টেবিল', value: TABLES.length, icon: Database, color: 'text-emerald-400' },
          { label: 'ব্যাকআপ হিস্ট্রি', value: history.length, icon: Clock, color: 'text-amber-400' },
          { label: 'সর্বশেষ ব্যাকআপ', value: history[0] ? new Date(history[0].date).toLocaleDateString('bn-BD') : 'কখনো না', icon: BarChart3, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4">
            <div className={`flex items-center gap-2 mb-1 ${color}`}>
              <Icon size={14} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-3">
        <button onClick={() => setRestoreTab('export')}
          className={`flex-1 py-3 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${restoreTab === 'export' ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
          <Download size={15} /> ব্যাকআপ / Export
        </button>
        <button onClick={() => setRestoreTab('import')}
          className={`flex-1 py-3 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${restoreTab === 'import' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
          <RotateCcw size={15} /> রিস্টোর / Import
        </button>
      </div>

      {/* ── EXPORT TAB ── */}
      {restoreTab === 'export' && (
        <>
          <div className="glass-card rounded-2xl p-4 border border-primary/20 bg-primary/5 flex items-start gap-3">
            <Shield size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">প্রতিটি টেবিলের ডেটা আলাদা JSON ফাইল হিসেবে ডাউনলোড করুন। <strong className="text-foreground">Full Backup</strong> বাটনে সব টেবিল একসাথে ডাউনলোড হবে।</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {TABLES.map(({ table, label, icon: Icon, color, bg }) => (
              <div key={table} className="glass-card-hover rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{loading ? '–' : stats[table] ?? 0} rows</span>
                </div>
                <div className="font-semibold text-foreground text-sm mb-0.5">{label}</div>
                <div className="text-[10px] text-muted-foreground mb-3">{table}.json</div>
                <button onClick={() => exportTable(table, label)} disabled={!!exporting}
                  className="w-full py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 glass-card hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all border border-transparent disabled:opacity-50">
                  {exporting === table ? <><Loader2 size={11} className="animate-spin" /> এক্সপোর্ট...</> : <><Download size={11} /> ডাউনলোড</>}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── IMPORT / RESTORE TAB ── */}
      {restoreTab === 'import' && (
        <div className="space-y-5">
          {/* Warning Banner */}
          <div className="glass-card rounded-2xl p-4 border border-amber-500/30 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">⚠️ রিস্টোর করার আগে সতর্কতা</p>
              <p className="text-xs text-muted-foreground mt-1">রিস্টোর করলে বিদ্যমান ডেটা <strong className="text-foreground">upsert</strong> হবে — একই ID থাকলে overwrite হবে। রিস্টোরের আগে অবশ্যই একটি <strong className="text-foreground">Full Backup</strong> নিয়ে রাখুন।</p>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ── Single Table Restore ── */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <RotateCcw size={14} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">একটি টেবিল রিস্টোর</h3>
                  <p className="text-[10px] text-muted-foreground">একক JSON ব্যাকআপ ফাইল আপলোড করুন</p>
                </div>
              </div>

              {/* Upload Button */}
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-muted/30 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Upload size={18} className="group-hover:text-primary transition-colors" />
                </div>
                <span className="font-medium">JSON ফাইল আপলোড করুন</span>
                <span className="text-[10px] text-muted-foreground/70">products_backup.json, orders_backup.json ইত্যাদি</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={e => handleFileSelect(e, 'single')} />

              {/* Preview after file load */}
              {importPreview && importPreview.table !== '__full__' && (
                <div className="space-y-3">
                  <div className="glass-card rounded-xl p-4 space-y-3 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">📋 ফাইল প্রিভিউ</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{importPreview.data.length} রেকর্ড</span>
                    </div>
                    {/* Table selector */}
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">টেবিল নির্বাচন করুন *</label>
                      <select
                        value={importPreview.table}
                        onChange={e => setImportPreview(p => p ? { ...p, table: e.target.value } : null)}
                        className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                        <option value="">— টেবিল বাছুন —</option>
                        {TABLES.map(t => <option key={t.table} value={t.table}>{t.label} ({t.table})</option>)}
                      </select>
                    </div>
                    {/* Sample rows */}
                    {importPreview.data.slice(0, 2).map((row: any, i: number) => (
                      <div key={i} className="text-[10px] font-mono text-muted-foreground bg-muted/20 rounded-lg p-2 truncate">
                        {JSON.stringify(row).slice(0, 120)}…
                      </div>
                    ))}
                    {/* Confirm checkbox */}
                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <input type="checkbox" checked={confirmRestore} onChange={e => setConfirmRestore(e.target.checked)} className="w-4 h-4 accent-primary mt-0.5" />
                      <span className="text-xs text-foreground">আমি বুঝেছি — ডেটা overwrite হতে পারে, তবুও রিস্টোর করতে চাই</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={restoreTable}
                      disabled={!confirmRestore || restoring || !importPreview.table}
                      className="flex-1 py-2.5 rounded-xl btn-glow text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                      {restoring ? <><Loader2 size={14} className="animate-spin" /> রিস্টোর হচ্ছে...</> : <><RotateCcw size={14} /> রিস্টোর করুন</>}
                    </button>
                    <button onClick={() => { setImportPreview(null); setConfirmRestore(false); }}
                      className="px-4 py-2.5 rounded-xl glass-card text-sm text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Full Backup Restore ── */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <Database size={14} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Full Backup রিস্টোর</h3>
                  <p className="text-[10px] text-muted-foreground">সব টেবিল একসাথে রিস্টোর করুন</p>
                </div>
              </div>

              {/* Upload Button */}
              <button onClick={() => fullFileInputRef.current?.click()}
                className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-emerald-400/50 text-sm text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-muted/30 group-hover:bg-emerald-400/10 flex items-center justify-center transition-colors">
                  <Upload size={18} className="group-hover:text-emerald-400 transition-colors" />
                </div>
                <span className="font-medium">Full Backup JSON আপলোড</span>
                <span className="text-[10px] text-muted-foreground/70">shahed_store_full_backup_XXXX.json</span>
              </button>
              <input ref={fullFileInputRef} type="file" accept=".json" className="hidden" onChange={e => handleFileSelect(e, 'full')} />

              {/* Preview after file load */}
              {importPreview && importPreview.table === '__full__' && (
                <div className="space-y-3">
                  <div className="glass-card rounded-xl p-4 space-y-3 border border-emerald-400/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">📋 ব্যাকআপ সারসংক্ষেপ</span>
                      <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">{(importPreview.data as any[]).reduce((s: number, r: any) => s + r.count, 0)} মোট</span>
                    </div>
                    <div className="divide-y divide-border/30 max-h-40 overflow-y-auto rounded-lg bg-muted/10">
                      {(importPreview.data as any[]).map((row: any) => {
                        const t = TABLES.find(t => t.table === row.table);
                        return (
                          <div key={row.table} className="flex items-center justify-between px-3 py-2 text-xs">
                            <span className="text-muted-foreground font-mono">{t?.label || row.table}</span>
                            <span className="text-foreground font-semibold">{row.count} rows</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Confirm */}
                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <input type="checkbox" checked={confirmRestore} onChange={e => setConfirmRestore(e.target.checked)} className="w-4 h-4 accent-primary mt-0.5" />
                      <span className="text-xs text-foreground">সব টেবিল রিস্টোর করব — আমি নিশ্চিত</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={restoreTable}
                      disabled={!confirmRestore || restoring}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {restoring ? <><Loader2 size={14} className="animate-spin" /> রিস্টোর হচ্ছে...</> : <><Database size={14} /> Full Restore করুন</>}
                    </button>
                    <button onClick={() => { setImportPreview(null); setConfirmRestore(false); }}
                      className="px-4 py-2.5 rounded-xl glass-card text-sm text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Restore Guide */}
          <div className="glass-card rounded-2xl p-5">
            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield size={14} className="text-primary" /> রিস্টোর গাইড
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { n: '১', text: 'Export ট্যাব থেকে Full Backup ডাউনলোড করুন (সেফটির জন্য)' },
                { n: '২', text: 'রিস্টোর করতে চান সেই JSON ফাইলটি আপলোড করুন' },
                { n: '৩', text: 'একক টেবিলের জন্য dropdown থেকে সঠিক টেবিল বাছুন' },
                { n: '৪', text: 'Checkbox চেক করে নিশ্চিত করুন, তারপর রিস্টোর করুন' },
                { n: '৫', text: 'একই ID থাকলে রেকর্ড আপডেট হবে, নতুন ID যুক্ত হবে' },
                { n: '৬', text: 'রিস্টোরের পর পেজ রিফ্রেশ করে ডেটা যাচাই করুন' },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3 p-3 rounded-xl bg-muted/10">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <button onClick={() => setShowHistory(p => !p)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <Clock size={14} className="text-primary" /> ব্যাকআপ হিস্ট্রি
            {history.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{history.length}</span>}
          </h3>
          {showHistory ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>
        {showHistory && (
          history.length === 0 ? (
            <div className="px-5 pb-8 text-center text-muted-foreground text-sm">
              <FileJson size={28} className="mx-auto mb-2 opacity-30" />
              <p>এখনো কোনো ব্যাকআপ/রিস্টোর নেওয়া হয়নি</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    entry.status === 'success'
                      ? entry.type === 'export' ? 'bg-emerald-400/10' : 'bg-blue-400/10'
                      : 'bg-destructive/10'
                  }`}>
                    {entry.status === 'success'
                      ? entry.type === 'export' ? <CheckCircle size={14} className="text-emerald-400" /> : <RotateCcw size={14} className="text-blue-400" />
                      : <AlertTriangle size={14} className="text-destructive" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{entry.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(entry.date).toLocaleString('bn-BD')} · {entry.records} রেকর্ড
                      {entry.error && <span className="text-destructive ml-2">· {entry.error.slice(0, 50)}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                    entry.status === 'success'
                      ? entry.type === 'export' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {entry.status === 'success' ? entry.type === 'export' ? '✓ Export' : '↺ Restore' : '✗ Error'}
                  </span>
                </div>
              ))}
              {history.length > 0 && (
                <div className="px-5 py-3">
                  <button onClick={() => saveHistory([])} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                    <Trash2 size={10} /> হিস্ট্রি মুছুন
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminBackup;
