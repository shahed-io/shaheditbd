// Shared Notice template — invoice-like printable design.
// Used in admin preview, public notice page, customer dashboard.
import ReactMarkdown from 'react-markdown';
import { Calendar, Hash, Megaphone, User } from 'lucide-react';

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

interface Props {
  notice: NoticeData;
  brand?: { name?: string; tagline?: string; logoUrl?: string };
  className?: string;
}

const formatDate = (s?: string | null) => {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
};

export default function NoticeTemplate({ notice, brand, className = '' }: Props) {
  const brandName = brand?.name || 'Shahed Store';
  const date = notice.effective_date || notice.published_at || notice.created_at;

  return (
    <div className={`bg-white text-gray-900 max-w-3xl mx-auto shadow-xl border border-gray-200 ${className}`}
         style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header bar — same style as invoice */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {brand?.logoUrl && (
              <img src={brand.logoUrl} alt={brandName} className="w-12 h-12 object-contain bg-white rounded-lg p-1" />
            )}
            <div>
              <div className="text-xl font-bold tracking-tight">{brandName}</div>
              {brand?.tagline && <div className="text-xs opacity-90">{brand.tagline}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              <Megaphone className="w-3.5 h-3.5" /> Notice
            </div>
            {notice.reference_no && (
              <div className="mt-2 text-xs opacity-90 flex items-center justify-end gap-1">
                <Hash className="w-3 h-3" /> {notice.reference_no}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title block */}
      <div className="px-8 py-6 border-b border-dashed border-gray-300">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{notice.title}</h1>
        {notice.summary && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{notice.summary}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
          {date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(date)}
            </span>
          )}
          {notice.audience && (
            <span className="inline-flex items-center gap-1.5 capitalize">
              <User className="w-3.5 h-3.5" /> Audience: {notice.audience}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-7 prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
        <ReactMarkdown>{notice.body || '*কোনো বিস্তারিত নেই*'}</ReactMarkdown>
      </div>

      {/* Signature footer */}
      <div className="px-8 pt-2 pb-8">
        <div className="flex justify-end">
          <div className="text-right">
            <div className="inline-block border-t-2 border-gray-700 pt-2 min-w-[200px]">
              <div className="font-semibold text-gray-900">{notice.signed_by || 'Shahed Store Authority'}</div>
              {notice.signed_role && <div className="text-xs text-gray-600">{notice.signed_role}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="bg-gray-50 border-t border-gray-200 px-8 py-3 text-center text-[10px] text-gray-500 tracking-wide">
        This is an official notice from {brandName}. For queries, contact our support.
      </div>
    </div>
  );
}
