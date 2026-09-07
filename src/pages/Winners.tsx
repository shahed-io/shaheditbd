import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';

interface WinnerBlock {
  offer_id: string;
  offer_title: string;
  offer_slug: string;
  end_at: string | null;
  winners: Array<{ id: string; rank: number; prize: string | null; name: string }>;
}

export default function Winners() {
  const [blocks, setBlocks] = useState<WinnerBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: offers } = await supabase
        .from('offers')
        .select('id, title, slug, end_at, show_winners, status')
        .eq('show_winners', true)
        .in('status', ['active', 'closed'])
        .order('end_at', { ascending: false, nullsFirst: false });

      if (!offers || offers.length === 0) {
        setLoading(false);
        return;
      }
      const ids = offers.map((o: any) => o.id);
      const { data: wins } = await supabase
        .from('offer_winners_public')
        .select('id, offer_id, rank, prize, participant_name')
        .in('offer_id', ids)
        .order('rank');

      const grouped: WinnerBlock[] = offers
        .map((o: any) => ({
          offer_id: o.id,
          offer_title: o.title,
          offer_slug: o.slug,
          end_at: o.end_at,
          winners: (wins ?? [])
            .filter((w: any) => w.offer_id === o.id)
            .map((w: any) => ({ id: w.id, rank: w.rank, prize: w.prize, name: w.participant_name || 'Winner' })),
        }))
        .filter((b) => b.winners.length > 0);

      setBlocks(grouped);
      setLoading(false);
    })();
  }, []);

  const rankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-white';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
    return 'bg-primary/10 text-primary';
  };

  return (
    <>
      <SEOHead title="Giveaway Winners — Shahed IT" description="Celebrating our giveaway winners from Shahed IT." />
      <Navbar />
      <div className="container max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-3">
            <Sparkles className="w-4 h-4" /> Winners Showcase
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">🏆 Giveaway Winners</h1>
          <p className="text-muted-foreground">Congratulations to all our lucky winners across recent giveaways.</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading winners…</div>
        ) : blocks.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No winners announced yet. Check back soon!</CardContent></Card>
        ) : (
          <div className="space-y-8">
            {blocks.map((b) => (
              <Card key={b.offer_id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-transparent px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <Link to={`/offer/${b.offer_slug}`} className="font-semibold text-lg hover:text-primary transition-colors">
                      {b.offer_title}
                    </Link>
                    {b.end_at && (
                      <div className="text-xs text-muted-foreground">Ended {new Date(b.end_at).toLocaleDateString()}</div>
                    )}
                  </div>
                  <Badge variant="outline">{b.winners.length} winner{b.winners.length > 1 ? 's' : ''}</Badge>
                </div>
                <CardContent className="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {b.winners.map((w) => (
                    <div key={w.id} className="border rounded-lg p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${rankBadge(w.rank)}`}>
                        {w.rank === 1 ? <Trophy className="w-5 h-5" /> : `#${w.rank}`}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{w.name}</div>
                        {w.prize && <div className="text-xs text-muted-foreground mt-0.5">🎁 {w.prize}</div>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
