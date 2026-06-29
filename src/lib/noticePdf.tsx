// Download a notice as a PDF by rendering NoticeTemplate off-screen and
// snapshotting it with the same html2canvas + jsPDF pipeline as invoices.
import { createRoot } from 'react-dom/client';
import NoticeTemplate, { type NoticeData, type NoticeBrand } from '@/components/notices/NoticeTemplate';
import { downloadInvoicePdfFromElement } from './invoicePdf';

export interface DownloadNoticeOptions {
  brand?: NoticeBrand;
  signatureUrl?: string;
  filename?: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'notice';

export async function downloadNoticePdf(
  notice: NoticeData & { slug?: string; reference_no?: string | null },
  opts: DownloadNoticeOptions = {}
): Promise<void> {
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed; left:-10000px; top:0; width:760px; background:#ffffff; pointer-events:none; z-index:-1;';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    <NoticeTemplate
      notice={notice}
      brand={opts.brand}
      signatureUrl={opts.signatureUrl}
    />
  );

  try {
    // Let React commit + initial layout.
    await new Promise((r) => setTimeout(r, 120));

    // Wait for all images (logo, signature) to settle.
    const imgs = Array.from(host.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise((res) => {
              img.addEventListener('load', () => res(null), { once: true });
              img.addEventListener('error', () => res(null), { once: true });
            })
      )
    );
    // One more tick for fonts.
    await new Promise((r) => setTimeout(r, 80));

    const target = host.firstElementChild as HTMLElement | null;
    if (!target) throw new Error('Notice render failed');

    const baseName = notice.reference_no || notice.slug || slugify(notice.title);
    const filename = opts.filename || `notice-${baseName}.pdf`;
    await downloadInvoicePdfFromElement(target, filename);
  } finally {
    try { root.unmount(); } catch {}
    if (host.parentNode) host.parentNode.removeChild(host);
  }
}
