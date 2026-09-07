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
  const brandName = brand.name || 'Shahed IT';
  const brandColor = brand.brandColor || '#0891b2';
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
        padding: 'clamp(16px, 4.5vw, 40px)',
        borderRadius: 12,
        boxSizing: 'border-box',
        overflowWrap: 'anywhere',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between"
        style={{
          paddingBottom: 'clamp(12px, 2.5vw, 20px)',
          marginBottom: 'clamp(16px, 3.5vw, 28px)',
          borderBottom: `3px solid ${brandColor}`,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
          <img src={logo} alt={brandName} crossOrigin="anonymous"
               style={{ height: 'clamp(38px, 9vw, 54px)', width: 'auto', objectFit: 'contain' }} />
          {brand.tagline && (
            <div style={{ fontSize: 11, color: '#666' }}>{brand.tagline}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(22px, 6.5vw, 32px)', fontWeight: 800, color: brandColor, letterSpacing: 2, lineHeight: 1 }}>
            NOTICE
          </div>
          {notice.reference_no && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 6, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              #{notice.reference_no}
            </div>
          )}
          {date && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{formatDate(date)}</div>}
        </div>
      </div>

      {/* ── Meta cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 'clamp(16px, 3vw, 24px)' }}>
        <div style={{ background: brandLight, borderRadius: 10, padding: 'clamp(12px, 3vw, 16px)', borderLeft: `4px solid ${brandColor}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: 1.5, marginBottom: 8 }}>
            📢 Notice Subject
          </div>
          <div style={{ fontSize: 'clamp(13px, 3.6vw, 15px)', fontWeight: 700, color: accentText, lineHeight: 1.4 }}>{notice.title}</div>
          {notice.summary && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 6, lineHeight: 1.5 }}>{notice.summary}</div>
          )}
        </div>
        <div style={{ background: brandLight, borderRadius: 10, padding: 'clamp(12px, 3vw, 16px)', borderLeft: `4px solid ${brandColor}` }}>
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
              <span style={{ fontFamily: 'monospace', background: '#e8e5f7', padding: '2px 8px', borderRadius: 4, fontSize: 11, wordBreak: 'break-all' }}>
                {notice.reference_no}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body card ── */}
      <div style={{
        border: '1px solid #eee', borderRadius: 10,
        padding: 'clamp(14px, 3.5vw, 26px)',
        marginBottom: 'clamp(16px, 3vw, 24px)', background: '#fff',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: 1.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText className="w-3.5 h-3.5" /> Notice Body
        </div>
        <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 break-words">
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
              {notice.signed_by || 'Shahed IT Authority'}
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
