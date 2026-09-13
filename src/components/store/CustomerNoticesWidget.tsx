// Customer dashboard widget — shows latest published notices for customers
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, ChevronRight } from 'lucide-react';

interface NoticeRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  reference_no: string | null;
  published_at: string | null;
  pinned: boolean;
}

export default function CustomerNoticesWidget() {
  const [list, setList] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const { data } = await supabase
        .from('notices')
        .select('id, slug, title, summary, reference_no, published_at, pinned')
        .eq('status', 'published')
        .in('audience', ['public', 'customers', 'both'])
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(5);
      if (!canceled) {
        setList((data as NoticeRow[]) || []);
        setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  if (loading) return null;
  if (list.length === 0) return null;

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> নোটিশ
        </h3>
        <Link to="/notices" className="text-xs text-primary hover:underline inline-flex items-center">
          সব দেখুন <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {list.map((n) => (
          <Link key={n.id} to={`/notices/${n.slug}`}
                className="block rounded-lg px-3 py-2 hover:bg-secondary transition">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{n.pinned && '📌 '}{n.title}</div>
                {n.summary && <div className="text-xs text-muted-foreground line-clamp-1">{n.summary}</div>}
              </div>
              {n.published_at && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(n.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
