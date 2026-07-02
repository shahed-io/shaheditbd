import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Copy, ExternalLink, Gift, Users, Calendar, Sparkles, Trophy, Megaphone, BellRing } from 'lucide-react';
import SendToNotificationsDialog from '@/components/admin/SendToNotificationsDialog';

interface Offer {
  id: string;
  slug: string;
  title: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
  submission_count: number;
  banner_url: string | null;
  created_at: string;
}

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyOffer, setNotifyOffer] = useState<Offer | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('offers')
      .select('id, slug, title, status, start_at, end_at, submission_count, banner_url, created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setOffers((data as Offer[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createNew = async () => {
    const slug = `offer-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('offers')
      .insert({ slug, title: 'New Offer', status: 'draft', require_login: false, max_submissions: null })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await supabase.from('offer_fields').insert([
      { offer_id: data.id, field_type: 'text', label: 'আপনার পূর্ণ নাম', required: true, sort_order: 0 },
      { offer_id: data.id, field_type: 'phone', label: 'আপনার ফোন নম্বর', required: true, sort_order: 1 },
      { offer_id: data.id, field_type: 'email', label: 'আপনার ইমেইল ঠিকানা', required: false, sort_order: 2 },
    ]);
    navigate(`/ceo/offers/${data.id}`);
  };

  const duplicate = async (offer: Offer) => {
    const { data: full } = await supabase.from('offers').select('*').eq('id', offer.id).single();
    if (!full) return;
    const { data: fields } = await supabase.from('offer_fields').select('*').eq('offer_id', offer.id);
    const { id, created_at, updated_at, submission_count, slug, ...rest } = full as any;
    const newSlug = `${slug}-copy-${Date.now().toString(36)}`;
    const { data: newOffer, error } = await supabase
      .from('offers')
      .insert({ ...rest, slug: newSlug, title: `${full.title} (Copy)`, status: 'draft' })
      .select()
      .single();
    if (error) return toast.error(error.message);
    if (fields && fields.length > 0) {
      const rows = fields.map((f: any) => {
        const { id: _, offer_id: __, created_at: ___, ...rest } = f;
        return { ...rest, offer_id: newOffer.id };
      });
      await supabase.from('offer_fields').insert(rows);
    }
    toast.success('Offer duplicated');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this offer? All submissions and winners will be removed too.')) return;
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/offer/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Public link copied');
  };

  const statusStyle: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    draft: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    closed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  };

  const totalEntries = offers.reduce((s, o) => s + (o.submission_count || 0), 0);
  const activeCount = offers.filter((o) => o.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Hero header — gradient glassmorphism matching site */}
      <div className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/40 dark:via-slate-950 dark:to-fuchsia-950/40 shadow-[0_10px_40px_-15px_rgba(139,92,246,0.35)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-fuchsia-400/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-violet-400/30 blur-3xl pointer-events-none" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Gift className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Offers & Giveaways
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Create custom offer forms hosted on your own domain. Pick winners with AI.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur">
                  <Megaphone className="w-3 h-3 text-violet-600" /> {offers.length} offers
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> {activeCount} active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur">
                  <Users className="w-3 h-3 text-fuchsia-600" /> {totalEntries} entries
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={createNew}
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-lg shadow-violet-500/30 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" /> New Offer
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-gradient-to-br from-white/60 to-white/20 dark:from-white/5 dark:to-white/0 border border-white/40 dark:border-white/10 backdrop-blur-xl animate-pulse" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
            <Gift className="w-10 h-10 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No offers yet</h3>
          <p className="text-sm text-muted-foreground mb-5">Launch your first giveaway and pick winners with AI.</p>
          <Button
            onClick={createNew}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" /> Create Offer
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <div
              key={o.id}
              className="group relative overflow-hidden rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(139,92,246,0.25)] hover:shadow-[0_20px_50px_-15px_rgba(139,92,246,0.45)] hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Animated gradient border glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-violet-500/40 blur-md" />
              </div>

              <div className="relative">
                {o.banner_url ? (
                  <div className="relative h-32 overflow-hidden">
                    <img src={o.banner_url} alt={o.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <Badge className={`absolute top-3 right-3 border ${statusStyle[o.status] || statusStyle.draft} backdrop-blur-md capitalize`}>
                      {o.status}
                    </Badge>
                  </div>
                ) : (
                  <div className="relative h-32 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-purple-500/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-fuchsia-400/30 blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-violet-400/30 blur-2xl" />
                    <Trophy className="relative w-12 h-12 text-violet-600/70" />
                    <Badge className={`absolute top-3 right-3 border ${statusStyle[o.status] || statusStyle.draft} backdrop-blur-md capitalize`}>
                      {o.status}
                    </Badge>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold leading-snug line-clamp-2 min-h-[2.75rem]">{o.title}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">
                      <Users className="w-3.5 h-3.5" /> {o.submission_count} entries
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300">
                      <Calendar className="w-3.5 h-3.5" />
                      {o.end_at ? new Date(o.end_at).toLocaleDateString() : 'No end'}
                    </div>
                  </div>

                  <div className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-500/10 text-muted-foreground break-all">
                    /offer/{o.slug}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button size="sm" variant="outline" asChild className="rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10 hover:bg-violet-500/10 hover:border-violet-500/40">
                      <Link to={`/ceo/offers/${o.id}`}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyLink(o.slug)} className="rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10 hover:bg-violet-500/10 hover:border-violet-500/40">
                      <Copy className="w-3 h-3 mr-1" /> Link
                    </Button>
                    <Button size="sm" variant="outline" asChild className="rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10 hover:bg-violet-500/10 hover:border-violet-500/40">
                      <a href={`/offer/${o.slug}`} target="_blank" rel="noopener noreferrer" title="Open public page">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => duplicate(o)} className="rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10 hover:bg-violet-500/10 hover:border-violet-500/40" title="Duplicate">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setNotifyOffer(o)} className="rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10 hover:bg-violet-500/10 hover:border-violet-500/40 text-violet-700" title="Send to user notifications">
                      <BellRing className="w-3 h-3 mr-1" /> Notify
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(o.id)} className="rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur border-white/60 dark:border-white/10 hover:bg-rose-500/10 hover:border-rose-500/40 text-rose-600 ml-auto" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
