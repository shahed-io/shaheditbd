/**
 * Unified PDF Invoice Generator (HTML → Canvas → PDF)
 *
 * Strategy: render the same beautiful HTML invoice the user sees in the
 * preview modal, then snapshot it with html2canvas and embed into a single
 * jsPDF page. This preserves:
 *  - Bengali fonts and emojis exactly as displayed
 *  - Logo, gradients, rounded cards, brand colors
 *  - Pixel-perfect parity between on-screen preview and downloaded PDF
 *
 * Two ways to use:
 *  1. `downloadInvoicePdfFromElement(el, filename)` — preferred when the
 *     preview modal is already mounted (matches what the user sees 1:1).
 *  2. `downloadInvoicePdf(data)` — standalone, builds an off-screen DOM
 *     using the same template and exports it. Used when there's no live
 *     preview (e.g. License manager, Personal license cards).
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

const PM_LABELS: Record<string, string> = {
  bkash: 'BKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  upay: 'উপায়',
  bank: 'Bank Transfer',
  cash: 'Cash',
  bkash_merchant: 'BKash Merchant',
  other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'পেন্ডিং',
  processing: 'প্রসেসিং',
  delivered: 'ডেলিভার্ড',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল',
  refunded: 'রিফান্ড',
  failed: 'ব্যর্থ',
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
  return '৳' + Number(n || 0).toLocaleString('en-US');
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
 * Build the canonical invoice HTML — identical look to the preview modal.
 */
async function buildInvoiceHtml(data: InvoiceData): Promise<HTMLElement> {
  const logo = (await loadLogoBase64()) || '';
  const { loadInvoiceDesign, resolveHeaderTheme, resolveTotalColor } = await import('./invoiceSettings');
  const design = await loadInvoiceDesign();
  const brandColor = design.brandColor;
  const brandLight = design.brandLight;
  const hdr = resolveHeaderTheme(design);
  const totalColor = resolveTotalColor(design);

  const sub = data.subtotal ?? data.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const disc = data.discount || 0;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; left: -10000px; top: 0;
    width: 760px; background: #ffffff; color: ${design.accentText};
    padding: 40px; border-radius: ${design.borderRadius}px;
    font-family: 'Segoe UI', 'Noto Sans Bengali', Arial, sans-serif;
    box-sizing: border-box;
  `;

  const itemsHtml = data.items.map((item, idx) => {
    const total = item.total ?? item.quantity * item.price;
    const keyRow = item.license_key
      ? `<div style="font-size:11px;color:${brandColor};font-family:monospace;margin-top:4px;background:${brandLight};padding:3px 8px;border-radius:4px;display:inline-block">Key: ${item.license_key}</div>`
      : '';
    return `
      <tr style="border-bottom:1px solid #eee;background:${idx % 2 === 0 ? '#fff' : '#faf9ff'}">
        <td style="padding:14px;font-size:13px;color:#666;text-align:center">${idx + 1}</td>
        <td style="padding:14px;font-size:13px;color:${design.accentText};font-weight:600">
          ${escapeHtml(item.name)}
          ${keyRow}
        </td>
        <td style="padding:14px;font-size:13px;color:#555;text-align:center">×${item.quantity}</td>
        <td style="padding:14px;font-size:13px;color:#555;text-align:right">${fmtMoney(item.price)}</td>
        <td style="padding:14px;font-size:14px;color:${design.accentText};text-align:right;font-weight:700">${fmtMoney(total)}</td>
      </tr>`;
  }).join('');

  const statusLabel = data.status ? (STATUS_LABELS[data.status] || data.status) : '';
  const pmLabel = data.paymentMethod ? (PM_LABELS[data.paymentMethod] || data.paymentMethod) : 'N/A';
  const showLogo = design.showLogo && logo;

  wrapper.innerHTML = `
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid ${brandColor}">
      <div style="display:flex;align-items:center;gap:14px">
        ${showLogo ? `<img src="${logo}" alt="${escapeHtml(design.companyName)}" style="height:54px;width:auto;object-fit:contain" crossorigin="anonymous" />` : `<div style="font-size:18px;font-weight:800;color:${design.accentText}">${escapeHtml(design.companyName)}</div>`}
      </div>
      <div style="text-align:right">
        <div style="font-size:32px;font-weight:800;color:${brandColor};letter-spacing:2px;line-height:1">${escapeHtml(design.invoiceTitle)}</div>
        <div style="font-size:13px;color:#666;margin-top:6px;font-family:monospace">#${escapeHtml(data.invoiceNumber)}</div>
        <div style="font-size:12px;color:#888;margin-top:2px">${fmtDate(data.date)}</div>
      </div>
    </div>

    <!-- Customer + Payment -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px">
      <div style="background:${brandLight};border-radius:10px;padding:16px;border-left:4px solid ${brandColor}">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${brandColor};letter-spacing:1.5px;margin-bottom:10px">📋 ${escapeHtml(design.labelBilling)}</div>
        <p style="font-size:15px;font-weight:700;color:${design.accentText};margin:0 0 6px 0">${escapeHtml(data.customer.name || '-')}</p>
        ${data.customer.email ? `<p style="font-size:12px;color:#555;margin:3px 0">✉️ ${escapeHtml(data.customer.email)}</p>` : ''}
        ${data.customer.phone ? `<p style="font-size:12px;color:#555;margin:3px 0">📱 ${escapeHtml(data.customer.phone)}</p>` : ''}
        ${data.customer.address ? `<p style="font-size:12px;color:#555;margin:3px 0">🏠 ${escapeHtml(data.customer.address)}</p>` : ''}
      </div>
      <div style="background:${brandLight};border-radius:10px;padding:16px;border-left:4px solid ${brandColor}">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${brandColor};letter-spacing:1.5px;margin-bottom:12px">💳 ${escapeHtml(design.labelPayment)}</div>
        <div style="font-size:12px;color:#555;line-height:1.9"><span style="display:inline-block;min-width:62px">Method:</span> <strong style="color:${design.accentText}">${escapeHtml(pmLabel)}</strong></div>
        ${data.transactionId ? `<div style="font-size:12px;color:#555;line-height:1.9;margin-top:6px"><span style="display:inline-block;min-width:62px">TrxID:</span> <span style="color:${design.accentText};font-family:monospace;background:#e8e5f7;padding:2px 8px;border-radius:4px;font-size:11px;display:inline-block;line-height:1.4">${escapeHtml(data.transactionId)}</span></div>` : ''}
        ${statusLabel ? `<div style="font-size:12px;color:#555;line-height:1.9;margin-top:6px"><span style="display:inline-block;min-width:62px">Status:</span> <span style="background:${brandColor};color:#fff;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;display:inline-block;line-height:1.4">${escapeHtml(statusLabel)}</span></div>` : ''}
      </div>
    </div>

    <!-- Items table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:${hdr.bg}">
          <th style="background:${hdr.bg};color:${hdr.text};font-size:14px;font-weight:700;padding:14px;text-align:center">#</th>
          <th style="background:${hdr.bg};color:${hdr.text};font-size:14px;font-weight:700;padding:14px;text-align:left">${escapeHtml(design.labelItem)}</th>
          <th style="background:${hdr.bg};color:${hdr.text};font-size:14px;font-weight:700;padding:14px;text-align:center">${escapeHtml(design.labelQty)}</th>
          <th style="background:${hdr.bg};color:${hdr.text};font-size:14px;font-weight:700;padding:14px;text-align:right">${escapeHtml(design.labelPrice)}</th>
          <th style="background:${hdr.bg};color:${hdr.text};font-size:14px;font-weight:700;padding:14px;text-align:right">${escapeHtml(design.labelTotal)}</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <div style="min-width:280px;background:${brandLight};border-radius:10px;padding:18px">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#555;margin-bottom:8px">
          <span>${escapeHtml(design.labelSubtotal)}:</span><span>${fmtMoney(sub)}</span>
        </div>
        ${disc > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#059669;margin-bottom:8px"><span>${escapeHtml(design.labelDiscount)}:</span><span>-${fmtMoney(disc)}</span></div>` : ''}
        <div style="height:1px;background:${brandColor};opacity:0.3;margin:10px 0"></div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:${totalColor}">
          <span>${escapeHtml(design.labelGrandTotal)}:</span><span>${fmtMoney(data.total)}</span>
        </div>
      </div>
    </div>

    ${data.notes ? `
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:14px;margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#b45309;margin-bottom:4px">📝 গ্রাহকের নোট:</div>
      <div style="font-size:13px;color:#78350f">${escapeHtml(data.notes)}</div>
    </div>` : ''}

    <!-- Footer -->
    <div style="border-top:1px solid #eee;padding-top:16px;text-align:center">
      <p style="font-size:13px;color:#666;margin:0 0 6px 0">${escapeHtml(design.thankYouText)}</p>
      <p style="font-size:11px;color:#888;margin:0">
        ${design.companyWebsite ? `🌐 ${escapeHtml(design.companyWebsite)}` : ''}
        ${design.companyEmail ? `  •  ✉️ ${escapeHtml(design.companyEmail)}` : ''}
        ${design.companyPhone ? `  •  📞 ${escapeHtml(design.companyPhone)}` : ''}
      </p>
      <p style="font-size:10px;color:#aaa;margin-top:6px">${escapeHtml(design.footerNote)}</p>
    </div>
  `;

  return wrapper;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Snapshot any DOM element into a single-page A4 PDF.
 *
 * Renders into a fixed-width off-screen clone (760px) so the downloaded PDF
 * is identical regardless of the preview modal's current viewport width.
 */
export async function downloadInvoicePdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const FIXED_WIDTH = 760;

  // Clone into an off-screen sandbox so layout is independent of modal size.
  const sandbox = document.createElement('div');
  sandbox.style.cssText = `
    position: fixed; left: -10000px; top: 0;
    width: ${FIXED_WIDTH}px; background: #ffffff;
    pointer-events: none; z-index: -1;
  `;
  const clone = element.cloneNode(true) as HTMLElement;
  // Force consistent layout dimensions on the clone.
  clone.style.width = `${FIXED_WIDTH}px`;
  clone.style.maxWidth = `${FIXED_WIDTH}px`;
  clone.style.minWidth = `${FIXED_WIDTH}px`;
  clone.style.margin = '0';
  clone.style.transform = 'none';
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    // Let images / fonts settle.
    await new Promise((r) => setTimeout(r, 80));

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: FIXED_WIDTH,
      windowWidth: FIXED_WIDTH,
    });
    const imgData = canvas.toDataURL('image/png');

    // A4 portrait at 72 DPI = 595 × 842 pt
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
    const y = margin;
    pdf.addImage(imgData, 'PNG', x, y, imgW, imgH, undefined, 'FAST');
    pdf.save(filename);
  } finally {
    document.body.removeChild(sandbox);
  }
}

/**
 * Standalone download: builds the HTML off-screen then snapshots to PDF.
 */
export async function downloadInvoicePdf(data: InvoiceData): Promise<void> {
  const el = await buildInvoiceHtml(data);
  document.body.appendChild(el);
  try {
    // Allow images/fonts a tick to settle
    await new Promise((r) => setTimeout(r, 80));
    await downloadInvoicePdfFromElement(el, `invoice-${data.invoiceNumber}.pdf`);
  } finally {
    document.body.removeChild(el);
  }
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
