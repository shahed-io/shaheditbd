// Public notice list + detail
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NoticeTemplate, { NoticeData } from '@/components/notices/NoticeTemplate';
import SEOHead from '@/components/seo/SEOHead';
import { Megaphone, ArrowLeft, Calendar } from 'lucide-react';
import { loadNoticeSignature, type NoticeSignature, DEFAULT_NOTICE_SIGNATURE } from '@/lib/noticeSignature';

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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
        <SEOHead title={one?.title || 'Notice'} description={one?.summary || undefined} />
        <div className="max-w-3xl mx-auto mb-4">
          <Link to="/notices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> All Notices
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : !one ? (
          <div className="text-center py-20 text-muted-foreground">Notice পাওয়া যায়নি।</div>
        ) : (
          <NoticeTemplate notice={one} brand={{ name: 'Shahed Store' }} signatureUrl={signature.imageDataUrl || undefined} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <SEOHead title="Notices" description="Latest notices and announcements from Shahed Store." />
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
