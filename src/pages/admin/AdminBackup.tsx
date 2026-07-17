import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Database, Download, RefreshCw, CheckCircle, Clock, FileJson,
  Package, ShoppingCart, Users, Tag, Upload, AlertTriangle,
  Shield, RotateCcw, Trash2, ChevronDown, ChevronUp, Loader2,
  HardDrive, BarChart3, BookOpen, Ticket, Key, Grid3X3, Archive, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

// All storage buckets to include in mega backup
const STORAGE_BUCKETS = [
  'product-images', 'category-images', 'software-images',
  'email-assets', 'invoices', 'payment-proofs', 'refund-screenshots',
];

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

// Ordered so parents (categories, products, profiles) restore before children (order_items, license_keys)
const TABLES = [
  { table: 'categories',     label: 'Categories',      icon: Grid3X3,      color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  { table: 'products',       label: 'Products',        icon: Package,      color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  { table: 'product_categories', label: 'Product↔Category', icon: Grid3X3, color: 'text-violet-300', bg: 'bg-violet-300/10' },
  { table: 'profiles',       label: 'Customers',       icon: Users,        color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { table: 'coupons',        label: 'Coupons',         icon: Tag,          color: 'text-pink-400',    bg: 'bg-pink-400/10' },
  { table: 'orders',         label: 'Orders',          icon: ShoppingCart, color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  { table: 'order_items',    label: 'Order Items',     icon: Tag,          color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  { table: 'license_keys',   label: 'License Keys',    icon: Key,          color: 'text-cyan-400',    bg: 'bg-cyan-400/10' },
  { table: 'blog_categories',label: 'Blog Categories', icon: BookOpen,     color: 'text-indigo-300',  bg: 'bg-indigo-300/10' },
  { table: 'blog_posts',     label: 'Blog Posts',      icon: BookOpen,     color: 'text-indigo-400',  bg: 'bg-indigo-400/10' },
  { table: 'blog_tags',      label: 'Blog Tags',       icon: Tag,          color: 'text-indigo-200',  bg: 'bg-indigo-200/10' },
  { table: 'blog_post_tags', label: 'Blog Post↔Tag',   icon: Tag,          color: 'text-indigo-200',  bg: 'bg-indigo-200/10' },
  { table: 'blog_comments',  label: 'Blog Comments',   icon: BookOpen,     color: 'text-indigo-500',  bg: 'bg-indigo-500/10' },
  { table: 'product_reviews',label: 'Product Reviews', icon: Package,      color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
  { table: 'support_tickets',label: 'Support Tickets', icon: Ticket,       color: 'text-red-400',     bg: 'bg-red-400/10' },
  { table: 'support_replies',label: 'Support Replies', icon: Ticket,       color: 'text-red-300',     bg: 'bg-red-300/10' },
  { table: 'notices',        label: 'Notices',         icon: FileJson,     color: 'text-sky-400',     bg: 'bg-sky-400/10' },
  { table: 'help_articles',  label: 'Help Articles',   icon: BookOpen,     color: 'text-teal-400',    bg: 'bg-teal-400/10' },
  { table: 'software_downloads', label: 'Software Downloads', icon: Download, color: 'text-lime-400', bg: 'bg-lime-400/10' },
  { table: 'newsletter_subscribers', label: 'Newsletter Subs', icon: Users, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  { table: 'addresses',      label: 'Addresses',       icon: Users,        color: 'text-emerald-300', bg: 'bg-emerald-300/10' },
  { table: 'wallet_transactions', label: 'Wallet Txns', icon: BarChart3,   color: 'text-yellow-300',  bg: 'bg-yellow-300/10' },
  { table: 'point_transactions', label: 'Point Txns',  icon: BarChart3,    color: 'text-yellow-500',  bg: 'bg-yellow-500/10' },
  { table: 'referrals',      label: 'Referrals',       icon: Users,        color: 'text-rose-400',    bg: 'bg-rose-400/10' },
  { table: 'wishlists',      label: 'Wishlists',       icon: Package,      color: 'text-pink-300',    bg: 'bg-pink-300/10' },
  { table: 'user_cart_items',label: 'Cart Items',      icon: ShoppingCart, color: 'text-orange-300',  bg: 'bg-orange-300/10' },
  { table: 'offers',         label: 'Offers',          icon: Tag,          color: 'text-pink-500',    bg: 'bg-pink-500/10' },
  { table: 'offer_submissions', label: 'Offer Submissions', icon: FileJson, color: 'text-pink-300',   bg: 'bg-pink-300/10' },
  { table: 'affiliate_accounts', label: 'Affiliates',  icon: Users,        color: 'text-purple-400',  bg: 'bg-purple-400/10' },
  { table: 'user_roles',     label: 'User Roles',      icon: Shield,       color: 'text-red-500',     bg: 'bg-red-500/10' },
  { table: 'site_settings',  label: 'Site Settings',   icon: Database,     color: 'text-primary',     bg: 'bg-primary/10' },
  { table: 'text_overrides', label: 'Text Overrides',  icon: FileJson,     color: 'text-slate-400',   bg: 'bg-slate-400/10' },
];

// Concurrency-limited runner
async function runPool<T, R>(items: T[], limit: number, worker: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      try { results[i] = await worker(items[i], i); }
      catch (e) { results[i] = e as any; }
    }
  });
  await Promise.all(runners);
  return results;
}

const AdminBackup = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<BackupEntry[]>([]);
  const [restoreTab, setRestoreTab] = useState<'export' | 'import'>('export');
  const [importPreview, setImportPreview] = useState<{ table: string; data: any[]; file: string } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100
  const [progressLabel, setProgressLabel] = useState('');
  const [restoreLog, setRestoreLog] = useState<string[]>([]);
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

  // Fetch all rows with pagination
  const fetchAllRows = async (tableName: string): Promise<any[]> => {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let page = 0;
    while (true) {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allRows = [...allRows, ...data];
      if (data.length < PAGE_SIZE) break;
      page++;
    }
    return allRows;
  };

  // ─── Export Single Table ──────────────────────────────────────────
  const exportTable = async (tableName: string, label: string) => {
    setExporting(tableName);
    try {
      const data = await fetchAllRows(tableName);
      downloadJson(data, `${tableName}_backup_${today()}.json`);
      addHistory({ label, tableName, date: new Date().toISOString(), records: data.length, type: 'export', status: 'success' });
      toast.success(`✅ ${label} ব্যাকআপ ডাউনলোড (${data.length} রেকর্ড)`);
    } catch (e: any) {
      addHistory({ label, tableName, date: new Date().toISOString(), records: 0, type: 'export', status: 'error', error: e.message });
      toast.error('এক্সপোর্ট ব্যর্থ: ' + e.message);
    }
    setExporting(null);
  };

  // ─── Full DB Export (parallel) ────────────────────────────────────
  const exportAll = async () => {
    setExporting('all');
    setProgress(0);
    setProgressLabel('Fetching all tables in parallel…');
    try {
      let done = 0;
      const entries = await runPool(TABLES, 6, async ({ table, label }) => {
        setProgressLabel(`DB: ${label}`);
        const rows = await fetchAllRows(table).catch(() => []);
        done++;
        setProgress(Math.round((done / TABLES.length) * 100));
        return [table, rows] as const;
      });
      const results: Record<string, any[]> = Object.fromEntries(entries);
      const payload = { exported_at: new Date().toISOString(), version: '3.0', store: 'Shahed Store', tables: results };
      downloadJson(payload, `shahed_store_full_backup_${today()}.json`);
      const total = Object.values(results).reduce((s, v) => s + v.length, 0);
      addHistory({ label: 'Full Backup', tableName: 'all', date: new Date().toISOString(), records: total, type: 'export', status: 'success' });
      toast.success(`✅ Full Backup ডাউনলোড সম্পন্ন! (${total} রেকর্ড)`);
    } catch (e: any) {
      addHistory({ label: 'Full Backup', tableName: 'all', date: new Date().toISOString(), records: 0, type: 'export', status: 'error', error: e.message });
      toast.error('Full Backup ব্যর্থ: ' + e.message);
    }
    setProgress(0);
    setProgressLabel('');
    setExporting(null);
  };

  // ─── MEGA BACKUP: All DB + all Storage buckets in ZIP (parallel) ──
  const exportEverything = async () => {
    setExporting('mega');
    setProgress(0);
    setProgressLabel('Initializing…');
    try {
      const zip = new JSZip();
      const dbFolder = zip.folder('database')!;
      const storageFolder = zip.folder('storage')!;
      let totalRecords = 0;
      let totalFiles = 0;

      // 1) Database: fetch all tables IN PARALLEL (up to 6 concurrent)
      setProgressLabel('Fetching database (parallel)…');
      const manifest: any = { exported_at: new Date().toISOString(), version: '3.0', store: 'Shahed Store', tables: {} };

      // Phase 1 weights: DB = 40%, Storage = 60%
      let dbDone = 0;
      const dbResults = await runPool(TABLES, 6, async ({ table, label }) => {
        try {
          const rows = await fetchAllRows(table);
          return { table, label, rows, error: null as string | null };
        } catch (e: any) {
          return { table, label, rows: [] as any[], error: e.message };
        } finally {
          dbDone++;
          setProgress(Math.round((dbDone / TABLES.length) * 40));
          setProgressLabel(`DB: ${label} (${dbDone}/${TABLES.length})`);
        }
      });
      for (const { table, rows, error } of dbResults) {
        dbFolder.file(`${table}.json`, JSON.stringify(rows, null, 2));
        if (error) dbFolder.file(`${table}.ERROR.txt`, error);
        manifest.tables[table] = rows;
        totalRecords += rows.length;
      }
      zip.file('full_backup.json', JSON.stringify(manifest, null, 2));

      // 2) Storage: list all buckets in parallel, then download files with concurrency
      setProgressLabel('Listing storage files…');
      const listAll = async (bucket: string, prefix = ''): Promise<string[]> => {
        const out: string[] = [];
        const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
        if (error || !data) return out;
        for (const item of data) {
          const full = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null) out.push(...await listAll(bucket, full));
          else out.push(full);
        }
        return out;
      };

      const bucketListings = await runPool(STORAGE_BUCKETS, STORAGE_BUCKETS.length, async (bucket) => {
        try { return { bucket, paths: await listAll(bucket) }; }
        catch { return { bucket, paths: [] }; }
      });
      const allFiles = bucketListings.flatMap(b => b.paths.map(p => ({ bucket: b.bucket, path: p })));
      const totalStorageFiles = allFiles.length || 1;
      let filesDone = 0;

      // Download files in parallel (12 concurrent)
      await runPool(allFiles, 12, async ({ bucket, path }) => {
        try {
          const { data: blob } = await supabase.storage.from(bucket).download(path);
          if (blob) {
            const bucketFolder = storageFolder.folder(bucket)!;
            bucketFolder.file(path, await blob.arrayBuffer());
            totalFiles++;
          }
        } catch { /* skip */ }
        finally {
          filesDone++;
          setProgress(40 + Math.round((filesDone / totalStorageFiles) * 55));
          if (filesDone % 5 === 0 || filesDone === totalStorageFiles)
            setProgressLabel(`Storage: ${filesDone}/${totalStorageFiles} files`);
        }
      });

      // 3) README
      zip.file('README.txt',
`Shahed Store — Complete Website Backup
Exported: ${new Date().toISOString()}

Contents:
  /database/         — Each table as separate JSON file
  /full_backup.json  — Single-file restore-ready manifest (use Restore tab → Full Backup)
  /storage/          — All uploaded media (product images, invoices, etc.)
  README.txt         — This file

Stats:
  • DB Records: ${totalRecords.toLocaleString()}
  • Storage Files: ${totalFiles.toLocaleString()}
  • Tables: ${TABLES.length}
  • Buckets: ${STORAGE_BUCKETS.length}

Restore:
  Upload "full_backup.json" via the Restore tab to bring back all tables.
  Storage files must be re-uploaded manually or via Supabase Dashboard.
`);

      setProgressLabel('Compressing ZIP…');
      setProgress(96);
      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => setProgress(96 + Math.round(meta.percent * 0.04))
      );
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url; a.download = `shahed_store_complete_${today()}.zip`; a.click();
      URL.revokeObjectURL(url);
      setProgress(100);

      addHistory({ label: 'Complete Website Backup (ZIP)', tableName: 'mega', date: new Date().toISOString(), records: totalRecords + totalFiles, type: 'export', status: 'success' });
      toast.success(`✅ Complete Backup ডাউনলোড! (${totalRecords} রেকর্ড + ${totalFiles} ফাইল)`);
    } catch (e: any) {
      addHistory({ label: 'Complete Website Backup', tableName: 'mega', date: new Date().toISOString(), records: 0, type: 'export', status: 'error', error: e.message });
      toast.error('Mega Backup ব্যর্থ: ' + e.message);
    }
    setTimeout(() => { setProgress(0); setProgressLabel(''); }, 1500);
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
          const totalRecords = Object.values(parsed.tables as Record<string, any[]>).reduce((s, v) => s + v.length, 0);
          setImportPreview({ table: '__full__', data: Object.keys(parsed.tables).map(t => ({ table: t, count: (parsed.tables[t] as any[]).length })), file: JSON.stringify(parsed) });
          toast.info(`Full backup loaded: ${Object.keys(parsed.tables).length} tables, ${totalRecords} records`);
        } else {
          if (!Array.isArray(parsed)) throw new Error('Invalid backup format — expected JSON array');
          const guess = TABLES.find(t => file.name.startsWith(t.table))?.table || '';
          setImportPreview({ table: guess, data: parsed, file: JSON.stringify(parsed) });
          toast.info(`${parsed.length} রেকর্ড লোড হয়েছে`);
        }
        setConfirmRestore(false);
        setRestoreLog([]);
      } catch (err: any) {
        toast.error('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Upsert rows in batches — tries `id` then falls back without onConflict
  const upsertInBatches = async (
    tableName: string,
    rows: any[],
    onBatchDone?: (done: number, total: number) => void
  ): Promise<{ ok: number; failed: number; errors: string[] }> => {
    const BATCH = 100;
    let ok = 0, failed = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const hasId = chunk[0] && 'id' in chunk[0];
      const first = hasId
        ? await supabase.from(tableName as any).upsert(chunk, { onConflict: 'id' })
        : await supabase.from(tableName as any).upsert(chunk);
      if (first.error) {
        // Fallback: try insert one-by-one so a single bad row doesn't kill the whole chunk
        for (const row of chunk) {
          const r = hasId
            ? await supabase.from(tableName as any).upsert(row, { onConflict: 'id' })
            : await supabase.from(tableName as any).upsert(row);
          if (r.error) { failed++; if (errors.length < 3) errors.push(r.error.message); }
          else ok++;
        }
      } else {
        ok += chunk.length;
      }
      onBatchDone?.(Math.min(i + BATCH, rows.length), rows.length);
    }
    return { ok, failed, errors };
  };

  // ─── Restore Single Table ─────────────────────────────────────────
  const restoreTable = async () => {
    if (!importPreview || !confirmRestore) return;
    if (!importPreview.table || importPreview.table === '__full__') {
      await restoreFull();
      return;
    }
    setRestoring(true);
    setRestoreLog([]);
    setProgress(0);
    const { table, data } = importPreview;
    const label = TABLES.find(t => t.table === table)?.label || table;
    setProgressLabel(`Restoring ${label}…`);
    try {
      const res = await upsertInBatches(table, data, (done, total) => {
        setProgress(Math.round((done / total) * 100));
      });
      const status: 'success' | 'error' = res.failed === 0 ? 'success' : 'error';
      addHistory({ label: `Restore: ${label}`, tableName: table, date: new Date().toISOString(), records: res.ok, type: 'import', status, error: res.errors.join(' | ') });
      setRestoreLog([`${label}: ✅ ${res.ok} ok, ❌ ${res.failed} failed`, ...res.errors.map(e => `  • ${e}`)]);
      if (res.failed === 0) toast.success(`✅ ${label} রিস্টোর সম্পন্ন! ${res.ok} রেকর্ড।`);
      else toast.error(`${label}: ${res.failed}টি রেকর্ড ব্যর্থ — ${res.errors[0]}`);
      fetchStats();
    } catch (e: any) {
      addHistory({ label: `Restore: ${label}`, tableName: table, date: new Date().toISOString(), records: 0, type: 'import', status: 'error', error: e.message });
      toast.error('রিস্টোর ব্যর্থ: ' + e.message);
    }
    setProgress(0);
    setProgressLabel('');
    setRestoring(false);
  };

  // ─── Restore Full (ordered for FK) ────────────────────────────────
  const restoreFull = async () => {
    if (!importPreview) return;
    setRestoring(true);
    setRestoreLog([]);
    setProgress(0);
    setProgressLabel('Preparing restore…');
    const backup = JSON.parse(importPreview.file);
    const tables: Record<string, any[]> = backup.tables;
    const log: string[] = [];

    // Restore in TABLES order (parents first). Include any extra tables in the file at the end.
    const orderedNames = [
      ...TABLES.map(t => t.table).filter(n => tables[n]),
      ...Object.keys(tables).filter(n => !TABLES.find(t => t.table === n)),
    ];
    const totalRows = orderedNames.reduce((s, n) => s + (tables[n]?.length || 0), 0) || 1;
    let processed = 0;
    let totalOk = 0;
    let totalFailed = 0;

    for (const table of orderedNames) {
      const rows = tables[table] || [];
      const label = TABLES.find(t => t.table === table)?.label || table;
      if (rows.length === 0) { log.push(`${label}: (empty, skipped)`); setRestoreLog([...log]); continue; }
      setProgressLabel(`${label} — ${rows.length} rows`);
      try {
        const res = await upsertInBatches(table, rows, (done) => {
          const pct = Math.round(((processed + done) / totalRows) * 100);
          setProgress(pct);
        });
        totalOk += res.ok;
        totalFailed += res.failed;
        log.push(`${label}: ✅ ${res.ok} ok${res.failed ? ` / ❌ ${res.failed} failed` : ''}${res.errors[0] ? ` — ${res.errors[0]}` : ''}`);
      } catch (e: any) {
        totalFailed += rows.length;
        log.push(`${label}: ❌ crashed — ${e.message}`);
      }
      processed += rows.length;
      setProgress(Math.round((processed / totalRows) * 100));
      setRestoreLog([...log]);
    }

    addHistory({
      label: 'Full Restore',
      tableName: 'all',
      date: new Date().toISOString(),
      records: totalOk,
      type: 'import',
      status: totalFailed === 0 ? 'success' : 'error',
      error: totalFailed ? `${totalFailed} rows failed` : undefined,
    });
    if (totalFailed === 0) toast.success(`✅ Full Restore সম্পন্ন! ${totalOk} রেকর্ড।`);
    else toast.warning(`Restore শেষ — ${totalOk} ok, ${totalFailed} failed। বিস্তারিত log দেখুন।`);
    fetchStats();
    setProgress(100);
    setTimeout(() => { setProgress(0); setProgressLabel(''); }, 1500);
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
  const showProgress = (exporting || restoring) && (progress > 0 || progressLabel);

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
        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchStats} disabled={loading} className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
          </button>
          <button onClick={exportAll} disabled={!!exporting} className="glass-card px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold border border-primary/30 hover:border-primary/60 transition-all">
            {exporting === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Full DB Backup
          </button>
          <button onClick={exportEverything} disabled={!!exporting} title="Database + Storage files (ZIP)"
            className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold relative overflow-hidden">
            {exporting === 'mega' ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
            <span>Complete Website Backup</span>
          </button>
        </div>
      </div>

      {/* GLOBAL PROGRESS BAR */}
      {showProgress && (
        <div className="glass-card rounded-2xl p-4 border border-primary/30 bg-gradient-to-r from-primary/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Loader2 size={14} className="animate-spin text-primary" />
              {restoring ? 'রিস্টোর চলছে' : 'ব্যাকআপ তৈরি হচ্ছে'}
              {progressLabel && <span className="text-muted-foreground font-normal text-xs">— {progressLabel}</span>}
            </div>
            <div className="text-lg font-bold text-primary tabular-nums">{progress}%</div>
          </div>
          <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-200"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

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
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-purple-500/10 to-pink-500/10 p-6 backdrop-blur-xl">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-5 justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/40 flex-shrink-0">
                  <Archive size={26} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    এক ক্লিকে সম্পূর্ণ ব্যাকআপ
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">Parallel</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                    সকল <strong className="text-foreground">{TABLES.length}টি টেবিল</strong> + <strong className="text-foreground">সকল ছবি/ফাইল</strong> parallel-এ ডাউনলোড হয়। কিছুই বাদ যাবে না। উপরে percentage দেখুন।
                  </p>
                </div>
              </div>
              <button onClick={exportEverything} disabled={!!exporting}
                className="w-full lg:w-auto px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-primary via-purple-600 to-pink-600 shadow-xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
                {exporting === 'mega' ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                <span>এখনই ব্যাকআপ নিন</span>
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-primary/20 bg-primary/5 flex items-start gap-3">
            <Shield size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">নিচের প্রতিটি কার্ড থেকে আলাদা টেবিলের JSON ডাউনলোড করুন, অথবা উপরে থাকা <strong className="text-primary">"এখনই ব্যাকআপ নিন"</strong> বাটন চাপলে সম্পূর্ণ ডাটাবেস + সকল ছবি/ফাইল ZIP আকারে এক ক্লিকে download হবে।</p>
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
          <div className="glass-card rounded-2xl p-4 border border-amber-500/30 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">⚠️ রিস্টোর করার আগে সতর্কতা</p>
              <p className="text-xs text-muted-foreground mt-1">রিস্টোর করলে বিদ্যমান ডেটা <strong className="text-foreground">upsert</strong> হবে — একই ID থাকলে overwrite হবে। রিস্টোরের আগে অবশ্যই একটি <strong className="text-foreground">Full Backup</strong> নিয়ে রাখুন। parent টেবিল (categories, products) আগে restore হবে যাতে foreign key ভাঙে না।</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Single Table Restore */}
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

              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-muted/30 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Upload size={18} className="group-hover:text-primary transition-colors" />
                </div>
                <span className="font-medium">JSON ফাইল আপলোড করুন</span>
                <span className="text-[10px] text-muted-foreground/70">products_backup.json, orders_backup.json ইত্যাদি</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={e => handleFileSelect(e, 'single')} />

              {importPreview && importPreview.table !== '__full__' && (
                <div className="space-y-3">
                  <div className="glass-card rounded-xl p-4 space-y-3 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">📋 ফাইল প্রিভিউ</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{importPreview.data.length} রেকর্ড</span>
                    </div>
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
                    {importPreview.data.slice(0, 2).map((row: any, i: number) => (
                      <div key={i} className="text-[10px] font-mono text-muted-foreground bg-muted/20 rounded-lg p-2 truncate">
                        {JSON.stringify(row).slice(0, 120)}…
                      </div>
                    ))}
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
                    <button onClick={() => { setImportPreview(null); setConfirmRestore(false); setRestoreLog([]); }}
                      className="px-4 py-2.5 rounded-xl glass-card text-sm text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Full Backup Restore */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                  <Database size={14} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Full Backup রিস্টোর</h3>
                  <p className="text-[10px] text-muted-foreground">সব টেবিল একসাথে (parent → child order)</p>
                </div>
              </div>

              <button onClick={() => fullFileInputRef.current?.click()}
                className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-emerald-400/50 text-sm text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-muted/30 group-hover:bg-emerald-400/10 flex items-center justify-center transition-colors">
                  <Upload size={18} className="group-hover:text-emerald-400 transition-colors" />
                </div>
                <span className="font-medium">Full Backup JSON আপলোড</span>
                <span className="text-[10px] text-muted-foreground/70">shahed_store_full_backup_XXXX.json</span>
              </button>
              <input ref={fullFileInputRef} type="file" accept=".json" className="hidden" onChange={e => handleFileSelect(e, 'full')} />

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
                    <button onClick={() => { setImportPreview(null); setConfirmRestore(false); setRestoreLog([]); }}
                      className="px-4 py-2.5 rounded-xl glass-card text-sm text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Restore Log */}
          {restoreLog.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-border/40">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <FileJson size={14} className="text-primary" /> রিস্টোর লগ
              </h4>
              <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-[11px]">
                {restoreLog.map((line, i) => (
                  <div key={i} className={`px-2 py-1 rounded ${line.includes('❌') ? 'bg-destructive/10 text-destructive' : line.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground'}`}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">ব্যাকআপ / রিস্টোর হিস্ট্রি</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">{history.length} entries</span>
          </div>
          <div className="divide-y divide-border/30 max-h-80 overflow-y-auto">
            {history.map(h => (
              <div key={h.id} className="p-3 flex items-center gap-3 text-xs">
                {h.status === 'success' ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" /> : <AlertTriangle size={14} className="text-destructive flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{h.label} <span className="text-muted-foreground font-normal">({h.type})</span></div>
                  <div className="text-[10px] text-muted-foreground">{new Date(h.date).toLocaleString('bn-BD')} • {h.records} রেকর্ড {h.error ? `• ${h.error}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackup;
