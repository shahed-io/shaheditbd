// Shared Notice template — matches the invoice frame design (logo on left,
// brand-coloured header border, info cards, signature block with image).
import ReactMarkdown from 'react-markdown';
import { Calendar, Hash, Megaphone, User, FileText } from 'lucide-react';
import logoIcon from '@/assets/logo.png';

export interface NoticeData {
  title: string;
  summary?: string | null;
  body: string;
  reference_no?: string | null;
  signed_by?: string | null;
  signed_role?: string | null;
  effective_date?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  audience?: string | null;
}

export interface NoticeBrand {
  name?: string;
  tagline?: string;
  website?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  brandColor?: string;   // hex
  brandLight?: string;   // hex tint
  accentText?: string;
}

interface Props {
  notice: NoticeData;
  brand?: NoticeBrand;
  /** Default signature image (data URL or http URL). Used when notice has no override. */
  signatureUrl?: string;
  className?: string;
}

const formatDate = (s?: string | null) => {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
};

export default function NoticeTemplate({ notice, brand = {}, signatureUrl, className = '' }: Props) {
  const brandName = brand.name || 'Shahed Store';
  const brandColor = brand.brandColor || '#7c3aed';
  const brandLight = brand.brandLight || '#f3f0ff';
  const accentText = brand.accentText || '#1a1a2e';
  const logo = brand.logoUrl || logoIcon;
  const date = notice.effective_date || notice.published_at || notice.created_at;

  return (
    <div
      className={`bg-white max-w-3xl mx-auto shadow-xl ${className}`}
      style={{
        color: accentText,
        fontFamily: "'Segoe UI', 'Noto Sans Bengali', Arial, sans-serif",
        padding: '40px',
        borderRadius: 12,
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header — same as invoice (logo left, NOTICE right, brand bottom border) ── */}
      <div
        className="flex items-center justify-between"
        style={{ paddingBottom: 20, marginBottom: 28, borderBottom: `3px solid ${brandColor}` }}
      >
        <div className="flex items-center" style={{ gap: 14 }}>
          <img src={logo} alt={brandName} crossOrigin="anonymous"
               style={{ height: 54, width: 'auto', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: accentText, lineHeight: 1.1 }}>{brandName}</div>
            {brand.tagline && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{brand.tagline}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: brandColor, letterSpacing: 2, lineHeight: 1 }}>
            NOTICE
          </div>
          {notice.reference_no && (
            <div style={{ fontSize: 13, color: '#666', marginTop: 6, fontFamily: 'monospace' }}>
              #{notice.reference_no}
            </div>
          )}
          {date && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{formatDate(date)}</div>}
        </div>
      </div>

      {/* ── Meta cards (mirrors invoice billing/payment cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16, marginBottom: 24 }}>
        <div style={{ background: brandLight, borderRadius: 10, padding: 16, borderLeft: `4px solid ${brandColor}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: 1.5, marginBottom: 8 }}>
            📢 Notice Subject
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: accentText, lineHeight: 1.4 }}>{notice.title}</div>
          {notice.summary && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 6, lineHeight: 1.5 }}>{notice.summary}</div>
          )}
        </div>
        <div style={{ background: brandLight, borderRadius: 10, padding: 16, borderLeft: `4px solid ${brandColor}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: 1.5, marginBottom: 8 }}>
            📋 Details
          </div>
          {date && (
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.9 }}>
              <Calendar className="inline w-3 h-3 mr-1" /> Effective: <strong style={{ color: accentText }}>{formatDate(date)}</strong>
            </div>
          )}
          {notice.audience && (
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.9 }}>
              <User className="inline w-3 h-3 mr-1" /> Audience:{' '}
              <span style={{ background: brandColor, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                {notice.audience}
              </span>
            </div>
          )}
          {notice.reference_no && (
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.9 }}>
              <Hash className="inline w-3 h-3 mr-1" /> Ref:{' '}
              <span style={{ fontFamily: 'monospace', background: '#e8e5f7', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                {notice.reference_no}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body card ── */}
      <div style={{
        border: '1px solid #eee', borderRadius: 10, padding: '22px 26px', marginBottom: 24, background: '#fff',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: 1.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText className="w-3.5 h-3.5" /> Notice Body
        </div>
        <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
          <ReactMarkdown>{notice.body || '*কোনো বিস্তারিত নেই*'}</ReactMarkdown>
        </div>
      </div>

      {/* ── Signature block ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', minWidth: 240 }}>
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Signature"
              crossOrigin="anonymous"
              style={{
                maxHeight: 70, maxWidth: 240, objectFit: 'contain',
                margin: '0 auto', display: 'block', mixBlendMode: 'multiply',
              }}
            />
          ) : (
            <div style={{ height: 50 }} />
          )}
          <div style={{ borderTop: '2px solid #333', paddingTop: 6, marginTop: 4 }}>
            <div style={{ fontWeight: 700, color: accentText, fontSize: 14 }}>
              {notice.signed_by || 'Shahed Store Authority'}
            </div>
            {notice.signed_role && (
              <div style={{ fontSize: 11, color: '#666' }}>{notice.signed_role}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer (same vibe as invoice) ── */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 6px 0' }}>
          <Megaphone className="inline w-3.5 h-3.5 mr-1" />
          This is an official notice from {brandName}.
        </p>
        <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
          {brand.website && <>🌐 {brand.website}</>}
          {brand.email && <>  •  ✉️ {brand.email}</>}
          {brand.phone && <>  •  📞 {brand.phone}</>}
        </p>
        <p style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>
          For queries, please contact our support team.
        </p>
      </div>
    </div>
  );
}
