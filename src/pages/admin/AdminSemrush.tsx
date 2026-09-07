import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, TrendingUp, Link2, Search, Globe, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OverviewData {
  domain: string;
  database: string;
  limits: any;
  overview: any;
  organicKeywords: any;
  backlinksOverview: any;
  refDomains: any;
  history: any;
}

const DATABASES = ['us', 'uk', 'in', 'au', 'ca', 'de', 'fr'];

export default function AdminSemrush() {
  const [domain, setDomain] = useState('shahedit.com');
  const [database, setDatabase] = useState('us');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('semrush-overview', {
        body: { domain, database },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      setData(res as OverviewData);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load Semrush data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const ov = data?.overview?.rows?.[0] || {};
  const bl = data?.backlinksOverview?.rows?.[0] || {};
  const kw = data?.organicKeywords?.rows || [];
  const rd = data?.refDomains?.rows || [];
  const limits = data?.limits?.rows?.[0] || data?.limits?.raw || {};

  const stats = [
    { label: 'Authority Score', value: bl.ascore ?? '—', icon: Activity, color: 'from-fuchsia-500 to-violet-600' },
    { label: 'Organic Keywords', value: ov.Or ? Number(ov.Or).toLocaleString() : '—', icon: Search, color: 'from-emerald-500 to-teal-600' },
    { label: 'Est. Traffic / mo', value: ov.Ot ? Number(ov.Ot).toLocaleString() : '—', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
    { label: 'Total Backlinks', value: bl.total ? Number(bl.total).toLocaleString() : '—', icon: Link2, color: 'from-sky-500 to-blue-600' },
    { label: 'Referring Domains', value: bl.domains_num ? Number(bl.domains_num).toLocaleString() : '—', icon: Globe, color: 'from-rose-500 to-pink-600' },
    { label: 'Traffic Cost (USD)', value: ov.Oc ? `$${Number(ov.Oc).toLocaleString()}` : '—', icon: TrendingUp, color: 'from-indigo-500 to-purple-600' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <span className="inline-block w-2 h-8 bg-gradient-to-b from-fuchsia-500 to-violet-600 rounded" />
            Semrush SEO Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live SEO performance, keywords & backlinks for ranking</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="domain.com" className="w-56" />
          <Select value={database} onValueChange={setDatabase}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATABASES.map((d) => <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Top Organic Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Pos</TableHead>
                  <TableHead>Prev</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>Traffic %</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kw.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No keyword data</TableCell></TableRow>
                )}
                {kw.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.Ph}</TableCell>
                    <TableCell><Badge variant={Number(r.Po) <= 10 ? 'default' : 'secondary'}>{r.Po}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{r.Pp || '—'}</TableCell>
                    <TableCell>{r.Nq ? Number(r.Nq).toLocaleString() : '—'}</TableCell>
                    <TableCell>{r.Cp ? `$${r.Cp}` : '—'}</TableCell>
                    <TableCell>{r.Tr ? `${(Number(r.Tr) * 100).toFixed(1)}%` : '—'}</TableCell>
                    <TableCell className="max-w-[260px] truncate">
                      {r.Ur ? <a href={r.Ur} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.Ur}</a> : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Referring domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5" /> Top Referring Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Backlinks</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>First Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rd.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No backlink data</TableCell></TableRow>
                )}
                {rd.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.domain}</TableCell>
                    <TableCell><Badge>{r.ascore}</Badge></TableCell>
                    <TableCell>{r.backlinks_num ? Number(r.backlinks_num).toLocaleString() : '—'}</TableCell>
                    <TableCell className="uppercase">{r.country || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.first_seen || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quota */}
      <Card>
        <CardHeader>
          <CardTitle>API Quota & Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-48">
{JSON.stringify(limits, null, 2)}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Connected via Lovable Semrush integration. Free plans have daily limits — upgrade in Semrush if quota is exhausted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
