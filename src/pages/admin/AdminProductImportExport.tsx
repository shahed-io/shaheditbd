import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

type ImportRow = { name: string; slug: string; price: string; original_price?: string; description?: string; category?: string; status?: string; sku?: string };

const HEADERS = ['name', 'slug', 'price', 'original_price', 'description', 'short_description', 'status', 'sku', 'brand', 'tags'];

const AdminProductImportExport = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [imported, setImported] = useState(0);
  const [step, setStep] = useState<'idle' | 'preview' | 'done'>('idle');

  const downloadTemplate = () => {
    const csv = [HEADERS.join(','), 'Windows 11 Pro,windows-11-pro,599,9999,Genuine Windows 11 Pro key,,active,WIN11PRO,Microsoft,windows;os'].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'products_template.csv';
    a.click();
    toast.success('টেমপ্লেট ডাউনলোড হয়েছে!');
  };

  const handleExport = async () => {
    setExporting(true);
    const { data } = await supabase.from('products').select('name,slug,price,original_price,description,short_description,status,sku,brand,tags,discount_percent,delivery_time,product_type').order('created_at', { ascending: false });
    if (!data || data.length === 0) { toast.error('কোনো প্রোডাক্ট নেই'); setExporting(false); return; }
    const rows = data.map(p => HEADERS.map(h => {
      const v = (p as any)[h];
      if (Array.isArray(v)) return `"${v.join(';')}"`;
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
      return v ?? '';
    }).join(','));
    const csv = [HEADERS.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `products_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success(`${data.length}টি প্রোডাক্ট এক্সপোর্ট হয়েছে!`);
    setExporting(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const errs: string[] = [];
      const rows: ImportRow[] = [];
      lines.slice(1).forEach((line, idx) => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ''; });
        if (!row.name) errs.push(`Row ${idx + 2}: name required`);
        if (!row.slug) errs.push(`Row ${idx + 2}: slug required`);
        if (!row.price || isNaN(Number(row.price))) errs.push(`Row ${idx + 2}: invalid price`);
        rows.push(row);
      });
      setErrors(errs);
      setPreview(rows);
      setStep('preview');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (errors.length > 0) { toast.error('এরর ঠিক করুন তারপর ইমপোর্ট করুন'); return; }
    setImporting(true);
    let count = 0;
    for (const row of preview) {
      const { error } = await supabase.from('products').upsert({
        name: row.name,
        slug: row.slug,
        price: Number(row.price) || 0,
        original_price: row.original_price ? Number(row.original_price) : null,
        description: (row as any).description || null,
        short_description: (row as any).short_description || null,
        status: ((row as any).status === 'draft' || (row as any).status === 'out_of_stock' ? (row as any).status : 'active') as any,
        sku: (row as any).sku || null,
        brand: (row as any).brand || null,
        tags: (row as any).tags ? (row as any).tags.split(';').filter(Boolean) : null,
      }, { onConflict: 'slug' });
      if (!error) count++;
    }
    setImported(count);
    setStep('done');
    setImporting(false);
    toast.success(`${count}টি প্রোডাক্ট ইমপোর্ট হয়েছে!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Product <span className="gradient-text">Import / Export</span>
        </h1>
        <p className="text-muted-foreground text-sm">CSV ফরম্যাটে বাল্ক প্রোডাক্ট ইমপোর্ট বা এক্সপোর্ট করুন</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
              <Download size={18} className="text-green-400" />
            </div>
            <div>
              <div className="font-bold text-foreground">প্রোডাক্ট এক্সপোর্ট</div>
              <div className="text-xs text-muted-foreground">সব প্রোডাক্ট CSV হিসেবে ডাউনলোড</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">ডাটাবেসের সব প্রোডাক্ট একটি CSV ফাইলে এক্সপোর্ট করুন। ব্যাকআপ বা এডিট করার জন্য ব্যবহার করুন।</p>
          <button onClick={handleExport} disabled={exporting}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-green-400/15 text-green-400 border border-green-400/30 hover:bg-green-400/25 transition-all disabled:opacity-50">
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'এক্সপোর্ট হচ্ছে...' : 'CSV এক্সপোর্ট করুন'}
          </button>
        </div>

        {/* Template */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-foreground">CSV টেমপ্লেট</div>
              <div className="text-xs text-muted-foreground">ইমপোর্টের জন্য টেমপ্লেট ডাউনলোড করুন</div>
            </div>
          </div>
          <div className="bg-muted/20 rounded-xl p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
            {HEADERS.join(', ')}
          </div>
          <button onClick={downloadTemplate}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all">
            <Download size={16} /> টেমপ্লেট ডাউনলোড
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
            <Upload size={18} className="text-blue-400" />
          </div>
          <div>
            <div className="font-bold text-foreground">CSV ইমপোর্ট</div>
            <div className="text-xs text-muted-foreground">CSV ফাইল আপলোড করে বাল্ক প্রোডাক্ট ইমপোর্ট</div>
          </div>
        </div>

        {step === 'idle' && (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/50 transition-colors">
              <Upload size={32} className="text-muted-foreground mx-auto mb-3" />
              <div className="font-semibold text-foreground mb-1">CSV ফাইল বেছে নিন</div>
              <div className="text-xs text-muted-foreground">অথবা এখানে ড্র্যাগ করুন</div>
            </div>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {errors.length > 0 ? (
                <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                  <AlertCircle size={16} /> {errors.length}টি এরর পাওয়া গেছে
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                  <CheckCircle2 size={16} /> {preview.length}টি প্রোডাক্ট প্রস্তুত
                </div>
              )}
              <button onClick={() => { setStep('idle'); setPreview([]); setErrors([]); }}
                className="ml-auto text-xs text-muted-foreground glass-card px-3 py-1.5 rounded-lg hover:text-foreground">
                বাতিল
              </button>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 space-y-1 max-h-32 overflow-y-auto">
                {errors.map((e, i) => <div key={i} className="text-xs text-red-400">{e}</div>)}
              </div>
            )}

            <div className="overflow-x-auto max-h-60 rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/50">
                  <tr>
                    {['নাম', 'Slug', 'মূল্য', 'আসল মূল্য', 'স্ট্যাটাস'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-muted-foreground font-semibold border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {preview.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-muted/10">
                      <td className="px-3 py-2 text-foreground font-medium truncate max-w-[150px]">{row.name}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{row.slug}</td>
                      <td className="px-3 py-2 text-foreground">৳{row.price}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.original_price ? `৳${row.original_price}` : '—'}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full bg-green-400/15 text-green-400 font-medium">{(row as any).status || 'active'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 20 && <div className="text-xs text-muted-foreground text-center">...এবং আরো {preview.length - 20}টি প্রোডাক্ট</div>}

            <button onClick={handleImport} disabled={importing || errors.length > 0}
              className="w-full py-3.5 rounded-xl font-bold text-sm btn-glow flex items-center justify-center gap-2 disabled:opacity-50">
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {importing ? 'ইমপোর্ট হচ্ছে...' : `${preview.length}টি প্রোডাক্ট ইমপোর্ট করুন`}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 size={48} className="text-green-400 mx-auto" />
            <div>
              <div className="text-xl font-bold text-foreground">{imported}টি প্রোডাক্ট ইমপোর্ট হয়েছে!</div>
              <div className="text-sm text-muted-foreground mt-1">সব প্রোডাক্ট ডাটাবেসে সেভ হয়েছে।</div>
            </div>
            <button onClick={() => { setStep('idle'); setPreview([]); setErrors([]); setImported(0); }}
              className="px-6 py-2.5 rounded-xl btn-glow text-sm font-semibold">
              আবার ইমপোর্ট করুন
            </button>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
        <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          ইমপোর্টে <strong>slug</strong> ব্যবহার করে upsert করা হয়। একই slug থাকলে প্রোডাক্ট আপডেট হবে, নতুন slug হলে নতুন প্রোডাক্ট তৈরি হবে।
        </div>
      </div>
    </div>
  );
};

export default AdminProductImportExport;
