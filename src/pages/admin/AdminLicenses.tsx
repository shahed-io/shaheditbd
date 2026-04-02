import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Trash2, Key, Eye, EyeOff, Search, Filter,
  CheckCircle2, Clock, XCircle, Upload, Download,
  Package, RefreshCw, Copy, Loader2, ChevronDown, User, Tag,
  Printer, Mail, Send, X, FileText, Edit3, UserPlus, UserMinus,
  MessageCircle, File, Phone, Sparkles, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type LicenseKey = {
  id: string;
  key_value: string;
  key_type: string;
  extra_info: string | null;
  status: string;
  product_id: string | null;
  order_item_id: string | null;
  assigned_at: string | null;
  created_at: string;
  product_name?: string;
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
};

type Product = { id: string; name: string; slug: string };

const KEY_TYPES = [
  { value: 'license',      label: '🔑 License Key',       desc: 'Single activation key (Windows, Office, etc.)' },
  { value: 'subscription', label: '👤 Subscription',       desc: 'ID & Password credentials' },
  { value: 'account',      label: '📧 Account Credentials', desc: 'Email/Username + Password' },
  { value: 'serial',       label: '🔢 Serial Number',       desc: 'Serial/Product number' },
  { value: 'custom',       label: '📝 Custom Info',         desc: 'Any custom delivery info' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  available: { label: 'Available',  color: 'hsl(162,72%,46%)',  icon: CheckCircle2 },
  assigned:  { label: 'Assigned',   color: 'hsl(258,78%,68%)',  icon: User },
  reserved:  { label: 'Reserved',   color: 'hsl(42,96%,58%)',   icon: Clock },
  revoked:   { label: 'Revoked',    color: 'hsl(0,72%,51%)',    icon: XCircle },
};

const emptyForm = {
  product_id: '',
  key_type: 'license',
  key_value: '',
  extra_info: '',
};


const AdminLicenses = () => {
  const qc = useQueryClient();

  // ── Product License States ──
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [bulkProductId, setBulkProductId] = useState('');
  const [bulkType, setBulkType] = useState('license');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [emailModal, setEmailModal] = useState<{ open: boolean; license: LicenseKey | null; email: string }>({ open: false, license: null, email: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [bulkProductSearch, setBulkProductSearch] = useState('');
  const [bulkProductDropdownOpen, setBulkProductDropdownOpen] = useState(false);
  const [bulkTypeDropdownOpen, setBulkTypeDropdownOpen] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState<{ open: boolean; license: LicenseKey | null }>({ open: false, license: null });
  const [editForm, setEditForm] = useState({ key_value: '', extra_info: '', key_type: 'license', product_id: '', status: 'available' });
  const [editSaving, setEditSaving] = useState(false);

  // Assign modal state
  const [assignModal, setAssignModal] = useState<{ open: boolean; license: LicenseKey | null }>({ open: false, license: null });
  const [assignSearch, setAssignSearch] = useState('');
  const [assignResults, setAssignResults] = useState<any[]>([]);
  const [assignSearching, setAssignSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // WhatsApp modal state
  const [waModal, setWaModal] = useState<{ open: boolean; license: LicenseKey | null; phone: string }>({ open: false, license: null, phone: '' });

  // ── AI Smart Import States ──
  const [aiMode, setAiMode] = useState(false);
  const [aiDemoKey, setAiDemoKey] = useState('');
  const [aiDemoExtra, setAiDemoExtra] = useState('');
  const [aiRawText, setAiRawText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParsed, setAiParsed] = useState<{ key_value: string; extra_info: string }[] | null>(null);
  const [aiImporting, setAiImporting] = useState(false);

  // ── Bulk Selection States ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);


  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('license_keys')
      .select(`
        *,
        products(name),
        order_items(
          order_id,
          orders(order_number, customer_name, customer_email, customer_phone)
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setLicenses(data.map((l: any) => ({
        ...l,
        product_name: l.products?.name || '—',
        order_number: l.order_items?.orders?.order_number || null,
        customer_name: l.order_items?.orders?.customer_name || null,
        customer_email: l.order_items?.orders?.customer_email || null,
        customer_phone: l.order_items?.orders?.customer_phone || null,
      })));
    }

    const { data: prods } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('status', 'active')
      .order('name');
    setProducts(prods || []);
    setLoading(false);
  };

   useEffect(() => { fetchAll(); }, []);


  const handleSave = async () => {
    if (!form.product_id) return toast.error('প্রোডাক্ট সিলেক্ট করুন');
    if (!form.key_value.trim()) return toast.error('Key Value লিখুন');
    setSaving(true);
    const { error } = await supabase.from('license_keys').insert({
      product_id: form.product_id,
      key_type: form.key_type,
      key_value: form.key_value.trim(),
      extra_info: form.extra_info.trim() || null,
      status: 'available',
    });
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    toast.success('License key যোগ করা হয়েছে!');
    setForm(emptyForm);
    setShowForm(false);
    fetchAll();
  };

  const handleBulkImport = async () => {
    if (!bulkProductId) return toast.error('প্রোডাক্ট সিলেক্ট করুন');
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return toast.error('কোনো key পাওয়া যায়নি');
    setBulkSaving(true);
    const rows = lines.map(line => ({
      product_id: bulkProductId,
      key_type: bulkType,
      key_value: line,
      status: 'available',
    }));
    const { error } = await supabase.from('license_keys').insert(rows);
    setBulkSaving(false);
    if (error) { toast.error('Bulk import failed'); return; }
    toast.success(`${lines.length}টি license key যোগ করা হয়েছে!`);
    setBulkText('');
    setShowBulk(false);
    fetchAll();
  };

  // ── AI Smart Parse ──
  const handleAiParse = async () => {
    if (!aiDemoKey.trim()) return toast.error('ডেমো Key Value দিন');
    const rawLines = aiRawText.trim();
    if (!rawLines) return toast.error('Raw ডেটা পেস্ট করুন');
    setAiParsing(true);
    setAiParsed(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-parse-licenses', {
        body: {
          demoKeyValue: aiDemoKey.trim(),
          demoExtraInfo: aiDemoExtra.trim(),
          rawLines,
          keyType: bulkType,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'AI parse failed');
      setAiParsed(data.parsed || []);
      toast.success(`${(data.parsed || []).length}টি লাইসেন্স AI দ্বারা পার্স হয়েছে!`);
    } catch (err: any) {
      toast.error('AI পার্স ব্যর্থ: ' + (err.message || 'Unknown error'));
    }
    setAiParsing(false);
  };

  const handleAiImport = async () => {
    if (!bulkProductId) return toast.error('প্রোডাক্ট সিলেক্ট করুন');
    if (!aiParsed || aiParsed.length === 0) return toast.error('আগে AI দিয়ে পার্স করুন');
    setAiImporting(true);
    const rows = aiParsed.map(item => ({
      product_id: bulkProductId,
      key_type: bulkType,
      key_value: item.key_value,
      extra_info: item.extra_info || null,
      status: 'available' as const,
    }));
    const { error } = await supabase.from('license_keys').insert(rows);
    setAiImporting(false);
    if (error) { toast.error('Import failed: ' + error.message); return; }
    toast.success(`${rows.length}টি license key AI থেকে যোগ হয়েছে!`);
    setAiMode(false);
    setAiDemoKey('');
    setAiDemoExtra('');
    setAiRawText('');
    setAiParsed(null);
    setShowBulk(false);
    fetchAll();
  };


  const handleDelete = async (id: string) => {
    if (!confirm('এই license key ডিলিট করবেন?')) return;
    await supabase.from('license_keys').delete().eq('id', id);
    toast.success('Deleted');
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    fetchAll();
  };

  // ── Bulk Delete (Product) ──
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}টি লাইসেন্স কি ডিলিট করবেন?`)) return;
    setBulkDeleting(true);
    const { error } = await supabase.from('license_keys').delete().in('id', Array.from(selectedIds));
    setBulkDeleting(false);
    if (error) return toast.error('বাল্ক ডিলিট ব্যর্থ');
    toast.success(`${selectedIds.size}টি লাইসেন্স ডিলিট হয়েছে`);
    setSelectedIds(new Set());
    fetchAll();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(l => l.id)));
    }
  };


  const handleRevoke = async (id: string) => {
    await supabase.from('license_keys').update({ status: 'revoked' }).eq('id', id);
    toast.success('License revoked');
    fetchAll();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি হয়েছে!');
  };

  // Stats
  const stats = {
    total:     licenses.length,
    available: licenses.filter(l => l.status === 'available').length,
    assigned:  licenses.filter(l => l.status === 'assigned').length,
    revoked:   licenses.filter(l => l.status === 'revoked').length,
  };

  // Filter
  const filtered = licenses.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterProduct !== 'all' && l.product_id !== filterProduct) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.key_value.toLowerCase().includes(q) ||
        (l.product_name || '').toLowerCase().includes(q) ||
        (l.order_number || '').toLowerCase().includes(q) ||
        (l.customer_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const toggleShow = (id: string) => setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  const maskValue = (val: string) => val.length > 8 ? val.slice(0, 4) + '•'.repeat(Math.min(val.length - 8, 12)) + val.slice(-4) : '••••••••';

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>License Keys - Shahed Store</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a2e; }
        h1 { font-size: 20px; color: hsl(258,78%,55%); margin-bottom: 5px; }
        .subtitle { color: #888; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: hsl(258,78%,55%); color: white; padding: 8px 12px; text-align: left; font-size: 11px; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #faf8ff; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
        .mono { font-family: 'Courier New', monospace; font-size: 11px; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      <h1>🔑 License Keys — Shahed Store</h1>
      <p class="subtitle">${filtered.length} টি লাইসেন্স • প্রিন্ট তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
      <table>
        <thead><tr>
          <th>#</th><th>Type</th><th>Key / Credentials</th><th>প্রোডাক্ট</th><th>Status</th><th>কাস্টমার</th><th>অর্ডার</th>
        </tr></thead>
        <tbody>${filtered.map((lic, i) => {
          const typeLabel = KEY_TYPES.find(t => t.value === lic.key_type)?.label || lic.key_type;
          const stLabel = STATUS_CONFIG[lic.status]?.label || lic.status;
          return `<tr>
            <td>${i + 1}</td>
            <td>${typeLabel}</td>
            <td class="mono">${lic.key_value}${lic.extra_info ? '<br><small style="color:#888">' + lic.extra_info + '</small>' : ''}</td>
            <td>${lic.product_name}</td>
            <td><span class="badge" style="background:${(STATUS_CONFIG[lic.status]?.color || '#888')}22;color:${STATUS_CONFIG[lic.status]?.color || '#888'}">${stLabel}</span></td>
            <td>${lic.customer_name || '—'}</td>
            <td>${lic.order_number ? '#' + lic.order_number : '—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  const handleInvoicePrint = (lic: LicenseKey) => {
    const typeLabel = KEY_TYPES.find(t => t.value === lic.key_type)?.label || lic.key_type;
    const invoiceNo = `INV-${lic.order_number || Date.now()}`;
    const date = lic.assigned_at ? new Date(lic.assigned_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('bn-BD');
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>License Invoice - ${invoiceNo}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; background: #fff; }
      .invoice { max-width: 700px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; padding-bottom: 20px; border-bottom: 3px solid #7c3aed; }
      .brand h1 { font-size: 22px; color: #7c3aed; font-weight: 900; }
      .brand p { font-size: 11px; color: #888; margin-top: 3px; }
      .invoice-info { text-align: right; }
      .invoice-info h2 { font-size: 24px; font-weight: 900; color: #1a1a2e; text-transform: uppercase; letter-spacing: 2px; }
      .invoice-info .meta { font-size: 11px; color: #666; margin-top: 5px; }
      .invoice-info .meta span { font-weight: 700; color: #1a1a2e; }
      .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .party { flex: 1; }
      .party h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #7c3aed; font-weight: 800; margin-bottom: 8px; }
      .party p { font-size: 12px; color: #444; line-height: 1.6; }
      .party .name { font-weight: 700; color: #1a1a2e; font-size: 14px; }
      .license-box { background: #f8f5ff; border: 2px solid #e9e0ff; border-radius: 12px; padding: 24px; margin-bottom: 25px; }
      .license-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #7c3aed; font-weight: 800; margin-bottom: 15px; }
      .license-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9e0ff; }
      .license-row:last-child { border-bottom: none; }
      .license-row .label { font-size: 11px; color: #888; font-weight: 600; }
      .license-row .value { font-size: 13px; color: #1a1a2e; font-weight: 700; text-align: right; max-width: 65%; word-break: break-all; }
      .license-row .value.mono { font-family: 'Courier New', monospace; color: #7c3aed; font-size: 14px; }
      .footer { margin-top: 35px; padding-top: 20px; border-top: 2px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
      .footer .note { font-size: 10px; color: #999; max-width: 60%; line-height: 1.5; }
      .footer .stamp { text-align: center; }
      .footer .stamp .delivered { display: inline-block; border: 2px solid #22c55e; color: #22c55e; padding: 5px 16px; border-radius: 6px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; transform: rotate(-5deg); }
      .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(124,58,237,0.04); font-weight: 900; pointer-events: none; z-index: 0; }
      @media print { body { padding: 20px; } .invoice { max-width: 100%; } }
    </style></head><body>
    <div class="watermark">SHAHED STORE</div>
    <div class="invoice">
      <div class="header">
        <div class="brand">
          <h1>🔑 Shahed Store</h1>
          <p>Digital License & Software Store</p>
        </div>
        <div class="invoice-info">
          <h2>Invoice</h2>
          <div class="meta">
            Invoice No: <span>${invoiceNo}</span><br/>
            Date: <span>${date}</span>
          </div>
        </div>
      </div>
      <div class="parties">
        <div class="party">
          <h4>Bill To</h4>
          <p class="name">${lic.customer_name || 'Customer'}</p>
          <p>${lic.customer_email || '—'}</p>
          ${lic.order_number ? `<p>Order: #${lic.order_number}</p>` : ''}
        </div>
        <div class="party" style="text-align:right;">
          <h4>From</h4>
          <p class="name">Shahed Store</p>
          <p>info@shahedstore.com.bd</p>
        </div>
      </div>
      <div class="license-box">
        <h3>License Details</h3>
        <div class="license-row">
          <span class="label">Product</span>
          <span class="value">${lic.product_name}</span>
        </div>
        <div class="license-row">
          <span class="label">License Type</span>
          <span class="value">${typeLabel}</span>
        </div>
        <div class="license-row">
          <span class="label">${lic.key_type === 'subscription' || lic.key_type === 'account' ? 'Credentials' : 'Key / Serial'}</span>
          <span class="value mono">${lic.key_value}</span>
        </div>
        ${lic.extra_info ? `<div class="license-row"><span class="label">Additional Info</span><span class="value mono">${lic.extra_info}</span></div>` : ''}
        <div class="license-row">
          <span class="label">Status</span>
          <span class="value" style="color:#22c55e;">✅ Delivered</span>
        </div>
        <div class="license-row">
          <span class="label">Delivery Date</span>
          <span class="value">${date}</span>
        </div>
      </div>
      <div class="footer">
        <div class="note">
          এই লাইসেন্সটি সফলভাবে ডেলিভারি করা হয়েছে। কোনো সমস্যা হলে আমাদের সাপোর্টে যোগাযোগ করুন।<br/>
          This license has been successfully delivered. Contact support for any issues.
        </div>
        <div class="stamp">
          <span class="delivered">✓ Delivered</span>
        </div>
      </div>
    </div></body></html>`;
    
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const openEmailModal = (lic: LicenseKey) => {
    setEmailModal({ open: true, license: lic, email: lic.customer_email || '' });
  };

  const handleSendEmail = async () => {
    if (!emailModal.license || !emailModal.email) return toast.error('ইমেইল ঠিকানা দিন');
    setSendingEmail(true);
    try {
      const lic = emailModal.license;
      const { error } = await supabase.functions.invoke('send-order-email', {
        body: {
          type: 'license-resend',
          recipientEmail: emailModal.email,
          licenseData: {
            key_value: lic.key_value,
            key_type: lic.key_type,
            extra_info: lic.extra_info,
            product_name: lic.product_name,
            customer_name: lic.customer_name || 'Customer',
            order_number: lic.order_number || '',
          }
        }
      });
      if (error) throw error;
      toast.success('লাইসেন্স ইমেইল পাঠানো হয়েছে!');
      setEmailModal({ open: false, license: null, email: '' });
    } catch (err: any) {
      toast.error('ইমেইল পাঠাতে ব্যর্থ: ' + (err.message || 'Unknown error'));
    } finally {
      setSendingEmail(false);
    }
  };

  // ── WhatsApp Delivery ──
  const openWaModal = (lic: LicenseKey) => {
    setWaModal({ open: true, license: lic, phone: lic.customer_phone || '' });
  };

  const handleWhatsAppSend = () => {
    if (!waModal.license || !waModal.phone.trim()) return toast.error('ফোন নম্বর দিন');
    const lic = waModal.license;
    const phone = waModal.phone.replace(/\D/g, '').replace(/^0/, '880');
    const typeLabel = KEY_TYPES.find(t => t.value === lic.key_type)?.label || lic.key_type;
    
    let msg = `🔑 *লাইসেন্স ডেলিভারি*\n\n`;
    msg += `📦 *প্রোডাক্ট:* ${lic.product_name}\n`;
    msg += `📝 *টাইপ:* ${typeLabel}\n`;
    if (lic.order_number) msg += `🧾 *অর্ডার:* #${lic.order_number}\n`;
    msg += `\n━━━━━━━━━━━━━━━\n`;
    msg += `🔐 *Key/Credentials:*\n${lic.key_value}\n`;
    if (lic.extra_info) msg += `🔒 *Password/Extra:*\n${lic.extra_info}\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;
    msg += `✅ ধন্যবাদ! — *ShahedStore*`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp ওপেন হচ্ছে...');
    setWaModal({ open: false, license: null, phone: '' });
  };

  // ── Edit License ──
  const openEditModal = (lic: LicenseKey) => {
    setEditForm({
      key_value: lic.key_value,
      extra_info: lic.extra_info || '',
      key_type: lic.key_type,
      product_id: lic.product_id || '',
      status: lic.status,
    });
    setEditModal({ open: true, license: lic });
  };

  const handleEditSave = async () => {
    if (!editModal.license) return;
    if (!editForm.key_value.trim()) return toast.error('Key Value খালি রাখা যাবে না');
    setEditSaving(true);
    const { error } = await supabase
      .from('license_keys')
      .update({
        key_value: editForm.key_value.trim(),
        extra_info: editForm.extra_info.trim() || null,
        key_type: editForm.key_type,
        product_id: editForm.product_id || null,
        status: editForm.status,
      })
      .eq('id', editModal.license.id);
    setEditSaving(false);
    if (error) return toast.error('আপডেট ব্যর্থ: ' + error.message);
    toast.success('লাইসেন্স আপডেট হয়েছে!');
    setEditModal({ open: false, license: null });
    fetchAll();
  };

  // ── Assign to User/Order ──
  const openAssignModal = (lic: LicenseKey) => {
    setAssignModal({ open: true, license: lic });
    setAssignSearch('');
    setAssignResults([]);
  };

  const searchOrders = async (q: string) => {
    setAssignSearch(q);
    if (q.length < 2) { setAssignResults([]); return; }
    setAssignSearching(true);
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, order_items(id, product_id, product_name, license_key)')
      .or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(10);
    setAssignResults(data || []);
    setAssignSearching(false);
  };

  const handleAssign = async (orderItemId: string) => {
    if (!assignModal.license) return;
    setAssigning(true);
    const { error } = await supabase
      .from('license_keys')
      .update({
        status: 'assigned',
        order_item_id: orderItemId,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', assignModal.license.id);

    if (!error) {
      // Also update order_items.license_key
      const lic = assignModal.license;
      const keyDisplay = lic.extra_info ? `${lic.key_value}|${lic.extra_info}` : lic.key_value;
      await supabase
        .from('order_items')
        .update({ license_key: keyDisplay })
        .eq('id', orderItemId);
    }

    setAssigning(false);
    if (error) return toast.error('অ্যাসাইন ব্যর্থ: ' + error.message);
    toast.success('লাইসেন্স সফলভাবে অ্যাসাইন হয়েছে!');
    setAssignModal({ open: false, license: null });
    fetchAll();
  };

  // ── Unassign ──
  const handleUnassign = async (lic: LicenseKey) => {
    if (!confirm('এই লাইসেন্সটি কাস্টমারের অ্যাকাউন্ট থেকে সরিয়ে দেবেন?')) return;
    // Remove from order_items
    if (lic.order_item_id) {
      await supabase
        .from('order_items')
        .update({ license_key: null })
        .eq('id', lic.order_item_id);
    }
    // Reset license key
    const { error } = await supabase
      .from('license_keys')
      .update({ status: 'available', order_item_id: null, assigned_at: null })
      .eq('id', lic.id);
    if (error) return toast.error('আনঅ্যাসাইন ব্যর্থ');
    toast.success('লাইসেন্স আনঅ্যাসাইন হয়েছে!');
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Key size={24} className="text-primary" /> License Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            প্রোডাক্ট লাইসেন্স ম্যানেজ করুন
          </p>
        </div>
      </div>

      {/* Product Licenses */}
      {/* Product Licenses Header Actions */}
      <div className="flex justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:border-primary/40 transition-all text-muted-foreground"
          >
            <Printer size={14} /> প্রিন্ট
          </button>
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:border-primary/40 transition-all text-muted-foreground"
          >
            <Upload size={14} /> Bulk Import
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))', color: 'white' }}
          >
            <Plus size={14} /> Add License
          </button>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'মোট Keys', value: stats.total,     color: 'hsl(258,78%,68%)',  bg: 'hsla(258,78%,68%,0.1)', filter: 'all' },
          { label: 'Available', value: stats.available, color: 'hsl(162,72%,46%)',  bg: 'hsla(162,72%,46%,0.1)', filter: 'available' },
          { label: 'Assigned',  value: stats.assigned,  color: 'hsl(200,90%,55%)',  bg: 'hsla(200,90%,55%,0.1)', filter: 'assigned' },
          { label: 'Revoked',   value: stats.revoked,   color: 'hsl(0,72%,51%)',    bg: 'hsla(0,72%,51%,0.1)',   filter: 'revoked' },
        ].map(s => (
        <div key={s.label}
            onClick={() => setFilterStatus(filterStatus === s.filter ? 'all' : s.filter)}
            className="glass-card rounded-2xl p-4 border cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            style={{
              borderColor: filterStatus === s.filter ? s.color : `${s.color}30`,
              background: s.bg,
              boxShadow: filterStatus === s.filter ? `0 0 0 2px ${s.color}40, inset 0 0 12px ${s.color}15` : 'none',
            }}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              {filterStatus === s.filter && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: s.color }} />}
            </div>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Single Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-5 border border-primary/20">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Plus size={14} className="text-primary" /> নতুন License Key যোগ করুন
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product */}
            <div className="relative">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">প্রোডাক্ট *</label>
              <div
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-primary flex items-center justify-between"
              >
                <span className={form.product_id ? 'text-foreground' : 'text-muted-foreground'}>
                  {form.product_id ? products.find(p => p.id === form.product_id)?.name || '—' : '— প্রোডাক্ট বেছে নিন —'}
                </span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${productDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {productDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="প্রোডাক্ট খুঁজুন..."
                        className="w-full bg-muted/20 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-44">
                    {products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
                    ) : (
                      products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                        <button
                          key={p.id}
                          onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, product_id: p.id })); setProductDropdownOpen(false); setProductSearch(''); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-primary/10 transition-colors ${form.product_id === p.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'}`}
                        >
                          {p.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Type */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Key Type *</label>
              <select
                value={form.key_type}
                onChange={e => setForm(p => ({ ...p, key_type: e.target.value }))}
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              >
                {KEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                {KEY_TYPES.find(t => t.value === form.key_type)?.desc}
              </p>
            </div>
            {/* Key Value */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {form.key_type === 'subscription' || form.key_type === 'account'
                  ? 'Username / Email *'
                  : 'License Key / Value *'}
              </label>
              <input
                value={form.key_value}
                onChange={e => setForm(p => ({ ...p, key_value: e.target.value }))}
                placeholder={
                  form.key_type === 'license' ? 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX' :
                  form.key_type === 'subscription' ? 'username@example.com' :
                  'Key value লিখুন...'
                }
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-primary"
              />
            </div>
            {/* Extra Info */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {form.key_type === 'subscription' || form.key_type === 'account'
                  ? 'Password'
                  : 'Extra Info (Optional)'}
              </label>
              <textarea
                value={form.extra_info}
                onChange={e => setForm(p => ({ ...p, extra_info: e.target.value }))}
                rows={2}
                placeholder={
                  form.key_type === 'subscription' ? 'পাসওয়ার্ড লিখুন' :
                  'অতিরিক্ত তথ্য (যদি থাকে)...'
                }
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))', color: 'white' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Save License
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); }}
              className="px-4 py-2 rounded-xl text-sm border border-border text-muted-foreground hover:border-primary/40">
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {showBulk && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/20"
          style={{ background: 'hsla(42,96%,58%,0.04)' }}>
           <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Upload size={14} className="text-amber-500" /> Bulk License Import
            </h3>
            <button
              onClick={() => { setAiMode(!aiMode); setAiParsed(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                aiMode
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
              }`}
            >
              <Sparkles size={13} />
              AI Smart Import
            </button>
          </div>
           <p className="text-xs text-muted-foreground mb-3">
            {aiMode
              ? '🤖 একটি ডেমো উদাহরণ দিন, তারপর বাকি ডেটা পেস্ট করুন — AI অটো পার্স করবে।'
              : 'প্রতি লাইনে একটি করে key লিখুন, অথবা CSV/TXT ফাইল আপলোড করুন।'}
           </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div className="relative">
              <div
                onClick={() => setBulkProductDropdownOpen(!bulkProductDropdownOpen)}
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between"
              >
                <span className={bulkProductId ? 'text-foreground' : 'text-muted-foreground'}>
                  {bulkProductId ? products.find(p => p.id === bulkProductId)?.name || '—' : '— প্রোডাক্ট বেছে নিন —'}
                </span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${bulkProductDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {bulkProductDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={bulkProductSearch}
                        onChange={e => setBulkProductSearch(e.target.value)}
                        placeholder="প্রোডাক্ট খুঁজুন..."
                        className="w-full bg-muted/20 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-44">
                    {products.filter(p => !bulkProductSearch || p.name.toLowerCase().includes(bulkProductSearch.toLowerCase())).map(p => (
                      <button
                        key={p.id}
                        onClick={(e) => { e.stopPropagation(); setBulkProductId(p.id); setBulkProductDropdownOpen(false); setBulkProductSearch(''); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-primary/10 transition-colors ${bulkProductId === p.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <div
                onClick={() => setBulkTypeDropdownOpen(!bulkTypeDropdownOpen)}
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between"
              >
                <span className="text-foreground">{KEY_TYPES.find(t => t.value === bulkType)?.label || 'Key Type'}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${bulkTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {bulkTypeDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  {KEY_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => { setBulkType(t.value); setBulkTypeDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-primary/10 transition-colors ${bulkType === t.value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CSV/TXT File Upload */}
          <div className="mb-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-muted/10">
              <File size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">CSV বা TXT ফাইল আপলোড করুন</span>
              <input
                type="file"
                accept=".csv,.txt,.text"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('ফাইল সাইজ ৫MB এর বেশি হতে পারবে না');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    if (!text) return;
                    // Parse CSV: take first column of each row, skip header if it looks like one
                    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                    const keys: string[] = [];
                    for (const line of rawLines) {
                      // Split by comma, semicolon, or tab
                      const parts = line.split(/[,;\t]/);
                      const val = parts[0]?.trim();
                      if (!val) continue;
                      // Skip header-like rows
                      if (keys.length === 0 && /^(key|license|serial|id|name|product)/i.test(val)) continue;
                      keys.push(val);
                    }
                    if (keys.length === 0) {
                      toast.error('ফাইলে কোনো key পাওয়া যায়নি');
                      return;
                    }
                    const existing = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    const merged = [...existing, ...keys];
                    setBulkText(merged.join('\n'));
                    toast.success(`${keys.length}টি key ফাইল থেকে লোড হয়েছে`);
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
              <span className="ml-auto text-[10px] text-muted-foreground">.csv, .txt • সর্বোচ্চ ৫MB</span>
            </label>
          </div>

          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            rows={6}
            placeholder={'XXXXX-XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY-YYYYY\nZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ\n...'}
            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-primary resize-none"
          />
          {(() => {
            const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length === 0) return null;
            return (
              <div className="mt-3 bg-muted/30 border border-border rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Eye size={12} /> প্রিভিউ — {lines.length} টি key পাওয়া গেছে
                </p>
                <div className="flex items-center gap-2 bg-card border border-primary/20 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-primary">1.</span>
                  <code className="text-xs font-mono text-foreground break-all">{lines[0]}</code>
                  <Badge variant="outline" className="ml-auto text-[10px] shrink-0 border-primary/30 text-primary">উদাহরণ</Badge>
                </div>
                {lines.length > 1 && (
                  <div className="mt-2 flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      + আরও <span className="font-bold text-foreground">{lines.length - 1}</span> টি key একই ফরম্যাটে
                    </span>
                    {lines.length > 1 && lines.length <= 5 && (
                      <div className="ml-auto flex flex-col gap-0.5">
                        {lines.slice(1).map((line, i) => (
                          <code key={i} className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{line}</code>
                        ))}
                      </div>
                    )}
                    {lines.length > 5 && (
                      <div className="ml-auto flex flex-col gap-0.5">
                        {lines.slice(1, 4).map((line, i) => (
                          <code key={i} className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{line}</code>
                        ))}
                        <span className="text-[10px] text-muted-foreground">...আরও {lines.length - 4} টি</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {bulkText.split('\n').filter(l => l.trim()).length} টি key পাওয়া গেছে
            </span>
            <div className="flex gap-2">
              <button onClick={() => { setShowBulk(false); setBulkText(''); }}
                className="px-4 py-2 rounded-xl text-sm border border-border text-muted-foreground">বাতিল</button>
              <button onClick={handleBulkImport} disabled={bulkSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, hsl(42,96%,58%), hsl(330,85%,62%))', color: 'white' }}>
                {bulkSaving ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                Import করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Key, প্রোডাক্ট, কাস্টমার খুঁজুন..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="all">সব Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary max-w-48">
          <option value="all">সব প্রোডাক্ট</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={fetchAll} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {filtered.length} টি license key দেখানো হচ্ছে
          </span>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary">{selectedIds.size}টি সিলেক্টেড</span>
              <button onClick={() => setSelectedIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">সব বাদ দিন</button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
                {bulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                ডিলিট ({selectedIds.size})
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Key size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">কোনো license key পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Key / Credentials</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">প্রোডাক্ট</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">কাস্টমার / অর্ডার</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lic => {
                  const st = STATUS_CONFIG[lic.status] || STATUS_CONFIG.available;
                  const StIcon = st.icon;
                  const isVisible = showValues[lic.id];
                  const typeLabel = KEY_TYPES.find(t => t.value === lic.key_type)?.label || lic.key_type;
                  return (
                    <tr key={lic.id} className={`border-b border-border/40 hover:bg-muted/10 transition-colors ${selectedIds.has(lic.id) ? 'bg-primary/5' : ''}`}>
                      <td className="w-10 px-3 py-3">
                        <input type="checkbox" checked={selectedIds.has(lic.id)}
                          onChange={() => toggleSelect(lic.id)}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'hsla(258,78%,68%,0.12)', color: 'hsl(258,78%,68%)' }}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-foreground break-all">
                            {isVisible ? lic.key_value : maskValue(lic.key_value)}
                          </code>
                          <button onClick={() => toggleShow(lic.id)}
                            className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                            {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          {isVisible && (
                            <button onClick={() => copyToClipboard(lic.key_value)}
                              className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                              <Copy size={12} />
                            </button>
                          )}
                        </div>
                        {lic.extra_info && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {isVisible ? lic.extra_info : '••••••••'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-foreground font-medium">{lic.product_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: st.color }}>
                          <StIcon size={11} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {lic.customer_name ? (
                          <div>
                            <div className="text-xs font-medium text-foreground">{lic.customer_name}</div>
                            <div className="text-[10px] text-muted-foreground">#{lic.order_number}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button onClick={() => openEditModal(lic)}
                            title="এডিট করুন"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                            <Edit3 size={13} />
                          </button>
                          {/* Assign - only for available */}
                          {lic.status === 'available' && (
                            <>
                              <button onClick={() => openAssignModal(lic)}
                                title="কাস্টমারকে অ্যাসাইন করুন"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-all">
                                <UserPlus size={13} />
                              </button>
                              <button onClick={() => openWaModal(lic)}
                                title="WhatsApp এ পাঠান"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-all">
                                <MessageCircle size={13} />
                              </button>
                            </>
                          )}
                          {/* Unassign - only for assigned */}
                          {lic.status === 'assigned' && (
                            <>
                              <button onClick={() => handleUnassign(lic)}
                                title="আনঅ্যাসাইন করুন"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10 transition-all">
                                <UserMinus size={13} />
                              </button>
                              <button onClick={() => handleInvoicePrint(lic)}
                                title="ইনভয়েস প্রিন্ট"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                                <FileText size={13} />
                              </button>
                              <button onClick={() => openEmailModal(lic)}
                                title="ইমেইল পাঠান"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                                <Mail size={13} />
                              </button>
                              <button onClick={() => openWaModal(lic)}
                                title="WhatsApp এ পাঠান"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-all">
                                <MessageCircle size={13} />
                              </button>
                            </>
                          )}
                          {lic.status === 'available' && (
                            <button onClick={() => handleRevoke(lic.id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-all">
                              Revoke
                            </button>
                          )}
                          {lic.status !== 'assigned' && (
                            <button onClick={() => handleDelete(lic.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Email Resend Modal */}
      {emailModal.open && emailModal.license && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEmailModal({ open: false, license: null, email: '' })}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Mail size={16} className="text-primary" /> লাইসেন্স ইমেইল পাঠান
              </h3>
              <button onClick={() => setEmailModal({ open: false, license: null, email: '' })}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-muted/20 rounded-xl p-3 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">প্রোডাক্ট</p>
                <p className="text-sm font-semibold text-foreground">{emailModal.license.product_name}</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">License Key</p>
                <code className="text-xs font-mono text-primary break-all">{emailModal.license.key_value}</code>
                {emailModal.license.extra_info && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{emailModal.license.extra_info}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  প্রাপকের ইমেইল ঠিকানা *
                </label>
                <input
                  type="email"
                  value={emailModal.email}
                  onChange={e => setEmailModal(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
                {emailModal.license.customer_email && emailModal.email !== emailModal.license.customer_email && (
                  <button onClick={() => setEmailModal(prev => ({ ...prev, email: prev.license?.customer_email || '' }))}
                    className="text-[10px] text-primary hover:underline mt-1">
                    মূল ইমেইল ব্যবহার করুন ({emailModal.license.customer_email})
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSendEmail} disabled={sendingEmail || !emailModal.email}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))', color: 'white' }}>
                {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                ইমেইল পাঠান
              </button>
              <button onClick={() => setEmailModal({ open: false, license: null, email: '' })}
                className="px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:border-primary/40">
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Delivery Modal */}
      {waModal.open && waModal.license && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setWaModal({ open: false, license: null, phone: '' })}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <MessageCircle size={16} className="text-green-500" /> WhatsApp এ লাইসেন্স পাঠান
              </h3>
              <button onClick={() => setWaModal({ open: false, license: null, phone: '' })}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-muted/20 rounded-xl p-3 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">প্রোডাক্ট</p>
                <p className="text-sm font-semibold text-foreground">{waModal.license.product_name}</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">License Key</p>
                <code className="text-xs font-mono text-primary break-all">{waModal.license.key_value}</code>
                {waModal.license.extra_info && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{waModal.license.extra_info}</p>
                )}
              </div>
              {waModal.license.customer_name && (
                <div className="bg-muted/20 rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">কাস্টমার</p>
                  <p className="text-sm font-medium text-foreground">{waModal.license.customer_name}</p>
                  {waModal.license.order_number && (
                    <p className="text-[10px] text-muted-foreground">#{waModal.license.order_number}</p>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  কাস্টমারের ফোন নম্বর *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-l-xl px-3 py-2.5">+880</span>
                  <input
                    type="tel"
                    value={waModal.phone}
                    onChange={e => setWaModal(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-muted/20 border border-border rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                {waModal.license.customer_phone && waModal.phone !== waModal.license.customer_phone && (
                  <button onClick={() => setWaModal(prev => ({ ...prev, phone: prev.license?.customer_phone || '' }))}
                    className="text-[10px] text-green-600 hover:underline mt-1">
                    অর্ডারের নম্বর ব্যবহার করুন ({waModal.license.customer_phone})
                  </button>
                )}
              </div>
              
              {/* Message Preview */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">মেসেজ প্রিভিউ</label>
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-xs text-foreground whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                  🔑 <strong>লাইসেন্স ডেলিভারি</strong>{'\n\n'}
                  📦 প্রোডাক্ট: {waModal.license.product_name}{'\n'}
                  📝 টাইপ: {KEY_TYPES.find(t => t.value === waModal.license!.key_type)?.label || waModal.license.key_type}{'\n'}
                  {waModal.license.order_number && <>🧾 অর্ডার: #{waModal.license.order_number}{'\n'}</>}
                  {'\n'}━━━━━━━━━━━━{'\n'}
                  🔐 Key: {waModal.license.key_value}{'\n'}
                  {waModal.license.extra_info && <>🔒 Password: {waModal.license.extra_info}{'\n'}</>}
                  ━━━━━━━━━━━━{'\n\n'}
                  ✅ ধন্যবাদ! — ShahedStore
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleWhatsAppSend} disabled={!waModal.phone.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(142,70%,45%), hsl(142,70%,35%))' }}>
                <MessageCircle size={14} />
                WhatsApp এ পাঠান
              </button>
              <button onClick={() => setWaModal({ open: false, license: null, phone: '' })}
                className="px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:border-primary/40">
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit License Modal */}
      {editModal.open && editModal.license && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditModal({ open: false, license: null })}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Edit3 size={16} className="text-primary" /> লাইসেন্স এডিট করুন
              </h3>
              <button onClick={() => setEditModal({ open: false, license: null })}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">প্রোডাক্ট</label>
                  <select value={editForm.product_id} onChange={e => setEditForm(p => ({ ...p, product_id: e.target.value }))}
                    className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                    <option value="">— বেছে নিন —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Key Type</label>
                  <select value={editForm.key_type} onChange={e => setEditForm(p => ({ ...p, key_type: e.target.value }))}
                    className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                    {KEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Key / Credentials *</label>
                <input value={editForm.key_value} onChange={e => setEditForm(p => ({ ...p, key_value: e.target.value }))}
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Extra Info / Password</label>
                <textarea value={editForm.extra_info} onChange={e => setEditForm(p => ({ ...p, extra_info: e.target.value }))}
                  rows={2}
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))', color: 'white' }}>
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                সেভ করুন
              </button>
              <button onClick={() => setEditModal({ open: false, license: null })}
                className="px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:border-primary/40">
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to User Modal */}
      {assignModal.open && assignModal.license && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAssignModal({ open: false, license: null })}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus size={16} className="text-primary" /> কাস্টমারকে অ্যাসাইন করুন
              </h3>
              <button onClick={() => setAssignModal({ open: false, license: null })}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="bg-muted/20 rounded-xl p-3 border border-border mb-4">
              <p className="text-[10px] text-muted-foreground mb-0.5">লাইসেন্স</p>
              <code className="text-xs font-mono text-primary break-all">{assignModal.license.key_value}</code>
              <p className="text-[10px] text-muted-foreground mt-1">{assignModal.license.product_name}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                অর্ডার নম্বর, কাস্টমারের নাম বা ইমেইল দিয়ে খুঁজুন
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={assignSearch}
                  onChange={e => searchOrders(e.target.value)}
                  placeholder="অর্ডার নম্বর / নাম / ইমেইল..."
                  className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
                {assignSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
              </div>
            </div>

            {assignResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {assignResults.map((order: any) => (
                  <div key={order.id} className="border border-border rounded-xl p-3 hover:border-primary/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold text-foreground">#{order.order_number}</span>
                        <span className="text-xs text-muted-foreground ml-2">{order.customer_name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{order.customer_email}</span>
                    </div>
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-muted/10 rounded-lg px-3 py-2 mt-1">
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.product_name}</p>
                          {item.license_key && <p className="text-[10px] text-muted-foreground font-mono">Key: {item.license_key.slice(0, 15)}...</p>}
                        </div>
                        <button
                          onClick={() => handleAssign(item.id)}
                          disabled={assigning}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                          style={{ background: 'hsla(162,72%,46%,0.15)', color: 'hsl(162,72%,36%)' }}
                        >
                          {assigning ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />}
                          অ্যাসাইন
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {assignSearch.length >= 2 && !assignSearching && assignResults.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">কোনো অর্ডার পাওয়া যায়নি</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLicenses;
