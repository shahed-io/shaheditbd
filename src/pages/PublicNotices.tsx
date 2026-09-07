// Public notice list + detail
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NoticeTemplate, { NoticeData } from '@/components/notices/NoticeTemplate';
import SEOHead from '@/components/seo/SEOHead';
import { Megaphone, ArrowLeft, Calendar, Download, Share2, Loader2 } from 'lucide-react';
import { loadNoticeSignature, type NoticeSignature, DEFAULT_NOTICE_SIGNATURE } from '@/lib/noticeSignature';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface NoticeRow extends NoticeData {
  id: string;
  slug: string;
  status: string;
  pinned: boolean;
}

export default function PublicNotices() {
  const { slug } = useParams<{ slug?: string }>();
  const [list, setList] = useState<NoticeRow[]>([]);
  const [one, setOne] = useState<NoticeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<NoticeSignature>(DEFAULT_NOTICE_SIGNATURE);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadNoticeSignature().then(setSignature); }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      if (slug) {
        const { data } = await supabase.from('notices').select('*').eq('slug', slug).maybeSingle();
        if (!canceled) setOne(data as NoticeRow | null);
      } else {
        const { data } = await supabase
          .from('notices').select('*')
          .eq('status', 'published')
          .order('pinned', { ascending: false })
          .order('published_at', { ascending: false });
        if (!canceled) setList((data as NoticeRow[]) || []);
      }
      if (!canceled) setLoading(false);
    })();
    return () => { canceled = true; };
  }, [slug]);

  if (slug) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 sm:py-10 px-2 sm:px-4">
        <SEOHead title={one?.title || 'Notice'} description={one?.summary || undefined} />
        <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between gap-2 px-1">
          <Link to="/notices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> All Notices
          </Link>
          {one && <NoticeActions targetRef={noticeRef} notice={one} />}
        </div>
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : !one ? (
          <div className="text-center py-20 text-muted-foreground">Notice পাওয়া যায়নি।</div>
        ) : (
          <div ref={noticeRef}>
            <NoticeTemplate notice={one} brand={{ name: 'Shahed IT' }} signatureUrl={signature.imageDataUrl || undefined} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <SEOHead title="Notices" description="Latest notices and announcements from Shahed IT." />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" /> Notice Board
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-3">সকল নোটিশ</h1>
          <p className="text-muted-foreground mt-2">আমাদের সাম্প্রতিক ঘোষণা ও তথ্য</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">এখনও কোনো নোটিশ প্রকাশিত হয়নি।</div>
        ) : (
          <div className="space-y-3">
            {list.map((n) => (
              <Link key={n.id} to={`/notices/${n.slug}`}
                    className="block bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {n.pinned && <span className="text-xs">📌</span>}
                      {n.reference_no && <span className="text-[10px] font-mono text-muted-foreground">{n.reference_no}</span>}
                    </div>
                    <h2 className="font-semibold text-lg leading-tight">{n.title}</h2>
                    {n.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>}
                  </div>
                  {(n.effective_date || n.published_at) && (
                    <span className="shrink-0 text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(n.effective_date || n.published_at || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoticeActions({ targetRef, notice }: { targetRef: React.RefObject<HTMLDivElement>; notice: { title: string; slug: string } }) {
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);

  const capture = async (): Promise<Blob | null> => {
    const node = targetRef.current;
    if (!node) return null;
    // Render at a fixed comfortable width so the exported image is consistent on all devices
    const originalWidth = node.style.width;
    const originalMaxWidth = node.style.maxWidth;
    const isSmall = window.innerWidth < 768;
    if (isSmall) {
      node.style.width = '760px';
      node.style.maxWidth = 'none';
    }
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 2),
        useCORS: true,
        logging: false,
        windowWidth: isSmall ? 800 : undefined,
      });
      return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95));
    } finally {
      node.style.width = originalWidth;
      node.style.maxWidth = originalMaxWidth;
    }
  };

  const filename = () => {
    const slug = (notice.slug || 'notice').replace(/[^a-z0-9-_]/gi, '-').slice(0, 60);
    return `shahed-store-notice-${slug}.png`;
  };

  const handleSave = async () => {
    setBusy('save');
    try {
      const blob = await capture();
      if (!blob) throw new Error('capture failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success('গ্যালারিতে সেভ হয়েছে (Downloads ফোল্ডার দেখুন)');
    } catch (e) {
      toast.error('সেভ করতে সমস্যা হয়েছে');
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      const blob = await capture();
      if (!blob) throw new Error('capture failed');
      const file = new File([blob], filename(), { type: 'image/png' });
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: notice.title, text: notice.title });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename();
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast.success('ইমেজ ডাউনলোড হয়েছে — শেয়ার করে দিন');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('শেয়ার করতে সমস্যা হয়েছে');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        disabled={!!busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/80 backdrop-blur px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-60"
      >
        {busy === 'share' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
        <span>শেয়ার</span>
      </button>
      <button
        onClick={handleSave}
        disabled={!!busy}
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/40 disabled:opacity-60"
      >
        {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        <span>গ্যালারিতে সেভ</span>
      </button>
    </div>
  );
}
