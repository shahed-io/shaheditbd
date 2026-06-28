import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Copy, ExternalLink, Gift, Users, Calendar } from 'lucide-react';

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

  const statusColor: Record<string, string> = {
    active: 'bg-green-500/15 text-green-700 dark:text-green-400',
    draft: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
    closed: 'bg-red-500/15 text-red-700 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" /> Offers & Giveaways
          </h1>
          <p className="text-sm text-muted-foreground">Create custom offer forms hosted on your own domain. Pick winners with AI.</p>
        </div>
        <Button onClick={createNew}>
          <Plus className="w-4 h-4 mr-1" /> New Offer
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Gift className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No offers yet. Create your first giveaway!</p>
            <Button onClick={createNew}>
              <Plus className="w-4 h-4 mr-1" /> Create Offer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <Card key={o.id} className="overflow-hidden">
              {o.banner_url && (
                <img src={o.banner_url} alt={o.title} className="w-full h-32 object-cover" loading="lazy" />
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{o.title}</h3>
                  <Badge className={statusColor[o.status] || statusColor.draft}>{o.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {o.submission_count} entries
                  </div>
                  {o.end_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Ends {new Date(o.end_at).toLocaleDateString()}
                    </div>
                  )}
                  <div className="font-mono break-all opacity-70">/offer/{o.slug}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/ceo/offers/${o.id}`}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyLink(o.slug)}>
                    <Copy className="w-3 h-3 mr-1" /> Link
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/offer/${o.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicate(o)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(o.id)} className="text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
