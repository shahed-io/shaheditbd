import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Search, Edit, Trash2, Package, X, Upload,
  Image as ImageIcon, Loader2, Video, Tag, Star,
  ExternalLink, RefreshCw, Copy, ChevronDown, Sliders, Tags, Sparkles, Wand2,
  CheckSquare, Square, AlertTriangle
} from 'lucide-react';
import ProductOptionsBuilder from '@/components/admin/ProductOptionsBuilder';
import ProductAttributesEditor from '@/components/admin/ProductAttributesEditor';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(300, 'Name must be ≤ 300 characters'),
  slug: z.string().trim().max(320, 'Slug too long').optional().or(z.literal('')),
  description: z.string().trim().max(50000, 'Description too long').optional().or(z.literal('')),
  short_description: z.string().trim().max(2000, 'Short description too long').optional().or(z.literal('')),
  brand: z.string().trim().max(100, 'Brand must be ≤ 100 characters').optional().or(z.literal('')),
  seo_title: z.string().trim().max(60, 'SEO title must be ≤ 60 characters').optional().or(z.literal('')),
  seo_description: z.string().trim().max(160, 'SEO description must be ≤ 160 characters').optional().or(z.literal('')),
  image_url: z.string().trim().max(2000, 'URL too long')
    .refine(v => !v || /^https?:\/\/.+/.test(v), 'Image URL must start with http/https')
    .optional().or(z.literal('')),
  video_url: z.string().trim().max(2000, 'URL too long')
    .refine(v => !v || /^https?:\/\/.+/.test(v), 'Video URL must start with http/https')
    .optional().or(z.literal('')),
  demo_url: z.string().trim().max(2000, 'URL too long')
    .refine(v => !v || /^https?:\/\/.+/.test(v), 'Demo URL must start with http/https')
    .optional().or(z.literal('')),
  price: z.string().refine(v => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 10000000), 'Price must be 0–10,000,000').optional().or(z.literal('')),
  original_price: z.string().refine(v => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 10000000), 'Original price must be 0–10,000,000').optional().or(z.literal('')),
  discount_percent: z.string().refine(v => !v || (parseInt(v) >= 0 && parseInt(v) <= 100), 'Discount must be 0–100%').optional().or(z.literal('')),
});

interface Category { id: string; name: string; parent_id: string | null; }

interface Product {
  id: string; name: string; price: number; original_price: number | null;
  cost_price?: number | null; discount_percent: number | null; status: string;
  image_url: string | null; images?: string[] | null; video_url?: string | null;
  total_sales: number; created_at: string; is_featured: boolean; is_digital: boolean;
  tags: string[] | null; description: string | null; short_description: string | null;
  download_link: string | null; sku: string | null; category_id: string | null;
  subcategory_id?: string | null; brand?: string | null; delivery_time: string | null;
  delivery_type?: string | null; what_you_get: string[] | null;
  faq: { q: string; a: string }[] | null; seo_title: string | null;
  seo_description: string | null; variants: { name: string; options: { label: string; price: string }[] }[] | null;
  badge?: string | null; demo_url?: string | null; warranty_note?: string | null;
  refund_note?: string | null; product_type?: string | null;
  attributes?: { key: string; value: string }[] | null;
  category?: { name: string } | null;
}

const DURATION_PRESETS = [
  { label: '1 মাস', value: '1 Month' },
  { label: '2 মাস', value: '2 Months' },
  { label: '3 মাস', value: '3 Months' },
  { label: '4 মাস', value: '4 Months' },
  { label: '5 মাস', value: '5 Months' },
  { label: '6 মাস', value: '6 Months' },
  { label: '7 মাস', value: '7 Months' },
  { label: '8 মাস', value: '8 Months' },
  { label: '9 মাস', value: '9 Months' },
  { label: '10 মাস', value: '10 Months' },
  { label: '11 মাস', value: '11 Months' },
  { label: '12 মাস', value: '12 Months' },
  { label: '1 বছর', value: '1 Year' },
  { label: '2 বছর', value: '2 Years' },
  { label: '3 বছর', value: '3 Years' },
  { label: 'Lifetime', value: 'Lifetime' },
  { label: '⚙️ Custom', value: '__custom__' },
];

// Custom field types for customer input
const CUSTOM_FIELD_TYPES = [
  { value: 'text',     label: '📝 Text',      placeholder: 'Short text input' },
  { value: 'email',    label: '📧 Email',     placeholder: 'Email address' },
  { value: 'password', label: '🔒 Password',  placeholder: 'Password field' },
  { value: 'textarea', label: '📄 Textarea',  placeholder: 'Long text / notes' },
  { value: 'tel',      label: '📞 Phone',     placeholder: 'Phone number' },
  { value: 'url',      label: '🔗 URL',       placeholder: 'https://...' },
];

export interface CustomField {
  id: string;
  label: string;
  placeholder: string;
  hint: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'tel' | 'url';
  required: boolean;
}

const emptyForm = {
  // Basic
  name: '', slug: '', short_description: '', description: '',
  brand: '', badge: '', product_type: 'digital',
  // Subtitle (custom text below product title)
  subtitle: '' as string,
  // Account type & access
  account_type: '' as string,
  requires_customer_email: false,
  // Duration pricing plans
  duration_plans: [] as { duration: string; price: string; original_price: string }[],
  // Pricing
  price: '', original_price: '', discount_percent: '', cost_price: '',
  // Stock
  status: 'active', sku: '', stock_quantity: '',
  // Category (primary + multi)
  category_id: '', subcategory_id: '',
  extra_category_ids: [] as string[],
  // Flags
  is_featured: false, is_digital: true, is_flash_sale: false,
  // Media
  image_url: '', images: [] as string[], video_url: '',
  // Delivery
  delivery_time: '', delivery_type: 'instant', download_link: '',
  demo_url: '',
  // Notes
  warranty_note: '', refund_note: '',
  // Lists
  what_you_get: [''] as string[],
  // Bullet points for short description (each item = one bullet)
  short_desc_bullets: [''] as string[],
  variants: [{ name: '', options: [{ label: '', price: '' }] }] as { name: string; options: { label: string; price: string }[] }[],
  attributes: [{ key: '', value: '' }] as { key: string; value: string }[],
  faq: [{ q: '', a: '' }] as { q: string; a: string }[],
  tags: '' as string,
  // SEO
  seo_title: '', seo_description: '',
  // Custom fields: customer must fill before ordering
  custom_fields: [] as CustomField[],
};

type FormState = typeof emptyForm;
type TabId = 'basic' | 'pricing' | 'media' | 'details' | 'seo';

const ic = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";
const lc = "text-xs text-muted-foreground mb-1 block font-medium";

const PRODUCT_TYPES = [
  { value: 'digital', label: '💾 Digital Download' },
  { value: 'license_key', label: '🔑 License Key' },
  { value: 'account', label: '👤 Account Delivery' },
  { value: 'subscription', label: '🔄 Subscription' },
  { value: 'service', label: '🛠️ Service' },
  { value: 'physical', label: '📦 Physical Product' },
];

const DELIVERY_TYPES = [
  { value: 'instant', label: '⚡ Instant Delivery' },
  { value: 'manual', label: '🕐 Manual (Within hours)' },
  { value: 'scheduled', label: '📅 Scheduled' },
  { value: 'download', label: '⬇️ Download Link' },
];

const BADGES = [
  '', '🔥 Hot', '⭐ Best Seller', '🆕 New', '💎 Premium',
  '🎯 Popular', '✅ Verified', '🚀 Trending', '💥 Sale',
];

const generateSKU = (name: string) => {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
};

const generateSlug = (name: string) => {
  // Transliterate common Bengali product words to English for SEO-friendly slugs
  const bnMap: Record<string, string> = {
    'উইন্ডোজ': 'windows', 'অফিস': 'office', 'অ্যাডোবি': 'adobe',
    'নেটফ্লিক্স': 'netflix', 'স্পটিফাই': 'spotify', 'প্রিমিয়াম': 'premium',
    'লাইসেন্স': 'license', 'কি': 'key', 'সফটওয়্যার': 'software',
  };
  let slug = name;
  Object.entries(bnMap).forEach(([bn, en]) => { slug = slug.replace(new RegExp(bn, 'g'), en); });
  return slug
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')      // remove special chars (keep alphanumeric, space, dash)
    .replace(/[\s_]+/g, '-')       // spaces/underscores → dash
    .replace(/-+/g, '-')           // collapse multiple dashes
    .replace(/^-+|-+$/g, '');      // trim leading/trailing dashes
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiCardLoading, setAiCardLoading] = useState(false);
  const [aiCardPreview, setAiCardPreview] = useState<string | null>(null);
  const [cardStyle, setCardStyle] = useState<'dark_neon' | 'light_glass' | 'clean_light' | 'vibrant_promo' | 'glass_gradient' | 'glassmorphism_ui'>('dark_neon');
  const [demoDescription, setDemoDescription] = useState('');
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [shortDescOptions, setShortDescOptions] = useState<string[]>([]);
  const [showShortDescPicker, setShowShortDescPicker] = useState(false);
  // Bulk select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  // Auto SEO bulk state
  const [autoSeoRunning, setAutoSeoRunning] = useState(false);
  const [autoSeoProgress, setAutoSeoProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [autoSeoMode, setAutoSeoMode] = useState<'missing' | 'all'>('missing');
  const [showAutoSeoConfirm, setShowAutoSeoConfirm] = useState(false);
  const autoSeoCancelRef = useRef(false);
  // Extra categories dropdown open state
  const [extraCatOpen, setExtraCatOpen] = useState(false);

  // ── AI Content Generator ─────────────────────────────────────
  const generateAiContent = async (type: 'short_description' | 'description' | 'seo' | 'all') => {
    if (!form.name.trim()) { toast.error('প্রথমে প্রোডাক্টের নাম দিন'); return; }
    setAiLoading(type);
    try {
      const catName = categories.find(c => c.id === form.category_id)?.name || '';
      // Build duration & pricing info from duration_plans
      const validPlans = form.duration_plans.filter(p => p.duration.trim() && p.price.trim());
      const durationSummary = validPlans.length > 0
        ? validPlans.map(p => `${p.duration}: ৳${p.price}${p.original_price ? ` (was ৳${p.original_price})` : ''}`).join(', ')
        : (form.price ? `৳${form.price}` : '');
      const accountType = form.account_type || '';
      const subtitle = form.subtitle || '';
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName: form.name,
          category: catName,
          brand: form.brand,
          productType: form.product_type,
          price: form.price,
          durationPlans: durationSummary,
          accountType,
          subtitle,
          type,
          count: type === 'short_description' ? 3 : 1,
        },
      });
      if (error) {
        // Extract meaningful message from FunctionsHttpError
        let msg = error.message || 'Unknown error';
        try {
          const ctx = error.context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          }
        } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      const result = data?.result;
      if (type === 'short_description') {
        // Parse numbered options: "1. ...\n2. ...\n3. ..."
        const raw: string = result || '';
        const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
        const opts = lines
          .filter((l: string) => /^\d+[\.\)]\s/.test(l))
          .map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').trim());
        if (opts.length >= 2) {
          setShortDescOptions(opts);
          setShowShortDescPicker(true);
        } else {
          // Try to parse as bullet lines
          const bulletLines = raw.split('\n').map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
          setForm(p => ({ ...p, short_desc_bullets: bulletLines.length ? bulletLines : [raw.trim()] }));
          toast.success('Short description generated!');
        }
      } else if (type === 'description') {
        setForm(p => ({ ...p, description: result }));
        toast.success('Description generated!');
      } else if (type === 'seo') {
        setForm(p => ({
          ...p,
          seo_title: (result.seo_title || '').substring(0, 60),
          seo_description: (result.seo_description || '').substring(0, 160),
        }));
        toast.success('SEO content generated!');
      } else if (type === 'all') {
        const aiShortDesc: string = result.short_description || '';
        const aiLines = aiShortDesc.split('\n').map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
        setForm(p => ({
          ...p,
          short_desc_bullets: aiLines.length ? aiLines : p.short_desc_bullets,
          description: result.description || p.description,
          seo_title: (result.seo_title || '').substring(0, 60),
          seo_description: (result.seo_description || '').substring(0, 160),
        }));
        toast.success('সব AI কন্টেন্ট জেনারেট হয়েছে!');
      }
    } catch (err: any) {
      toast.error('AI Error: ' + (err.message || 'Unknown error'));
    } finally {
      setAiLoading(null);
    }
  };

  const AiBtn = ({ fieldType, label }: { fieldType: 'short_description' | 'description' | 'seo', label: string }) => (
    <button
      type="button"
      onClick={() => generateAiContent(fieldType)}
      disabled={!form.name.trim() || aiLoading !== null}
      className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {aiLoading === fieldType ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
      {aiLoading === fieldType ? 'Generating...' : label}
    </button>
  );

  // ── Auto SEO for ALL products (bulk) ──────────────────────────
  const runAutoSeoAll = async () => {
    setShowAutoSeoConfirm(false);
    const targets = (autoSeoMode === 'missing'
      ? products.filter(p => !p.seo_title || !p.seo_description || (p.seo_title || '').trim().length < 5 || (p.seo_description || '').trim().length < 10)
      : products);
    if (targets.length === 0) {
      toast.info('সব প্রোডাক্টে ইতিমধ্যে SEO সেট করা আছে।');
      return;
    }
    setAutoSeoRunning(true);
    autoSeoCancelRef.current = false;
    setAutoSeoProgress({ done: 0, total: targets.length, current: '' });
    let success = 0;
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (autoSeoCancelRef.current) break;
      const p = targets[i];
      setAutoSeoProgress({ done: i, total: targets.length, current: p.name });
      try {
        const catName = categories.find(c => c.id === p.category_id)?.name || '';
        const { data, error } = await supabase.functions.invoke('generate-product-content', {
          body: {
            productName: p.name,
            category: catName,
            brand: (p as any).brand || '',
            productType: (p as any).product_type || '',
            price: p.price ? String(p.price) : '',
            durationPlans: '',
            accountType: (p as any).account_type || '',
            subtitle: (p as any).subtitle || '',
            type: 'seo',
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const result = data?.result || {};
        const seo_title = String(result.seo_title || '').substring(0, 60);
        const seo_description = String(result.seo_description || '').substring(0, 160);
        if (!seo_title && !seo_description) throw new Error('Empty SEO from AI');
        const { error: upErr } = await supabase
          .from('products')
          .update({ seo_title, seo_description })
          .eq('id', p.id);
        if (upErr) throw upErr;
        success++;
        // Optimistic local update
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, seo_title, seo_description } : x));
      } catch (err: any) {
        console.error('Auto SEO failed for', p.name, err);
        failed++;
      }
      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 600));
    }
    setAutoSeoProgress({ done: targets.length, total: targets.length, current: '' });
    setAutoSeoRunning(false);
    if (autoSeoCancelRef.current) {
      toast.info(`বন্ধ করা হয়েছে। সফল: ${success}, ব্যর্থ: ${failed}`);
    } else {
      toast.success(`✨ Auto SEO সম্পূর্ণ! সফল: ${success}${failed ? `, ব্যর্থ: ${failed}` : ''}`);
    }
    setTimeout(() => setAutoSeoProgress(null), 2500);
  };


  // ── Demo Style AI Generator ───────────────────────────────────
  const generateDemoStyle = async () => {
    if (!form.name.trim()) { toast.error('প্রথমে প্রোডাক্টের নাম দিন'); return; }
    if (!demoDescription.trim()) { toast.error('Demo description দিন'); return; }
    setAiLoading('demo_style');
    try {
      const catName = categories.find(c => c.id === form.category_id)?.name || '';
      const validPlans = form.duration_plans.filter(p => p.duration.trim() && p.price.trim());
      const durationSummary = validPlans.length > 0
        ? validPlans.map(p => `${p.duration}: ৳${p.price}${p.original_price ? ` (was ৳${p.original_price})` : ''}`).join(', ')
        : (form.price ? `৳${form.price}` : '');
      const accountType = form.account_type || '';
      const subtitle = form.subtitle || '';
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName: form.name,
          category: catName,
          brand: form.brand,
          productType: form.product_type,
          price: form.price,
          durationPlans: durationSummary,
          accountType,
          subtitle,
          type: 'demo_style',
          demoDescription: demoDescription.trim(),
        },
      });
      if (error) {
        let msg = error.message || 'Unknown error';
        try {
          const ctx = error.context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          }
        } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setForm(p => ({ ...p, description: data?.result || p.description }));
      toast.success('✨ Demo স্টাইলে Description তৈরি হয়েছে!');
    } catch (err: any) {
      toast.error('AI Error: ' + (err.message || 'Unknown error'));
    } finally {
      setAiLoading(null);
    }
  };


  const parentCategories = categories.filter(c => !c.parent_id);
  const subCategories = categories.filter(
    c => c.parent_id && c.parent_id === form.category_id
  );

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
      setImagePreview(urlData.publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    setGalleryUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
      setForm(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      toast.success(`${urls.length} image(s) added to gallery!`);
    } catch (err: any) {
      toast.error('Gallery upload failed: ' + err.message);
    } finally {
      setGalleryUploading(false);
    }
  };

  const CARD_STYLES = [
    { value: 'dark_neon', label: '🌌 Dark Neon', desc: 'গাঢ় ব্যাকগ্রাউন্ড, নিয়ন গ্লোয়িং বর্ডার' },
    { value: 'light_glass', label: '🌸 Light Glass', desc: 'পাস্টেল গ্রেডিয়েন্ট, ফ্রস্টেড গ্লাস' },
    { value: 'clean_light', label: '🩵 Clean Light', desc: 'ক্লিন হোয়াইট, বোকে এফেক্ট' },
    { value: 'vibrant_promo', label: '🌈 Soft Aurora', desc: 'সফট অরোরা গ্রেডিয়েন্ট, লাইট প্রিমিয়াম' },
    { value: 'glass_gradient', label: '✨ Glass Gradient', desc: 'গ্লাসমরফিজম গ্রেডিয়েন্ট বর্ডার' },
    { value: 'glassmorphism_ui', label: '🪟 Glassmorphism UI', desc: 'প্রিমিয়াম হোয়াইট গ্লাস, অ্যাম্বার-ইন্ডিগো অ্যাকসেন্ট' },
  ] as const;

  // ── AI Glassmorphism Card Generator ──────────────────────────
  const generateAiCard = async () => {
    const srcUrl = form.image_url || imagePreview;
    setAiCardLoading(true);
    const styleName = CARD_STYLES.find(s => s.value === cardStyle)?.label || 'AI Card';
    const toastId = toast.loading(`🎨 ${styleName} Card তৈরি হচ্ছে...`);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-card', {
        body: {
          imageUrl: srcUrl || null,
          productName: form.name,
          category: categories.find(c => c.id === form.category_id)?.name || '',
          price: form.price,
          brand: form.brand,
          cardStyle,
        },
      });

      // Handle rate limit / payment errors gracefully
      if (error) {
        let msg = error.message || 'Unknown error';
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      // Edge function now returns 200 with { ok: false, error } on rate limits
      if (data?.ok === false || data?.error) {
        throw new Error(data.error || 'AI জেনারেশন ব্যর্থ হয়েছে');
      }

      // Server may return a storage URL directly (imageUrl) or base64 fallback (imageData)
      let previewUrl: string | null = null;
      if (data.imageUrl) {
        previewUrl = data.imageUrl;
      } else if (data.imageData) {
        // Fallback: base64 received — upload client-side
        const imageDataUrl: string = data.imageData;
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = imageDataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        ctx.drawImage(img, 0, 0);

        const webpBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('WEBP conversion failed'));
          }, 'image/webp', 0.92);
        });

        const fileName = `ai-card-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
        previewUrl = urlData.publicUrl;
      } else {
        throw new Error('AI থেকে কোনো ইমেজ পাওয়া যায়নি। আবার চেষ্টা করুন।');
      }

      // Show preview instead of directly applying
      toast.dismiss(toastId);
      toast.success('✨ AI Card তৈরি হয়েছে! প্রিভিউ দেখুন।');
      setAiCardPreview(previewUrl);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('AI Card Error: ' + (err.message || 'Unknown error'));
    } finally {
      setAiCardLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:category_id(name)')
      .order('created_at', { ascending: false });
    setProducts((data as any) || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, parent_id').eq('is_active', true).order('sort_order');
    setCategories(data || []);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod before saving
    const validation = productSchema.safeParse({
      name: form.name,
      slug: form.slug,
      description: form.description,
      short_description: form.short_desc_bullets.filter(b => b.trim()).join('\n'),
      brand: form.brand,
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      image_url: form.image_url,
      video_url: form.video_url,
      demo_url: form.demo_url,
      price: form.price,
      original_price: form.original_price,
      discount_percent: form.discount_percent,
    });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSaving(true);
    const baseSlug = form.slug || generateSlug(form.name);
    // New products: use clean SEO slug; if collision risk, append short random suffix
    const finalSlug = editingProduct
      ? (form.slug || generateSlug(form.name))
      : `${baseSlug}`;

    const cleanVariants = form.variants.filter(v => v.name.trim() && v.options.some(o => o.label.trim()));
    const cleanWYG = form.what_you_get.filter(w => w.trim());
    const cleanFaq = form.faq.filter(f => f.q.trim());
    const cleanAttrs = form.attributes.filter(a => a.key.trim());
    const tagList = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (form.is_flash_sale && !tagList.includes('flash-sale')) tagList.push('flash-sale');
    if (form.requires_customer_email && !tagList.includes('requires-email')) tagList.push('requires-email');

    // Build hidden attributes for subtitle, account_type, duration_plans
    const hiddenAttrs: { key: string; value: string }[] = [];
    if (form.account_type) hiddenAttrs.push({ key: '__account_type', value: form.account_type });
    if (form.subtitle.trim()) hiddenAttrs.push({ key: '__subtitle', value: form.subtitle.trim() });
    const validPlans = form.duration_plans.filter(p => p.duration.trim() && p.price.trim());
    if (validPlans.length) hiddenAttrs.push({ key: '__duration_plans', value: JSON.stringify(validPlans) });
    const finalAttrs = [...hiddenAttrs, ...cleanAttrs];

    // Use first duration plan price as default price if plans exist and no manual price
    const firstPlanPrice = validPlans.length ? parseFloat(validPlans[0].price) : null;
    const mainPrice = parseFloat(form.price) || firstPlanPrice || 0;
    const mainOriginalPrice = form.original_price ? parseFloat(form.original_price) : (validPlans.length && validPlans[0].original_price ? parseFloat(validPlans[0].original_price) : null);

    const payload: any = {
      name: form.name,
      slug: finalSlug,
      short_description: form.short_desc_bullets.filter(b => b.trim()).join('\n') || null,
      description: form.description || null,
      brand: form.brand || null,
      badge: form.badge || null,
      product_type: form.product_type,
      price: mainPrice,
      original_price: mainOriginalPrice,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      status: form.status,
      sku: form.sku || null,
      stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      is_featured: form.is_featured,
      is_digital: form.is_digital,
      image_url: form.image_url || null,
      images: form.images?.filter(Boolean) || [],
      video_url: form.video_url || null,
      delivery_time: form.delivery_time || null,
      delivery_type: form.delivery_type || 'instant',
      download_link: form.download_link || null,
      demo_url: form.demo_url || null,
      warranty_note: form.warranty_note || null,
      refund_note: form.refund_note || null,
      tags: tagList,
      what_you_get: cleanWYG.length ? cleanWYG : null,
      faq: cleanFaq.length ? cleanFaq : [],
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      variants: cleanVariants.length ? cleanVariants : [],
      attributes: finalAttrs.length ? finalAttrs : [],
      custom_fields: form.custom_fields.filter(f => f.label.trim()) || [],
    };

    try {
      let productId: string;
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
        toast.success('Product updated!');
      } else {
        const { data: inserted, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = (inserted as any).id;
        toast.success('Product added!');
      }

      // Sync product_categories junction table
      const allCatIds = [
        ...(form.category_id ? [form.category_id] : []),
        ...form.extra_category_ids,
      ];
      const uniqueCatIds = [...new Set(allCatIds)];

      // Delete old entries and reinsert
      await supabase.from('product_categories' as any).delete().eq('product_id', productId);
      if (uniqueCatIds.length > 0) {
        await supabase.from('product_categories' as any).insert(
          uniqueCatIds.map(cid => ({ product_id: productId, category_id: cid }))
        );
      }

      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(handleDbError(err));
    } finally {
      setSaving(false);
    }
  };

  const safeDeleteProducts = async (ids: string[]) => {
    // 1. Nullify product_id in related tables (FK constraints)
    await Promise.all([
      supabase.from('order_items').update({ product_id: null }).in('product_id', ids),
      supabase.from('license_keys').update({ product_id: null }).in('product_id', ids),
      supabase.from('product_reviews').update({ product_id: null }).in('product_id', ids),
    ]);
    // 2. Delete child tables that cascade on product_id
    const groupRes = await supabase.from('product_option_groups').select('id').in('product_id', ids);
    const groupIds = (groupRes.data || []).map((g: any) => g.id);
    if (groupIds.length) {
      await supabase.from('product_option_values').delete().in('group_id', groupIds);
      await supabase.from('product_option_groups').delete().in('id', groupIds);
    }
    await supabase.from('product_attribute_assignments').delete().in('product_id', ids);
    // 3. Now delete the products
    const { error } = await supabase.from('products').delete().in('id', ids);
    return error;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const error = await safeDeleteProducts([id]);
    if (error) toast.error('Failed to delete: ' + error.message);
    else { toast.success('Product deleted'); fetchProducts(); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const error = await safeDeleteProducts(ids);
    setBulkDeleting(false);
    setShowBulkConfirm(false);
    if (error) {
      toast.error('Bulk delete failed: ' + error.message);
    } else {
      toast.success(`${ids.length}টি প্রোডাক্ট ডিলিট হয়েছে`);
      setSelectedIds(new Set());
      fetchProducts();
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setImagePreview(product.image_url || '');
    const allTags = product.tags || [];
    const tagStr = allTags.filter(t => t !== 'flash-sale' && t !== 'requires-email').join(', ');
    const attrRaw = (product.attributes as any) || [];
    const accountTypeAttr = attrRaw.find((a: any) => a.key === '__account_type');
    const subtitleAttr = attrRaw.find((a: any) => a.key === '__subtitle');
    const durationPlansAttr = attrRaw.find((a: any) => a.key === '__duration_plans');
    const cleanAttrs = attrRaw.filter((a: any) => a.key !== '__account_type' && a.key !== '__subtitle' && a.key !== '__duration_plans');
    const parsedDurationPlans = (() => {
      try { return durationPlansAttr ? JSON.parse(durationPlansAttr.value) : []; } catch { return []; }
    })();
    const syncedPrices = (() => {
      if (!parsedDurationPlans.length) return null;
      const validPrices = parsedDurationPlans
        .map((pl: any) => parseFloat(pl.price))
        .filter((v: number) => !isNaN(v) && v > 0);
      if (!validPrices.length) return null;
      const minPrice = Math.min(...validPrices);
      const lowestPlan = parsedDurationPlans.find((pl: any) => parseFloat(pl.price) === minPrice);
      const origPrice = lowestPlan?.original_price || '';
      const o = parseFloat(origPrice);
      const p = minPrice;
      const disc = o > 0 && p > 0 && o > p ? String(Math.round(((o - p) / o) * 100)) : (o > 0 && p >= o ? '0' : '');
      return { price: String(minPrice), original_price: origPrice, discount_percent: disc };
    })();
    const existingBullets = product.short_description
      ? product.short_description.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
      : [''];

    // Load extra categories from junction table
    let extraCatIds: string[] = [];
    const { data: pcRows } = await supabase
      .from('product_categories' as any)
      .select('category_id')
      .eq('product_id', product.id);
    if (pcRows) {
      extraCatIds = (pcRows as any[])
        .map((r: any) => r.category_id)
        .filter((cid: string) => cid !== (product.category_id || ''));
    }

    setForm({
      name: product.name,
      slug: (product as any).slug && !/^[0-9a-f-]{36}$/.test((product as any).slug)
        ? (product as any).slug
        : generateSlug(product.name),
      subtitle: subtitleAttr?.value || '',
      short_description: product.short_description || '',
      short_desc_bullets: existingBullets.length ? existingBullets : [''],
      description: product.description || '',
      brand: product.brand || '',
      badge: product.badge || '',
      product_type: product.product_type || 'digital',
      account_type: accountTypeAttr?.value || '',
      requires_customer_email: allTags.includes('requires-email'),
      duration_plans: parsedDurationPlans,
      price: syncedPrices?.price ?? String(product.price),
      original_price: syncedPrices?.original_price ?? (product.original_price ? String(product.original_price) : ''),
      discount_percent: syncedPrices?.discount_percent ?? (product.discount_percent ? String(product.discount_percent) : ''),
      cost_price: product.cost_price ? String(product.cost_price) : '',
      status: product.status,
      sku: product.sku || '',
      stock_quantity: '',
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      extra_category_ids: extraCatIds,
      is_featured: product.is_featured ?? false,
      is_digital: product.is_digital ?? true,
      is_flash_sale: allTags.includes('flash-sale'),
      image_url: product.image_url || '',
      images: product.images || [],
      video_url: product.video_url || '',
      delivery_time: product.delivery_time || '',
      delivery_type: product.delivery_type || 'instant',
      download_link: product.download_link || '',
      demo_url: product.demo_url || '',
      warranty_note: product.warranty_note || '',
      refund_note: product.refund_note || '',
      tags: tagStr,
      what_you_get: product.what_you_get?.length ? product.what_you_get : [''],
      variants: (() => {
        const raw = product.variants as any;
        if (!raw?.length) return [{ name: '', options: [{ label: '', price: '' }] }];
        if (raw[0]?.label !== undefined && raw[0]?.name === undefined) {
          return [{ name: 'Options', options: raw.map((v: any) => ({ label: v.label, price: v.price })) }];
        }
        return raw;
      })(),
      attributes: cleanAttrs.length ? cleanAttrs : [{ key: '', value: '' }],
      faq: (product.faq as any)?.length ? (product.faq as any) : [{ q: '', a: '' }],
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      custom_fields: (() => {
        try {
          const cf = (product as any).custom_fields;
          return Array.isArray(cf) ? cf : [];
        } catch { return []; }
      })(),
    });
    setActiveTab('basic');
    setShowForm(true);
  };

  // Dynamic list helpers
  const setListItem = (idx: number, val: string) => {
    const arr = [...form.what_you_get]; arr[idx] = val;
    setForm(p => ({ ...p, what_you_get: arr }));
  };
  const addListItem = () => setForm(p => ({ ...p, what_you_get: [...p.what_you_get, ''] }));
  const removeListItem = (idx: number) => {
    const arr = form.what_you_get.filter((_, i) => i !== idx);
    setForm(p => ({ ...p, what_you_get: arr.length ? arr : [''] }));
  };

  const setVariantGroupName = (gi: number, val: string) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, name: val } : v);
    setForm(p => ({ ...p, variants: arr }));
  };
  const addVariantGroup = () => setForm(p => ({ ...p, variants: [...p.variants, { name: '', options: [{ label: '', price: '' }] }] }));
  const removeVariantGroup = (gi: number) => {
    const arr = form.variants.filter((_, i) => i !== gi);
    setForm(p => ({ ...p, variants: arr.length ? arr : [{ name: '', options: [{ label: '', price: '' }] }] }));
  };
  const setVariantOption = (gi: number, oi: number, key: 'label' | 'price', val: string) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, options: v.options.map((o, j) => j === oi ? { ...o, [key]: val } : o) } : v);
    setForm(p => ({ ...p, variants: arr }));
  };
  const addVariantOption = (gi: number) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, options: [...v.options, { label: '', price: '' }] } : v);
    setForm(p => ({ ...p, variants: arr }));
  };
  const removeVariantOption = (gi: number, oi: number) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, options: v.options.length > 1 ? v.options.filter((_, j) => j !== oi) : v.options } : v);
    setForm(p => ({ ...p, variants: arr }));
  };

  const setAttr = (idx: number, key: 'key' | 'value', val: string) => {
    const arr = form.attributes.map((a, i) => i === idx ? { ...a, [key]: val } : a);
    setForm(p => ({ ...p, attributes: arr }));
  };
  const addAttr = () => setForm(p => ({ ...p, attributes: [...p.attributes, { key: '', value: '' }] }));
  const removeAttr = (idx: number) => {
    const arr = form.attributes.filter((_, i) => i !== idx);
    setForm(p => ({ ...p, attributes: arr.length ? arr : [{ key: '', value: '' }] }));
  };

  const setFaq = (idx: number, key: 'q' | 'a', val: string) => {
    const arr = form.faq.map((f, i) => i === idx ? { ...f, [key]: val } : f);
    setForm(p => ({ ...p, faq: arr }));
  };
  const addFaq = () => setForm(p => ({ ...p, faq: [...p.faq, { q: '', a: '' }] }));
  const removeFaq = (idx: number) => {
    const arr = form.faq.filter((_, i) => i !== idx);
    setForm(p => ({ ...p, faq: arr.length ? arr : [{ q: '', a: '' }] }));
  };

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    draft: 'text-yellow-400 bg-yellow-400/10',
    out_of_stock: 'text-red-400 bg-red-400/10',
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'basic',      label: '📦 General' },
    { id: 'pricing',    label: '💰 Inventory' },
    { id: 'media',      label: '🖼️ Media' },
    { id: 'details',    label: '📋 Details' },
    { id: 'seo',        label: '🔍 SEO' },
  ];

  return (
    <div className="space-y-6">
      {/* Action bar — Add Product + Search */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU, brand..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-16 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">{products.length} products</span>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setForm(emptyForm);
              setImagePreview('');
              setActiveTab('basic');
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
              boxShadow: '0 8px 24px hsl(var(--primary) / 0.35)',
            }}
          >
            <Plus size={18} strokeWidth={2.5} /> Add New Product
          </button>
        </div>
      </div>


      {/* ======= PRODUCT FORM MODAL ======= */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
              <h2 className="text-xl font-bold text-foreground">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 px-6 pt-4 border-b border-border flex-shrink-0 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">

                {/* ======= BASIC TAB ======= */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    {/* Product Type */}
                    <div>
                      <label className={lc}>Product Type *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PRODUCT_TYPES.map(pt => (
                          <button
                            key={pt.value} type="button"
                            onClick={() => setForm(p => ({ ...p, product_type: pt.value }))}
                            className={`text-xs py-2 px-2 rounded-xl border transition-colors text-left ${form.product_type === pt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'}`}
                          >
                            {pt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Product Title *</label>
                      <input required value={form.name}
                        onChange={e => {
                          const n = e.target.value;
                          // Auto-update slug only if not manually edited
                          setForm(p => ({
                            ...p,
                            name: n,
                            slug: generateSlug(n),
                            seo_title: p.seo_title || n
                          }));
                        }}
                        placeholder="e.g. Windows 11 Pro License Key" className={ic} />
                      {form.name.trim() && (
                        <button
                          type="button"
                          onClick={() => generateAiContent('all')}
                          disabled={aiLoading !== null}
                          className="mt-2 w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-xl border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 transition-colors disabled:opacity-40"
                        >
                          {aiLoading === 'all' ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                          {aiLoading === 'all' ? 'AI কন্টেন্ট তৈরি হচ্ছে...' : '✨ AI দিয়ে সব Description ও SEO অটো-জেনারেট করুন'}
                        </button>
                      )}
                    </div>

                    {/* ── Subtitle (custom tagline below title) ── */}
                    <div>
                      <label className={lc}>📝 Subtitle / Custom Tagline <span className="text-muted-foreground/60">(ঐচ্ছিক)</span></label>
                      <input
                        value={form.subtitle}
                        onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                        placeholder="যেমন: Best quality guaranteed, Instant delivery..."
                        className={ic}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">প্রোডাক্ট টাইটেলের নিচে এই ছোট টেক্সটটি দেখাবে</p>
                    </div>

                    {/* ── Personal / Shared Account Type ── */}
                    <div>
                      <label className={lc}>👤 অ্যাকাউন্ট টাইপ <span className="text-muted-foreground/60">(প্রযোজ্য হলে)</span></label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { value: '', label: '— নেই —' },
                          { value: 'personal', label: '👤 Personal' },
                          { value: 'shared', label: '👥 Shared' },
                          { value: 'family', label: '🏠 Family' },
                          { value: 'student', label: '🎓 Student' },
                          { value: 'business', label: '💼 Business' },
                        ].map(opt => (
                          <button key={opt.value} type="button"
                            onClick={() => setForm(p => ({ ...p, account_type: opt.value }))}
                            className={`text-xs py-2 px-2 rounded-xl border transition-colors text-center ${form.account_type === opt.value ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={lc}>Slug (URL) *</label>
                          <button type="button" onClick={() => setForm(p => ({ ...p, slug: generateSlug(p.name) }))}
                            className="text-[10px] text-primary hover:underline">↺ নাম থেকে রিজেনারেট</button>
                        </div>
                        <input value={form.slug}
                          onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^\w-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') }))}
                          placeholder="product-name-here" className={ic} />
                        {form.slug && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            🔗 shahedstore.com.bd/product/<span className="text-primary">{form.slug}</span>
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={lc}>Brand / Publisher</label>
                        <input value={form.brand}
                          onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                          placeholder="e.g. Microsoft, Adobe" className={ic} />
                      </div>
                    </div>

                    {/* ── Bullet Points (Short Description) ── */}
                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                          📝 প্রোডাক্ট বিবরণ (বুলেট পয়েন্ট)
                          <span className="text-muted-foreground font-normal">(টাইটেলের নিচে দেখাবে)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <AiBtn fieldType="short_description" label="AI" />
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, short_desc_bullets: [...p.short_desc_bullets, ''] }))}
                            className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-2"
                          >
                            <Plus size={11} /> যোগ করুন
                          </button>
                        </div>
                      </div>

                      {form.short_desc_bullets.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-1">কোনো বুলেট নেই — উপরের বাটনে ক্লিক করুন</p>
                      )}

                      <div className="space-y-2">
                        {form.short_desc_bullets.map((bullet, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </span>
                            <input
                              value={bullet}
                              onChange={e => {
                                const arr = [...form.short_desc_bullets];
                                arr[idx] = e.target.value;
                                setForm(p => ({ ...p, short_desc_bullets: arr }));
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const arr = [...form.short_desc_bullets];
                                  arr.splice(idx + 1, 0, '');
                                  setForm(p => ({ ...p, short_desc_bullets: arr }));
                                  // Focus next input after render
                                  setTimeout(() => {
                                    const inputs = document.querySelectorAll<HTMLInputElement>('.bullet-input');
                                    inputs[idx + 1]?.focus();
                                  }, 50);
                                }
                                if (e.key === 'Backspace' && bullet === '' && form.short_desc_bullets.length > 1) {
                                  e.preventDefault();
                                  const arr = form.short_desc_bullets.filter((_, i) => i !== idx);
                                  setForm(p => ({ ...p, short_desc_bullets: arr }));
                                }
                              }}
                              placeholder={`বুলেট পয়েন্ট ${idx + 1} লিখুন...`}
                              className={`${ic} flex-1 text-sm bullet-input`}
                            />
                            {form.short_desc_bullets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const arr = form.short_desc_bullets.filter((_, i) => i !== idx);
                                  setForm(p => ({ ...p, short_desc_bullets: arr.length ? arr : [''] }));
                                }}
                                className="flex-shrink-0 text-muted-foreground hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* AI Options Picker */}
                      {showShortDescPicker && shortDescOptions.length > 0 && (
                        <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20">
                            <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                              <Sparkles size={11} /> AI-generated অপশন — একটি বেছে নিন (বুলেটে যোগ হবে)
                            </span>
                            <button type="button" onClick={() => setShowShortDescPicker(false)} className="text-muted-foreground hover:text-foreground">
                              <X size={12} />
                            </button>
                          </div>
                          <div className="divide-y divide-border/50">
                            {shortDescOptions.map((opt, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  // Parse the option into individual bullets
                                  const bulletLines = opt.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
                                  const newBullets = bulletLines.length > 1 ? bulletLines : [opt];
                                  setForm(p => ({ ...p, short_desc_bullets: newBullets }));
                                  setShowShortDescPicker(false);
                                  toast.success('বুলেট পয়েন্ট সেট হয়েছে!');
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-primary/10 transition-colors flex items-start gap-2"
                              >
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                <span className="leading-relaxed">{opt}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground">💡 Enter চাপলে নতুন বুলেট যোগ হবে। প্রোডাক্ট পেজে বুলেট লিস্ট হিসেবে দেখাবে।</p>
                    </div>


                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={lc} style={{marginBottom:0}}>Full Description</label>
                        <AiBtn fieldType="description" label="AI Generate" />
                      </div>
                      <textarea rows={4} value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Detailed product description..." className={`${ic} resize-none`} />
                    </div>

                    {/* ── Demo Style AI Panel ── */}
                    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowDemoPanel(p => !p)}
                        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Wand2 size={13} />
                          🎯 Demo দেখিয়ে AI Description লেখান
                        </span>
                        <span className="text-muted-foreground text-[10px]">{showDemoPanel ? '▲ বন্ধ করুন' : '▼ খুলুন'}</span>
                      </button>
                      {showDemoPanel && (
                        <div className="px-4 pb-4 space-y-3 border-t border-primary/20 pt-3">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            নিচে একটি <strong className="text-foreground">উদাহরণ/ডেমো ডেসক্রিপশন</strong> পেস্ট করুন।
                            AI সেটির <strong className="text-foreground">স্টাইল, ফরম্যাট ও ভাষা</strong> অনুসরণ করে
                            নতুন প্রোডাক্টের জন্য ডেসক্রিপশন লিখে দেবে।
                          </p>
                          <textarea
                            rows={7}
                            value={demoDescription}
                            onChange={e => setDemoDescription(e.target.value)}
                            placeholder="এখানে একটি পুরোনো/উদাহরণ ডেসক্রিপশন পেস্ট করুন যার স্টাইলে নতুন ডেসক্রিপশন চান..."
                            className={`${ic} resize-none text-[11px] leading-relaxed`}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={generateDemoStyle}
                              disabled={!form.name.trim() || !demoDescription.trim() || aiLoading !== null}
                              className="flex-1 flex items-center justify-center gap-2 text-xs py-2.5 px-4 rounded-xl border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {aiLoading === 'demo_style' ? (
                                <><Loader2 size={13} className="animate-spin" /> Demo স্টাইলে লেখা হচ্ছে...</>
                              ) : (
                                <><Sparkles size={13} /> এই স্টাইলে Description লিখুন</>
                              )}
                            </button>
                            {demoDescription && (
                              <button
                                type="button"
                                onClick={() => setDemoDescription('')}
                                className="text-xs px-3 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          {demoDescription && (
                            <p className="text-[10px] text-muted-foreground">
                              📝 {demoDescription.length} অক্ষর · {demoDescription.split('\n').length} লাইন
                            </p>
                          )}
                        </div>
                      )}
                    </div>



                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Primary Category</label>
                        <select value={form.category_id}
                          onChange={e => setForm(p => ({
                            ...p,
                            category_id: e.target.value,
                            subcategory_id: '',
                            extra_category_ids: p.extra_category_ids.filter(id => id !== e.target.value),
                          }))}
                          className={ic}>
                          <option value="">Select Category</option>
                          {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lc}>Subcategory</label>
                        <select value={form.subcategory_id}
                          onChange={e => setForm(p => ({ ...p, subcategory_id: e.target.value }))}
                          className={ic} disabled={!subCategories.length}>
                          <option value="">None</option>
                          {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Additional Categories (multi-select) */}
                    <div className="relative">
                      <label className={lc}>
                        Additional Categories
                        <span className="text-muted-foreground/60 ml-1">(একাধিক ক্যাটাগরিতে দেখাবে)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setExtraCatOpen(o => !o)}
                        className={`${ic} text-left flex items-center justify-between`}
                      >
                        <span className={form.extra_category_ids.length ? 'text-foreground' : 'text-muted-foreground/50'}>
                          {form.extra_category_ids.length > 0
                            ? form.extra_category_ids
                                .map(id => categories.find(c => c.id === id)?.name)
                                .filter(Boolean)
                                .join(', ')
                            : 'Select additional categories...'}
                        </span>
                        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${extraCatOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {extraCatOpen && (
                        <div className="absolute z-50 w-full mt-1 rounded-xl border border-border bg-card shadow-lg max-h-52 overflow-y-auto">
                          {parentCategories
                            .filter(c => c.id !== form.category_id)
                            .map(c => {
                              const checked = form.extra_category_ids.includes(c.id);
                              return (
                                <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 cursor-pointer text-sm">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setForm(p => ({
                                      ...p,
                                      extra_category_ids: checked
                                        ? p.extra_category_ids.filter(id => id !== c.id)
                                        : [...p.extra_category_ids, c.id],
                                    }))}
                                    className="accent-primary w-4 h-4"
                                  />
                                  <span className="text-foreground">{c.name}</span>
                                </label>
                              );
                            })}
                        </div>
                      )}
                      {form.extra_category_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {form.extra_category_ids.map(id => {
                            const cat = categories.find(c => c.id === id);
                            if (!cat) return null;
                            return (
                              <span key={id} className="flex items-center gap-2 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                                {cat.name}
                                <button type="button" onClick={() => setForm(p => ({ ...p, extra_category_ids: p.extra_category_ids.filter(i => i !== id) }))}>
                                  <X size={10} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Status</label>
                        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={ic}>
                          <option value="draft">Draft</option>
                          <option value="active">Published</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>
                      <div>
                        <label className={lc}>Badge Label</label>
                        <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} className={ic}>
                          {BADGES.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Product Tags <span className="text-muted-foreground/60">(comma separated)</span></label>
                      <input value={form.tags}
                        onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                        placeholder="windows, license, digital..." className={ic} />
                    </div>




                    <div className="flex items-center gap-5 flex-wrap pt-1">
                      {[
                        { key: 'is_featured', label: '⭐ Featured' },
                        { key: 'is_digital', label: '💻 Digital' },
                        { key: 'is_flash_sale', label: '🔥 Flash Sale' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(form as any)[key]}
                            onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                            className="w-4 h-4 accent-primary" />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.requires_customer_email}
                          onChange={e => setForm(p => ({ ...p, requires_customer_email: e.target.checked }))}
                          className="w-4 h-4 accent-primary" />
                        <span className="text-sm text-foreground">📧 গ্রাহকের ইমেইল লাগবে</span>
                      </label>
                    </div>
                    {form.requires_customer_email && (
                      <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: 'hsla(200,90%,50%,0.06)', border: '1px solid hsla(200,90%,50%,0.2)' }}>
                        <span className="text-base">📧</span>
                        <span className="text-muted-foreground">অর্ডার করার সময় গ্রাহককে তার <strong className="text-foreground">ইমেইল ঠিকানা</strong> দিতে হবে যাতে অ্যাকাউন্ট/লাইসেন্স সেই ইমেইলে সেটআপ করা যায়।</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ======= PRICING TAB ======= */}
                {activeTab === 'pricing' && (
                  <div className="space-y-4">

                    {/* ── Duration Pricing Plans ── */}
                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                          ⏱️ মেয়াদ ও মূল্য পরিকল্পনা
                          <span className="text-muted-foreground font-normal">(একাধিক প্যাকেজ)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, duration_plans: [...p.duration_plans, { duration: '', price: '', original_price: '' }] }))}
                          className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-2"
                        >
                          <Plus size={11} /> প্যাকেজ যোগ করুন
                        </button>
                      </div>

                      {form.duration_plans.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          কোনো মেয়াদ প্যাকেজ নেই — উপরের বাটনে ক্লিক করে যোগ করুন
                        </p>
                      )}

                      {form.duration_plans.map((plan, idx) => {
                        const isCustom = plan.duration === '__custom__' || (plan.duration && !DURATION_PRESETS.find(d => d.value === plan.duration));
                        return (
                          <div key={idx} className="rounded-xl border border-border bg-background p-3 space-y-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-semibold text-muted-foreground">প্যাকেজ #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, duration_plans: p.duration_plans.filter((_, i) => i !== idx) }))}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            {/* Duration selector */}
                            <div>
                              <label className={lc}>মেয়াদ</label>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {DURATION_PRESETS.map(d => (
                                  <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => {
                                      const newDuration = d.value === '__custom__' ? '' : d.value;
                                      setForm(p => ({
                                        ...p,
                                        duration_plans: p.duration_plans.map((pl, i) =>
                                          i === idx ? { ...pl, duration: d.value === '__custom__' ? '__custom__' : newDuration } : pl
                                        )
                                      }));
                                    }}
                                    className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                                      (d.value === '__custom__' ? isCustom && plan.duration === '__custom__' : plan.duration === d.value)
                                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                                        : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                                    }`}
                                  >
                                    {d.label}
                                  </button>
                                ))}
                              </div>
                              {(isCustom || plan.duration === '__custom__') && (
                                <input
                                  value={plan.duration === '__custom__' ? '' : plan.duration}
                                  onChange={e => setForm(p => ({
                                    ...p,
                                    duration_plans: p.duration_plans.map((pl, i) =>
                                      i === idx ? { ...pl, duration: e.target.value } : pl
                                    )
                                  }))}
                                  placeholder="Custom মেয়াদ লিখুন যেমন: 15 Days, 45 Days..."
                                  className={`${ic} text-xs`}
                                />
                              )}
                            </div>
                            {/* Price fields */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={lc}>বিক্রয় মূল্য (৳) *</label>
                                <input
                                  type="number"
                                  value={plan.price}
                                  onChange={e => {
                                    const newPrice = e.target.value;
                                    setForm(p => {
                                      const updatedPlans = p.duration_plans.map((pl, i) =>
                                        i === idx ? { ...pl, price: newPrice } : pl
                                      );
                                      const validPrices = updatedPlans
                                        .map(pl => parseFloat(pl.price))
                                        .filter(v => !isNaN(v) && v > 0);
                                      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
                                      const lowestPlan = updatedPlans.find(pl => parseFloat(pl.price) === minPrice);
                                      const newOrigPrice = lowestPlan?.original_price || p.original_price;
                                      const newPriceStr = minPrice !== null ? String(minPrice) : p.price;
                                      const o = parseFloat(newOrigPrice);
                                      const pr = parseFloat(newPriceStr);
                                      let disc = p.discount_percent;
                                      if (o > 0 && pr > 0 && o > pr) {
                                        disc = String(Math.round(((o - pr) / o) * 100));
                                      } else if (o > 0 && pr >= o) {
                                        disc = '0';
                                      }
                                      return {
                                        ...p,
                                        duration_plans: updatedPlans,
                                        price: newPriceStr,
                                        original_price: newOrigPrice,
                                        discount_percent: disc,
                                      };
                                    });
                                  }}
                                  placeholder="০"
                                  className={`${ic} text-xs`}
                                />
                              </div>
                              <div>
                                <label className={lc}>আসল মূল্য (৳) <span className="text-muted-foreground/60">কাটা দামে</span></label>
                                <input
                                  type="number"
                                  value={plan.original_price}
                                  onChange={e => {
                                    const newOrig = e.target.value;
                                    setForm(p => {
                                      const updatedPlans = p.duration_plans.map((pl, i) =>
                                        i === idx ? { ...pl, original_price: newOrig } : pl
                                      );
                                      const validPrices = updatedPlans
                                        .map(pl => parseFloat(pl.price))
                                        .filter(v => !isNaN(v) && v > 0);
                                      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
                                      const lowestPlan = updatedPlans.find(pl => parseFloat(pl.price) === minPrice);
                                      const syncedOrig = lowestPlan?.original_price || p.original_price;
                                      const pr = parseFloat(p.price);
                                      const o = parseFloat(syncedOrig);
                                      let disc = p.discount_percent;
                                      if (o > 0 && pr > 0 && o > pr) {
                                        disc = String(Math.round(((o - pr) / o) * 100));
                                      } else if (o > 0 && pr >= o) {
                                        disc = '0';
                                      }
                                      return {
                                        ...p,
                                        duration_plans: updatedPlans,
                                        original_price: syncedOrig,
                                        discount_percent: disc,
                                      };
                                    });
                                  }}
                                  placeholder="০"
                                  className={`${ic} text-xs`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {form.duration_plans.some(p => p.price) && (
                      <div className="rounded-xl px-3 py-2 text-xs flex items-center gap-2" style={{ background: 'hsla(142,71%,45%,0.08)', border: '1px solid hsla(142,71%,45%,0.2)' }}>
                        <span>✅</span>
                        <span className="text-muted-foreground">মেয়াদ প্ল্যান থেকে <strong className="text-foreground">সর্বনিম্ন মূল্য</strong> অটো-সিঙ্ক হয়েছে → Selling Price: <strong className="text-foreground">৳{form.price}</strong></span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Selling Price (৳) *</label>
                        <input required type="number" step="0.01" value={form.price}
                          onChange={e => {
                            const price = e.target.value;
                            const orig = parseFloat(form.original_price);
                            const p = parseFloat(price);
                            let disc = form.discount_percent;
                            if (orig > 0 && p > 0 && orig > p) {
                              disc = String(Math.round(((orig - p) / orig) * 100));
                            } else if (orig > 0 && p >= orig) {
                              disc = '0';
                            }
                            setForm(prev => ({ ...prev, price, discount_percent: disc }));
                          }} className={ic} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lc}>Original / MRP (৳)</label>
                        <input type="number" step="0.01" value={form.original_price}
                          onChange={e => {
                            const orig = e.target.value;
                            const p = parseFloat(form.price);
                            const o = parseFloat(orig);
                            let disc = form.discount_percent;
                            if (o > 0 && p > 0 && o > p) {
                              disc = String(Math.round(((o - p) / o) * 100));
                            } else if (o > 0 && p >= o) {
                              disc = '0';
                            }
                            setForm(prev => ({ ...prev, original_price: orig, discount_percent: disc }));
                          }} className={ic} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lc}>Discount % <span className="text-muted-foreground/60">(auto-calculated)</span></label>
                        <input type="number" value={form.discount_percent} readOnly
                          className={`${ic} bg-muted/50 cursor-not-allowed`} placeholder="0" />
                      </div>
                      <div>
                        <label className={lc}>Cost Price (৳) <span className="text-muted-foreground/60">internal</span></label>
                        <input type="number" step="0.01" value={form.cost_price}
                          onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} className={ic} placeholder="0.00" />
                      </div>
                    </div>

                    {form.price && form.cost_price && (
                      <div className="glass-card rounded-xl p-3 border border-primary/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">💹 Profit Margin</p>
                        <p className="text-primary font-bold text-lg">
                          ৳{(parseFloat(form.price) - parseFloat(form.cost_price)).toFixed(2)}
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({((( parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-foreground mb-3">Stock & SKU</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lc}>SKU</label>
                          <div className="flex gap-2">
                            <input value={form.sku}
                              onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                              placeholder="AUTO-SKU" className={`${ic} flex-1`} />
                            <button type="button"
                              onClick={() => setForm(p => ({ ...p, sku: generateSKU(form.name || 'PRD') }))}
                              className="px-3 py-2 rounded-xl border border-border bg-muted/30 hover:border-primary text-muted-foreground hover:text-primary transition-colors">
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={lc}>Stock Quantity</label>
                          <input type="number" value={form.stock_quantity}
                            onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))}
                            placeholder="∞" className={ic} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ======= MEDIA TAB ======= */}
                {activeTab === 'media' && (
                  <div className="space-y-5">
                    {/* Featured Image */}
                    <div>
                      <label className={lc}>Featured Image</label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                      <div className="flex gap-3 items-start">
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => fileInputRef.current?.click()}>
                          {imageUploading ? <Loader2 size={22} className="text-primary animate-spin" /> :
                            (imagePreview || form.image_url) ?
                              <img src={imagePreview || form.image_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} /> :
                              <ImageIcon size={22} className="text-muted-foreground" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                            className="w-full flex items-center justify-center gap-2 bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm hover:border-primary transition-colors disabled:opacity-50">
                            {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {imageUploading ? 'Uploading...' : 'Upload Image'}
                          </button>
                          <div className="flex gap-2 items-center">
                            <input value={form.image_url}
                              onChange={e => { setForm(p => ({ ...p, image_url: e.target.value })); setImagePreview(e.target.value); }}
                              placeholder="or paste image URL..." className={`${ic} flex-1`} />
                            {(form.image_url || imagePreview) && (
                              <a
                                href={form.image_url || imagePreview}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                title="লিংক খুলুন"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Glassmorphism Card Generator */}
                      <div
                        className="relative rounded-2xl overflow-hidden p-4 space-y-3"
                        style={{
                          background: 'linear-gradient(135deg, hsla(271,91%,65%,0.10) 0%, hsla(217,91%,60%,0.10) 100%)',
                          border: '1px solid hsla(271,91%,65%,0.30)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-px"
                          style={{ background: 'linear-gradient(90deg, transparent, hsla(271,91%,65%,0.6), transparent)' }} />

                        {/* Header */}
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base"
                            style={{ background: 'linear-gradient(135deg, hsla(271,91%,65%,0.20), hsla(217,91%,60%,0.20))', border: '1px solid hsla(271,91%,65%,0.30)' }}>
                            🎨
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-none">AI Card Generator</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Shahed Store ব্র্যান্ডিংসহ প্রোডাক্ট কার্ড তৈরি করুন</p>
                          </div>
                        </div>

                        {/* Style Selector */}
                        <div>
                          <p className="text-[11px] text-muted-foreground mb-2 font-medium">ডিজাইন স্টাইল বেছে নিন:</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {CARD_STYLES.map(style => (
                              <button
                                key={style.value}
                                type="button"
                                onClick={() => setCardStyle(style.value)}
                                className="flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all"
                                style={{
                                  background: cardStyle === style.value
                                    ? 'hsla(271,91%,65%,0.18)'
                                    : 'hsla(0,0%,100%,0.05)',
                                  border: cardStyle === style.value
                                    ? '1.5px solid hsla(271,91%,65%,0.70)'
                                    : '1px solid hsla(271,91%,65%,0.15)',
                                  boxShadow: cardStyle === style.value ? '0 0 10px hsla(271,91%,65%,0.20)' : 'none',
                                }}
                              >
                                <span className="text-xs font-semibold text-foreground">{style.label}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{style.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Style Preview Hint */}
                        <div className="rounded-xl px-3 py-2 text-[11px] text-muted-foreground flex items-start gap-2"
                          style={{ background: 'hsla(0,0%,100%,0.05)', border: '1px dashed hsla(271,91%,65%,0.20)' }}>
                          <span>💡</span>
                          <span>
                            {cardStyle === 'dark_neon' && 'গাঢ় ব্যাকগ্রাউন্ড + নিয়ন গ্লোয়িং বর্ডার, Shahed Store ব্র্যান্ডিং সহ — রেফারেন্স: Grok card'}
                            {cardStyle === 'light_glass' && 'পাস্টেল কালার গ্রেডিয়েন্ট + ফ্রস্টেড গ্লাস কার্ড — রেফারেন্স: CamScanner colorful card'}
                            {cardStyle === 'clean_light' && 'ক্লিন হোয়াইট + বোকে বলস + লাল Shahed Store ব্যাজ — রেফারেন্স: CamScanner clean card'}
                            {cardStyle === 'vibrant_promo' && 'সফট অরোরা গ্রেডিয়েন্ট + হোয়াইট গ্লাস কার্ড, লাইট প্রিমিয়াম প্রোডাক্ট শোকেস'}
                            {cardStyle === 'glass_gradient' && 'ডার্ক ব্যাকগ্রাউন্ড + মাল্টি-কালার গ্লোয়িং গ্রেডিয়েন্ট বর্ডার, প্রিমিয়াম গ্লাসমরফিজম'}
                            {cardStyle === 'glassmorphism_ui' && 'প্রিমিয়াম হোয়াইট গ্লাস কার্ড + অ্যাম্বার-ইন্ডিগো অ্যাকসেন্ট, Apple Vision Pro স্টাইল'}
                          </span>
                        </div>

                        {/* Generate Button */}
                        <button
                          type="button"
                          onClick={generateAiCard}
                          disabled={aiCardLoading || imageUploading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
                          style={{
                            background: aiCardLoading
                              ? 'hsla(271,91%,65%,0.40)'
                              : 'linear-gradient(135deg, hsl(271,91%,60%), hsl(217,91%,55%))',
                            boxShadow: '0 4px 20px hsla(271,91%,65%,0.35)',
                          }}
                        >
                          {aiCardLoading
                            ? <><Loader2 size={15} className="animate-spin" /> AI তৈরি হচ্ছে...</>
                            : <><Wand2 size={15} /> ✨ এই স্টাইলে Card তৈরি করুন</>}
                        </button>

                        {aiCardLoading && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex gap-2">
                              {[0, 0.2, 0.4].map((d, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}s` }} />
                              ))}
                            </div>
                            AI ছবি তৈরি করছে, WEBP কনভার্ট করছে এবং সেভ করছে...
                          </div>
                        )}

                        {/* AI Card Preview Modal */}
                        {aiCardPreview && (
                          <div className="rounded-2xl overflow-hidden border border-primary/30 space-y-3"
                            style={{ background: 'hsla(271,91%,65%,0.08)' }}>
                            <div className="p-3 pb-0">
                              <p className="text-xs font-semibold text-foreground mb-2">🖼️ জেনারেট করা ইমেজ প্রিভিউ:</p>
                              <div className="rounded-xl overflow-hidden border border-border bg-background">
                                <img
                                  src={aiCardPreview}
                                  alt="AI Generated Card Preview"
                                  className="w-full h-auto max-h-[300px] object-contain"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 p-3 pt-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setForm(prev => ({ ...prev, image_url: aiCardPreview }));
                                  setImagePreview(aiCardPreview);
                                  setAiCardPreview(null);
                                  toast.success('✅ ইমেজ সেট করা হয়েছে!');
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{ background: 'linear-gradient(135deg, hsl(142,71%,45%), hsl(142,71%,35%))' }}
                              >
                                ✅ ব্যবহার করুন
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAiCardPreview(null);
                                  toast.info('ইমেজ বাতিল করা হয়েছে');
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground border border-border transition-all hover:bg-muted"
                              >
                                ❌ বাতিল করুন
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div>
                      <label className={lc}>Gallery Images <span className="text-muted-foreground/60">(multiple)</span></label>
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { if (e.target.files?.length) handleGalleryUpload(e.target.files); }} />
                      {form.images && form.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {form.images.map((img, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button type="button"
                                onClick={() => setForm(p => ({ ...p, images: p.images?.filter((_, idx) => idx !== i) || [] }))}
                                className="absolute top-0.5 right-0.5 bg-destructive/80 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading}
                        className="w-full flex items-center justify-center gap-2 bg-muted/30 border border-dashed border-border rounded-xl px-4 py-3 text-sm hover:border-primary transition-colors disabled:opacity-50">
                        {galleryUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                        {galleryUploading ? 'Uploading...' : 'Add Gallery Images'}
                      </button>
                    </div>

                    {/* Video */}
                    <div>
                      <label className={lc}>Video Preview URL</label>
                      <div className="flex gap-2 items-center">
                        <Video size={16} className="text-muted-foreground flex-shrink-0" />
                        <input value={form.video_url}
                          onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                          placeholder="YouTube or direct video URL..." className={`${ic} flex-1`} />
                      </div>
                      {form.video_url && (
                        <a href={form.video_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-2 mt-1 hover:underline">
                          <ExternalLink size={11} /> Preview video
                        </a>
                      )}
                    </div>

                    {/* Demo Button */}
                    <div>
                      <label className={lc}>Demo / Preview URL</label>
                      <input value={form.demo_url}
                        onChange={e => setForm(p => ({ ...p, demo_url: e.target.value }))}
                        placeholder="https://demo.example.com" className={ic} />
                      <p className="text-xs text-muted-foreground mt-1">Shown as "Try Demo" button on product page</p>
                    </div>
                  </div>
                )}

                {/* ======= DETAILS TAB ======= */}
                {activeTab === 'details' && (
                  <div className="space-y-5">
                    {/* Delivery */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Delivery Type</label>
                        <select value={form.delivery_type} onChange={e => setForm(p => ({ ...p, delivery_type: e.target.value }))} className={ic}>
                          {DELIVERY_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lc}>Delivery Time</label>
                        <input value={form.delivery_time}
                          onChange={e => setForm(p => ({ ...p, delivery_time: e.target.value }))}
                          placeholder="Instant / 24 hours..." className={ic} />
                      </div>
                    </div>

                    {form.is_digital && (
                      <div>
                        <label className={lc}>Download Link</label>
                        <input value={form.download_link}
                          onChange={e => setForm(p => ({ ...p, download_link: e.target.value }))}
                          placeholder="https://..." className={ic} />
                      </div>
                    )}

                    {/* Notes */}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className={lc}>Warranty / Guarantee Note</label>
                        <input value={form.warranty_note}
                          onChange={e => setForm(p => ({ ...p, warranty_note: e.target.value }))}
                          placeholder="e.g. 1 Year Genuine Warranty" className={ic} />
                      </div>
                      <div>
                        <label className={lc}>Refund Policy Note</label>
                        <input value={form.refund_note}
                          onChange={e => setForm(p => ({ ...p, refund_note: e.target.value }))}
                          placeholder="e.g. No refund after activation" className={ic} />
                      </div>
                    </div>

                    {/* What You Get */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">What You Get</label>
                        <button type="button" onClick={addListItem} className="text-xs text-primary hover:underline flex items-center gap-2"><Plus size={12} /> Add</button>
                      </div>
                      <div className="space-y-2">
                        {form.what_you_get.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={item} onChange={e => setListItem(i, e.target.value)}
                              placeholder={`Item ${i + 1}`} className={`${ic} flex-1`} />
                            <button type="button" onClick={() => removeListItem(i)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FAQ */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">FAQ</label>
                        <button type="button" onClick={addFaq} className="text-xs text-primary hover:underline flex items-center gap-2"><Plus size={12} /> Add</button>
                      </div>
                      <div className="space-y-3">
                        {form.faq.map((item, i) => (
                          <div key={i} className="glass-card rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-medium">FAQ #{i + 1}</span>
                              <button type="button" onClick={() => removeFaq(i)} className="text-muted-foreground hover:text-destructive"><X size={13} /></button>
                            </div>
                            <input value={item.q} onChange={e => setFaq(i, 'q', e.target.value)} placeholder="Question" className={ic} />
                            <textarea rows={2} value={item.a} onChange={e => setFaq(i, 'a', e.target.value)} placeholder="Answer" className={`${ic} resize-none`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Custom Order Fields ── */}
                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                            📋 অর্ডার কাস্টম ফিল্ড
                          </label>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            অর্ডার করার সময় গ্রাহক কী তথ্য দেবে (ইমেইল, পাসওয়ার্ড ইত্যাদি) তা নির্ধারণ করুন
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newField: CustomField = {
                              id: `field_${Date.now()}`,
                              label: '',
                              placeholder: '',
                              hint: '',
                              type: 'text',
                              required: true,
                            };
                            setForm(p => ({ ...p, custom_fields: [...p.custom_fields, newField] }));
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-2"
                        >
                          <Plus size={11} /> ফিল্ড যোগ করুন
                        </button>
                      </div>

                      {form.custom_fields.length === 0 && (
                        <div className="text-center py-4 border border-dashed border-border rounded-xl">
                          <p className="text-xs text-muted-foreground">কোনো কাস্টম ফিল্ড নেই</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">যেমন: Microsoft Account Email, Adobe Password ইত্যাদি</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {form.custom_fields.map((field, idx) => (
                          <div key={field.id} className="rounded-xl border border-border bg-background p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-muted-foreground">ফিল্ড #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, custom_fields: p.custom_fields.filter((_, i) => i !== idx) }))}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </div>

                            {/* Field Type */}
                            <div>
                              <label className={lc}>ফিল্ড টাইপ</label>
                              <div className="flex flex-wrap gap-1.5">
                                {CUSTOM_FIELD_TYPES.map(ft => (
                                  <button
                                    key={ft.value}
                                    type="button"
                                    onClick={() => setForm(p => ({
                                      ...p,
                                      custom_fields: p.custom_fields.map((f, i) =>
                                        i === idx ? { ...f, type: ft.value as CustomField['type'], placeholder: f.placeholder || ft.placeholder } : f
                                      )
                                    }))}
                                    className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                                      field.type === ft.value
                                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                                        : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                                    }`}
                                  >
                                    {ft.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {/* Label */}
                              <div>
                                <label className={lc}>লেবেল <span className="text-destructive">*</span></label>
                                <input
                                  value={field.label}
                                  onChange={e => setForm(p => ({
                                    ...p,
                                    custom_fields: p.custom_fields.map((f, i) => i === idx ? { ...f, label: e.target.value } : f)
                                  }))}
                                  placeholder="যেমন: Mail Address"
                                  className={ic}
                                />
                              </div>
                              {/* Placeholder */}
                              <div>
                                <label className={lc}>Placeholder</label>
                                <input
                                  value={field.placeholder}
                                  onChange={e => setForm(p => ({
                                    ...p,
                                    custom_fields: p.custom_fields.map((f, i) => i === idx ? { ...f, placeholder: e.target.value } : f)
                                  }))}
                                  placeholder="যেমন: example@gmail.com"
                                  className={ic}
                                />
                              </div>
                            </div>

                            {/* Hint */}
                            <div>
                              <label className={lc}>সাহায্যকারী টেক্সট (Hint)</label>
                              <input
                                value={field.hint}
                                onChange={e => setForm(p => ({
                                  ...p,
                                  custom_fields: p.custom_fields.map((f, i) => i === idx ? { ...f, hint: e.target.value } : f)
                                }))}
                                placeholder="যেমন: Microsoft Account Any Mail"
                                className={ic}
                              />
                            </div>

                            {/* Required toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={e => setForm(p => ({
                                  ...p,
                                  custom_fields: p.custom_fields.map((f, i) => i === idx ? { ...f, required: e.target.checked } : f)
                                }))}
                                className="w-3.5 h-3.5 accent-primary"
                              />
                              <span className="text-xs text-foreground">আবশ্যিক ফিল্ড (Required)</span>
                            </label>

                            {/* Preview */}
                            {field.label && (
                              <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1">
                                <p className="text-[10px] text-muted-foreground font-medium">👁️ Preview:</p>
                                <p className="text-xs text-foreground">{field.label} {field.required && <span className="text-destructive">*</span>}</p>
                                <div className="w-full h-8 rounded-lg border border-border bg-background px-2.5 flex items-center">
                                  <span className="text-[11px] text-muted-foreground/50">{field.placeholder || '...'}</span>
                                </div>
                                {field.hint && <p className="text-[10px] text-muted-foreground">{field.hint}</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ======= SEO TAB ======= */}
                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    {/* AI Generate SEO */}
                    <button
                      type="button"
                      onClick={() => generateAiContent('seo')}
                      disabled={!form.name.trim() || aiLoading !== null}
                      className="w-full flex items-center justify-center gap-2 text-sm py-2.5 px-4 rounded-xl border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aiLoading === 'seo' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {aiLoading === 'seo' ? 'SEO কন্টেন্ট তৈরি হচ্ছে...' : '✨ AI দিয়ে SEO Title ও Meta Description অটো-জেনারেট করুন'}
                    </button>
                    <div>
                      <label className={lc}>SEO Title <span className="text-muted-foreground/60">(max 60 chars)</span></label>
                      <input value={form.seo_title} onChange={e => setForm(p => ({ ...p, seo_title: e.target.value }))}
                        maxLength={60} placeholder="SEO title..." className={ic} />
                      <p className="text-xs text-muted-foreground mt-1">{form.seo_title.length}/60</p>
                    </div>
                    <div>
                      <label className={lc}>Meta Description <span className="text-muted-foreground/60">(max 160 chars)</span></label>
                      <textarea rows={3} value={form.seo_description}
                        onChange={e => setForm(p => ({ ...p, seo_description: e.target.value }))}
                        maxLength={160} placeholder="Meta description..." className={`${ic} resize-none`} />
                      <p className="text-xs text-muted-foreground mt-1">{form.seo_description.length}/160</p>
                    </div>
                    {(form.seo_title || form.seo_description) && (
                      <div className="glass-card rounded-xl p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">🔍 Google Preview</p>
                        <p className="text-primary text-sm font-medium line-clamp-1">{form.seo_title || form.name || 'Product Title'}</p>
                        <p className="text-accent text-xs">shahedstore.com.bd/product/{form.slug || 'product-slug'}</p>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{form.seo_description || 'No description.'}</p>
                      </div>
                    )}
                    <div className="glass-card rounded-xl p-4 border border-border space-y-2">
                      <p className="text-xs font-medium text-foreground">SEO Checklist</p>
                      {[
                        { ok: form.seo_title.length >= 10 && form.seo_title.length <= 60, label: 'Title between 10–60 chars' },
                        { ok: form.seo_description.length >= 50 && form.seo_description.length <= 160, label: 'Description 50–160 chars' },
                        { ok: !!form.image_url, label: 'Featured image set' },
                        { ok: !!form.slug, label: 'URL slug defined' },
                        { ok: !!form.description, label: 'Full description added' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2 text-xs">
                          <span className={item.ok ? 'text-green-400' : 'text-muted-foreground'}>{item.ok ? '✓' : '○'}</span>
                          <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ======= LINKED PRODUCTS TAB - REMOVED ======= */}

              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======= PRODUCTS TABLE ======= */}
      <div className="glass-card rounded-2xl overflow-hidden">

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-destructive/10 border-b border-destructive/20">
            <span className="text-sm font-medium text-destructive">
              {selectedIds.size}টি প্রোডাক্ট সিলেক্ট করা হয়েছে
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                {selectedIds.size}টি ডিলিট করুন
              </button>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkConfirm && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold">নিশ্চিত করুন</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                আপনি কি সত্যিই <strong className="text-foreground">{selectedIds.size}টি</strong> প্রোডাক্ট ডিলিট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkConfirm(false)}
                  className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {bulkDeleting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'হ্যাঁ, ডিলিট করুন'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary transition-colors">
                      {selectedIds.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={16} className="text-primary" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Price</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Sales</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((product) => (
                  <tr key={product.id} className={`hover:bg-muted/10 transition-colors ${selectedIds.has(product.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(product.id)} className="text-muted-foreground hover:text-primary transition-colors">
                        {selectedIds.has(product.id)
                          ? <CheckSquare size={16} className="text-primary" />
                          : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url ?
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} /> :
                            <Package size={20} className="m-2.5 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="font-medium text-foreground line-clamp-1">{product.name}</div>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                            {product.is_featured && <span className="text-xs text-primary">⭐</span>}
                            {product.badge && <span className="text-xs bg-primary/10 text-primary px-1.5 rounded">{product.badge}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">{product.product_type || 'digital'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-primary">৳{Number(product.price).toLocaleString()}</div>
                      {product.original_price && <div className="text-xs text-muted-foreground line-through">৳{Number(product.original_price).toLocaleString()}</div>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{product.total_sales}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[product.status] || ''}`}>
                        {product.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
