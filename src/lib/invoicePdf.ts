/**
 * Unified PDF Invoice Generator
 * - Uses jsPDF + autoTable for professional, readable PDF output
 * - Uploads to Supabase `invoices` bucket → returns public URL
 * - Builds a WhatsApp wa.me link with the PDF link embedded so customers
 *   receive a real downloadable PDF instead of a long text block.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import logoIcon from '@/assets/logo.png';

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total?: number;
  license_key?: string | null;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string | Date;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  transactionId?: string;
  status?: string;
  notes?: string;
}

const BRAND = {
  primary: [124, 58, 237] as [number, number, number], // violet-600
  light: [243, 240, 255] as [number, number, number],
  dark: [26, 26, 46] as [number, number, number],
  muted: [110, 110, 130] as [number, number, number],
  success: [5, 150, 105] as [number, number, number],
};

const PM_LABELS: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  upay: 'Upay',
  bank: 'Bank Transfer',
  cash: 'Cash',
  bkash_merchant: 'bKash Merchant',
  other: 'Other',
};

let cachedLogo: string | null = null;

async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch(logoIcon);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogo = reader.result as string;
        resolve(cachedLogo);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fmtMoney(n: number): string {
  return 'BDT ' + Number(n || 0).toLocaleString('en-US');
}

function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Build a printable PDF as a Blob.
 * NOTE: jsPDF built-in fonts don't support Bengali; we use English labels in
 * the PDF so output is always crisp and readable. Product names from the DB
 * may include Bengali — those characters typically render as boxes with
 * built-in helvetica. To stay clean we transliterate via the system using
 * UTF text and set font to helvetica which handles Latin + numerals well.
 * Customer-facing Bengali appears in the WhatsApp message body; the PDF is
 * a clean English/Latin invoice.
 */
export async function buildInvoicePdf(data: InvoiceData): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  // ── Header band
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageW, 90, 'F');

  // Logo
  const logo = await loadLogoBase64();
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, 22, 46, 46);
    } catch {
      /* ignore */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SHAHED STORE', margin + 58, 45);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Digital Products', margin + 58, 60);
  doc.text('shahedstore.com.bd  |  +880 1840 099 853', margin + 58, 73);

  // Invoice title (right)
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageW - margin, 45, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${data.invoiceNumber}`, pageW - margin, 62, { align: 'right' });
  doc.text(fmtDate(data.date), pageW - margin, 76, { align: 'right' });

  // ── Bill To / Payment cards
  let y = 120;
  const cardW = (pageW - margin * 2 - 14) / 2;

  // Bill To
  doc.setFillColor(...BRAND.light);
  doc.roundedRect(margin, y, cardW, 90, 6, 6, 'F');
  doc.setTextColor(...BRAND.primary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin + 12, y + 18);

  doc.setTextColor(...BRAND.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(String(data.customer.name || '-'), margin + 12, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  let cy = y + 52;
  if (data.customer.phone) { doc.text(`Phone: ${data.customer.phone}`, margin + 12, cy); cy += 12; }
  if (data.customer.email) { doc.text(`Email: ${data.customer.email}`, margin + 12, cy); cy += 12; }
  if (data.customer.address) { doc.text(`Address: ${data.customer.address}`, margin + 12, cy); }

  // Payment
  const px = margin + cardW + 14;
  doc.setFillColor(...BRAND.light);
  doc.roundedRect(px, y, cardW, 90, 6, 6, 'F');
  doc.setTextColor(...BRAND.primary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT', px + 12, y + 18);

  doc.setTextColor(...BRAND.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let py = y + 36;
  doc.text(`Method: ${PM_LABELS[data.paymentMethod || ''] || data.paymentMethod || 'N/A'}`, px + 12, py);
  py += 13;
  if (data.transactionId) { doc.text(`TrxID: ${data.transactionId}`, px + 12, py); py += 13; }
  if (data.status) {
    doc.setTextColor(...BRAND.success);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${data.status.toUpperCase()}`, px + 12, py);
  }

  // ── Items table
  const rows = data.items.map((it, idx) => {
    const total = it.total ?? it.quantity * it.price;
    const name = it.license_key ? `${it.name}\nKey: ${it.license_key}` : it.name;
    return [
      String(idx + 1),
      name,
      String(it.quantity),
      fmtMoney(it.price),
      fmtMoney(total),
    ];
  });

  autoTable(doc, {
    startY: y + 110,
    head: [['#', 'Product / Description', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 8,
      lineColor: [230, 230, 240],
      textColor: BRAND.dark,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [250, 249, 255] },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
      3: { cellWidth: 90, halign: 'right' },
      4: { cellWidth: 100, halign: 'right', fontStyle: 'bold' },
    },
  });

  // ── Totals box
  // @ts-expect-error - autoTable adds lastAutoTable
  const tableEnd = doc.lastAutoTable.finalY || y + 200;
  const totalsX = pageW - margin - 220;
  let ty = tableEnd + 14;

  const sub = data.subtotal ?? data.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const disc = data.discount || 0;

  doc.setFillColor(...BRAND.light);
  doc.roundedRect(totalsX, ty, 220, disc > 0 ? 76 : 56, 6, 6, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.muted);
  doc.text('Subtotal', totalsX + 14, ty + 20);
  doc.setTextColor(...BRAND.dark);
  doc.text(fmtMoney(sub), totalsX + 206, ty + 20, { align: 'right' });

  if (disc > 0) {
    doc.setTextColor(...BRAND.success);
    doc.text('Discount', totalsX + 14, ty + 36);
    doc.text('-' + fmtMoney(disc), totalsX + 206, ty + 36, { align: 'right' });
  }

  const totalY = disc > 0 ? ty + 60 : ty + 42;
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.8);
  doc.line(totalsX + 12, totalY - 8, totalsX + 208, totalY - 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.primary);
  doc.text('TOTAL', totalsX + 14, totalY + 6);
  doc.text(fmtMoney(data.total), totalsX + 206, totalY + 6, { align: 'right' });

  // ── Notes
  if (data.notes) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(margin, ty, totalsX - margin - 14, disc > 0 ? 76 : 56, 6, 6, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('NOTE', margin + 12, ty + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 70, 40);
    const noteLines = doc.splitTextToSize(data.notes, totalsX - margin - 38);
    doc.text(noteLines, margin + 12, ty + 32);
  }

  // ── Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BRAND.light);
  doc.setLineWidth(1.2);
  doc.line(margin, pageH - 60, pageW - margin, pageH - 60);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.primary);
  doc.text('Thank you for shopping with Shahed Store!', pageW / 2, pageH - 42, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text('shahedstore.com.bd  |  info@shahedstore.com.bd  |  +880 1840 099 853', pageW / 2, pageH - 28, { align: 'center' });
  doc.setFontSize(7);
  doc.text('This is a computer-generated invoice and does not require a signature.', pageW / 2, pageH - 16, { align: 'center' });

  return doc.output('blob');
}

/**
 * Upload a PDF blob to the public `invoices` bucket and return a public URL.
 */
export async function uploadInvoicePdf(blob: Blob, invoiceNumber: string): Promise<string> {
  const safe = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${new Date().getFullYear()}/${safe}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from('invoices').upload(path, blob, {
    contentType: 'application/pdf',
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw error;
  const { data } = supabase.storage.from('invoices').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Normalize Bangladeshi phone to wa.me format (8801XXXXXXXXX).
 */
export function normalizeWaPhone(raw?: string | null): string {
  if (!raw) return '';
  let p = String(raw).replace(/\D/g, '');
  if (p.startsWith('880')) return p;
  if (p.startsWith('0')) return '880' + p.slice(1);
  if (p.length === 10) return '880' + p;
  return p;
}

/**
 * One-shot helper: build PDF → upload → open WhatsApp with PDF link.
 */
export async function sendInvoiceViaWhatsApp(
  data: InvoiceData,
  options?: { phone?: string; messagePrefix?: string }
): Promise<{ url: string; waUrl: string }> {
  const blob = await buildInvoicePdf(data);
  const url = await uploadInvoicePdf(blob, data.invoiceNumber);

  const phone = normalizeWaPhone(options?.phone || data.customer.phone);
  const prefix = options?.messagePrefix ??
    `📄 *INVOICE — SHAHED STORE*\n\nপ্রিয় ${data.customer.name},\nআপনার অর্ডার #${data.invoiceNumber} এর সম্পূর্ণ ইনভয়েস (PDF) নিচের লিংকে দেখুন/ডাউনলোড করুন:`;

  const text = `${prefix}\n\n📎 ${url}\n\n💰 মোট: ৳${Number(data.total).toLocaleString()}\n\n✅ ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য!\n🌐 shahedstore.com.bd`;
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  window.open(waUrl, '_blank');
  return { url, waUrl };
}

/**
 * Trigger a local download of the PDF (fallback / preview).
 */
export async function downloadInvoicePdf(data: InvoiceData) {
  const blob = await buildInvoicePdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${data.invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
