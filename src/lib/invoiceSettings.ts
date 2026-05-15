/**
 * Invoice Design Settings
 * --------------------------------------------------------------
 * Centralised configuration that controls the visual look of every
 * generated invoice (admin preview, PDF download, email, standalone
 * license PDF, etc). Stored in `site_settings` under the key
 * `invoice_design` so admins can fully customise colours, branding
 * text and labels from the admin panel without code changes.
 */
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceDesign {
  // Colors
  brandColor: string;       // Primary brand colour — heading, total, accents
  brandLight: string;       // Light tint — info card backgrounds
  headerBg: string;         // Items table header background ("auto" = derived)
  headerText: string;       // Items table header text colour
  totalColor: string;       // Total row text colour ("auto" = brandColor)
  accentText: string;       // Body dark text (#1a1a2e default)
  // Layout
  borderRadius: number;     // Card radius (px)
  showLogo: boolean;
  // Content
  companyName: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  invoiceTitle: string;     // e.g. "INVOICE", "চালান", "বিল"
  thankYouText: string;
  footerNote: string;
  // Labels (Bengali by default — can be edited)
  labelBilling: string;
  labelPayment: string;
  labelItem: string;
  labelQty: string;
  labelPrice: string;
  labelTotal: string;
  labelSubtotal: string;
  labelDiscount: string;
  labelGrandTotal: string;
}

export const DEFAULT_INVOICE_DESIGN: InvoiceDesign = {
  brandColor: '#7c3aed',
  brandLight: '#f3f0ff',
  headerBg: 'auto',
  headerText: '#ffffff',
  totalColor: 'auto',
  accentText: '#1a1a2e',
  borderRadius: 12,
  showLogo: true,
  companyName: 'Shahed Store',
  companyWebsite: 'shahedstore.com.bd',
  companyEmail: 'info@shahedstore.com.bd',
  companyPhone: '',
  companyAddress: '',
  invoiceTitle: 'INVOICE',
  thankYouText: 'ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য!',
  footerNote: 'This is a computer-generated invoice and does not require a signature.',
  labelBilling: 'বিলিং তথ্য',
  labelPayment: 'Payment Info',
  labelItem: 'পণ্যের নাম',
  labelQty: 'পরিমাণ',
  labelPrice: 'দাম',
  labelTotal: 'মোট',
  labelSubtotal: 'Subtotal',
  labelDiscount: 'Discount',
  labelGrandTotal: 'Total',
};

let cache: InvoiceDesign | null = null;
let loadingPromise: Promise<InvoiceDesign> | null = null;

function parseValue(raw: any): Partial<InvoiceDesign> {
  if (!raw) return {};
  // String case — older rows may have stored the JSON as a text blob
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as Partial<InvoiceDesign>; } catch { return {}; }
  }
  // Corrupted character-indexed object {0:"{", 1:"\"", ...} → reassemble & parse
  if (typeof raw === 'object' && !Array.isArray(raw) && '0' in raw && '1' in raw) {
    try {
      const reconstructed = Object.keys(raw)
        .filter((k) => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => raw[k])
        .join('');
      return JSON.parse(reconstructed) as Partial<InvoiceDesign>;
    } catch { return {}; }
  }
  return raw as Partial<InvoiceDesign>;
}

export async function loadInvoiceDesign(force = false): Promise<InvoiceDesign> {
  if (!force && cache) return cache;
  if (!force && loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'invoice_design')
        .maybeSingle();
      const merged: InvoiceDesign = {
        ...DEFAULT_INVOICE_DESIGN,
        ...parseValue(data?.value),
      };
      cache = merged;
      return merged;
    } catch {
      cache = DEFAULT_INVOICE_DESIGN;
      return DEFAULT_INVOICE_DESIGN;
    } finally {
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}

export async function saveInvoiceDesign(design: InvoiceDesign): Promise<void> {
  // Ensure we always write a clean plain object (never a stringified blob)
  const clean: InvoiceDesign = JSON.parse(JSON.stringify(design));
  const { error } = await supabase
    .from('site_settings')
    .upsert(
      { key: 'invoice_design', value: clean as any, category: 'invoice' },
      { onConflict: 'key' }
    );
  if (error) throw error;
  cache = clean;
  // Broadcast so any open tab / module reloads its design
  try {
    new BroadcastChannel('invoice_design').postMessage({ type: 'updated', design: clean });
  } catch { /* noop */ }
}

export function clearInvoiceDesignCache() {
  cache = null;
}

// Auto-invalidate cache in this tab when another tab/module saves a new design
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    const ch = new BroadcastChannel('invoice_design');
    ch.onmessage = (ev) => {
      if (ev.data?.type === 'updated') {
        cache = (ev.data.design as InvoiceDesign) || null;
      }
    };
  } catch { /* noop */ }
}

/**
 * Resolve "auto" header background using brand luminance so text stays
 * readable. Returns a concrete bg/text pair ready to inline.
 */
export function resolveHeaderTheme(d: InvoiceDesign): { bg: string; text: string } {
  if (d.headerBg !== 'auto') return { bg: d.headerBg, text: d.headerText };
  const lum = relLuminance(d.brandColor);
  if (lum > 0.55) return { bg: '#1a1a2e', text: d.headerText || '#ffffff' };
  return { bg: d.brandColor, text: d.headerText || '#ffffff' };
}

export function resolveTotalColor(d: InvoiceDesign): string {
  return d.totalColor && d.totalColor !== 'auto' ? d.totalColor : d.brandColor;
}

function relLuminance(hex: string): number {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length !== 6) return 0;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const ch = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
