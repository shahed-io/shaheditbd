/**
 * Email Invoice Helper
 *
 * Workflow:
 *  1. Generate PDF from invoice data (or live DOM element)
 *  2. Upload PDF to `invoices` storage bucket → public URL
 *  3. Invoke `send-transactional-email` with `invoice-delivery` template
 *     including the PDF URL and full invoice details
 *
 * The email contains:
 *  - HTML invoice (rendered inline in body)
 *  - "PDF Download" button linking to uploaded PDF
 *
 * This effectively delivers both — beautiful HTML inbox preview + PDF
 * download link working as an attachment.
 */
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { InvoiceData } from './invoicePdf';

const PM_LABELS: Record<string, string> = {
  bkash: 'BKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'উপায়',
  bank: 'Bank Transfer', cash: 'Cash', wallet: 'Wallet', free: 'Free', other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', delivered: 'Delivered',
  completed: 'Paid', cancelled: 'Cancelled', refunded: 'Refunded', failed: 'Failed', paid: 'Paid',
};

function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function buildPdfBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const availW = pageW - margin * 2;
  const ratio = canvas.height / canvas.width;
  let imgW = availW;
  let imgH = imgW * ratio;
  if (imgH > pageH - margin * 2) {
    imgH = pageH - margin * 2;
    imgW = imgH / ratio;
  }
  const x = (pageW - imgW) / 2;
  pdf.addImage(imgData, 'PNG', x, margin, imgW, imgH, undefined, 'FAST');
  return pdf.output('blob');
}

async function uploadPdf(blob: Blob, invoiceNumber: string): Promise<string> {
  const safeName = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  const path = `invoices/${safeName}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from('invoices').upload(path, blob, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('invoices').getPublicUrl(path);
  return data.publicUrl;
}

export interface SendInvoiceEmailOptions {
  data: InvoiceData;
  recipientEmail: string;
  /** Optional live DOM element to snapshot (preview modal). If absent, builds an off-screen template. */
  element?: HTMLElement | null;
}

/**
 * Generate PDF, upload to storage, then send email with HTML body + PDF link.
 */
export async function sendInvoiceEmail({ data, recipientEmail, element }: SendInvoiceEmailOptions): Promise<void> {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    throw new Error('Invalid recipient email');
  }

  // 1. Build PDF blob
  let pdfBlob: Blob;
  if (element) {
    pdfBlob = await buildPdfBlob(element);
  } else {
    // Build off-screen using same template as invoicePdf
    const { default: html2canvasMod } = await import('html2canvas');
    void html2canvasMod;
    const { downloadInvoicePdf } = await import('./invoicePdf');
    void downloadInvoicePdf;
    // Create off-screen element ourselves
    const tempEl = await buildOffscreenInvoice(data);
    document.body.appendChild(tempEl);
    try {
      await new Promise(r => setTimeout(r, 80));
      pdfBlob = await buildPdfBlob(tempEl);
    } finally {
      document.body.removeChild(tempEl);
    }
  }

  // 2. Upload PDF
  const pdfUrl = await uploadPdf(pdfBlob, data.invoiceNumber);

  // 3. Send email
  const subtotal = data.subtotal ?? data.items.reduce((s, i) => s + i.quantity * i.price, 0);

  const { error } = await supabase.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'invoice-delivery',
      recipientEmail,
      idempotencyKey: `invoice-${data.invoiceNumber}-${Date.now()}`,
      templateData: {
        customerName: data.customer.name,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: fmtDate(data.date),
        items: data.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.total ?? i.quantity * i.price,
          license_key: i.license_key || null,
        })),
        subtotal,
        discount: data.discount || 0,
        total: data.total,
        paymentMethod: data.paymentMethod ? (PM_LABELS[data.paymentMethod] || data.paymentMethod) : 'N/A',
        transactionId: data.transactionId || '',
        status: data.status ? (STATUS_LABELS[data.status] || data.status) : '',
        notes: data.notes || '',
        pdfUrl,
      },
    },
  });

  if (error) throw error;
}

// Off-screen invoice builder (mirrors invoicePdf.ts buildInvoiceHtml)
async function buildOffscreenInvoice(data: InvoiceData): Promise<HTMLElement> {
  const logoIcon = (await import('@/assets/logo.png')).default;
  const cachedLogo = await loadLogoBase64(logoIcon);
  const brandColor = '#7c3aed';
  const brandLight = '#f3f0ff';
  const sub = data.subtotal ?? data.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const disc = data.discount || 0;
  const fmt = (n: number) => '৳' + Number(n || 0).toLocaleString('en-US');
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:fixed;left:-10000px;top:0;width:760px;background:#ffffff;color:#1a1a2e;padding:40px;border-radius:12px;font-family:'Segoe UI','Noto Sans Bengali',Arial,sans-serif;box-sizing:border-box;`;

  const itemsHtml = data.items.map((item, idx) => {
    const total = item.total ?? item.quantity * item.price;
    const keyRow = item.license_key
      ? `<div style="font-size:11px;color:#7c3aed;font-family:monospace;margin-top:4px;background:#f3f0ff;padding:3px 8px;border-radius:4px;display:inline-block">Key: ${esc(item.license_key)}</div>`
      : '';
    return `<tr style="border-bottom:1px solid #eee;background:${idx % 2 === 0 ? '#fff' : '#faf9ff'}">
      <td style="padding:14px;font-size:13px;color:#666;text-align:center">${idx + 1}</td>
      <td style="padding:14px;font-size:13px;color:#1a1a2e;font-weight:600">${esc(item.name)}${keyRow}</td>
      <td style="padding:14px;font-size:13px;color:#555;text-align:center">×${item.quantity}</td>
      <td style="padding:14px;font-size:13px;color:#555;text-align:right">${fmt(item.price)}</td>
      <td style="padding:14px;font-size:14px;color:#1a1a2e;text-align:right;font-weight:700">${fmt(total)}</td>
    </tr>`;
  }).join('');

  const statusLabel = data.status ? (STATUS_LABELS[data.status] || data.status) : '';
  const pmLabel = data.paymentMethod ? (PM_LABELS[data.paymentMethod] || data.paymentMethod) : 'N/A';

  wrapper.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid ${brandColor}">
      <div>${cachedLogo ? `<img src="${cachedLogo}" alt="" style="height:54px;width:auto"/>` : ''}</div>
      <div style="text-align:right">
        <div style="font-size:32px;font-weight:800;color:${brandColor};letter-spacing:2px;line-height:1">INVOICE</div>
        <div style="font-size:13px;color:#666;margin-top:6px;font-family:monospace">#${esc(data.invoiceNumber)}</div>
        <div style="font-size:12px;color:#888;margin-top:2px">${fmtDate(data.date)}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px">
      <div style="background:${brandLight};border-radius:10px;padding:16px;border-left:4px solid ${brandColor}">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${brandColor};letter-spacing:1.5px;margin-bottom:10px">📋 বিলিং তথ্য</div>
        <p style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 6px 0">${esc(data.customer.name || '-')}</p>
        ${data.customer.email ? `<p style="font-size:12px;color:#555;margin:3px 0">✉️ ${esc(data.customer.email)}</p>` : ''}
        ${data.customer.phone ? `<p style="font-size:12px;color:#555;margin:3px 0">📱 ${esc(data.customer.phone)}</p>` : ''}
      </div>
      <div style="background:${brandLight};border-radius:10px;padding:16px;border-left:4px solid ${brandColor}">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${brandColor};letter-spacing:1.5px;margin-bottom:12px">💳 Payment Info</div>
        <div style="font-size:12px;color:#555;line-height:1.9"><span style="display:inline-block;min-width:62px">Method:</span> <strong style="color:#1a1a2e">${esc(pmLabel)}</strong></div>
        ${data.transactionId ? `<div style="font-size:12px;color:#555;line-height:1.9;margin-top:6px"><span style="display:inline-block;min-width:62px">TrxID:</span> <span style="color:#1a1a2e;font-family:monospace;background:#e8e5f7;padding:2px 8px;border-radius:4px;font-size:11px;display:inline-block;line-height:1.4">${esc(data.transactionId)}</span></div>` : ''}
        ${statusLabel ? `<div style="font-size:12px;color:#555;line-height:1.9;margin-top:6px"><span style="display:inline-block;min-width:62px">Status:</span> <span style="background:${brandColor};color:#fff;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;display:inline-block;line-height:1.4">${esc(statusLabel)}</span></div>` : ''}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:8px;overflow:hidden">
      <thead><tr style="background:${brandColor}">
        <th style="color:#ffffff;font-size:13px;font-weight:800;padding:14px;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,0.45)">#</th>
        <th style="color:#ffffff;font-size:13px;font-weight:800;padding:14px;text-align:left;text-shadow:0 1px 2px rgba(0,0,0,0.45)">পণ্যের নাম</th>
        <th style="color:#ffffff;font-size:13px;font-weight:800;padding:14px;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,0.45)">পরিমাণ</th>
        <th style="color:#ffffff;font-size:13px;font-weight:800;padding:14px;text-align:right;text-shadow:0 1px 2px rgba(0,0,0,0.45)">দাম</th>
        <th style="color:#ffffff;font-size:13px;font-weight:800;padding:14px;text-align:right;text-shadow:0 1px 2px rgba(0,0,0,0.45)">মোট</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <div style="min-width:280px;background:${brandLight};border-radius:10px;padding:18px">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#555;margin-bottom:8px"><span>Subtotal:</span><span>${fmt(sub)}</span></div>
        ${disc > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#059669;margin-bottom:8px"><span>Discount:</span><span>-${fmt(disc)}</span></div>` : ''}
        <div style="height:1px;background:${brandColor};opacity:0.3;margin:10px 0"></div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:${brandColor}"><span>Total:</span><span>${fmt(data.total)}</span></div>
      </div>
    </div>
    ${data.notes ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:14px;margin-bottom:20px"><div style="font-size:11px;font-weight:700;color:#b45309;margin-bottom:4px">📝 নোট:</div><div style="font-size:13px;color:#78350f">${esc(data.notes)}</div></div>` : ''}
    <div style="border-top:1px solid #eee;padding-top:16px;text-align:center">
      <p style="font-size:13px;color:#666;margin:0 0 6px 0">ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য!</p>
      <p style="font-size:11px;color:#888;margin:0">🌐 shahedstore.com.bd  •  ✉️ info@shahedstore.com.bd</p>
    </div>`;
  return wrapper;
}

async function loadLogoBase64(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
