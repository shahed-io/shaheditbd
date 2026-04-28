import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  KeyRound, Wallet, RefreshCw, Copy, Check, AlertCircle, Zap,
  GitCompare, Layers, History, Code2, ExternalLink, ShieldCheck, Sparkles,
  Loader2, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProviderBalance {
  status: 'ok' | 'error' | 'not_configured' | 'unavailable';
  balance?: number;
  error?: string;
  message?: string;
  currency?: string;
  endpoint?: string;
  raw?: string;
}
interface BalanceResponse {
  providers: { getcid?: ProviderBalance; grahok?: ProviderBalance };
}
interface CompareResult {
  installation_id: string;
  total_elapsed_ms: number;
  getcid: { status: 'success' | 'failed'; cid?: string; error?: string; raw?: string };
  grahok: { status: 'success' | 'failed'; cid?: string; error?: string; raw?: string };
}
interface BatchResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{
    installation_id: string;
    status: 'success' | 'failed' | 'skipped';
    cid?: string;
    provider?: string;
    error?: string;
    errors?: Record<string, string>;
  }>;
}
interface HistoryItem {
  id: string;
  installation_id: string;
  cid: string;
  price_cents: number;
  created_at: string;
  user_id: string;
  user?: { email?: string; display_name?: string } | null;
}

const formatIID = (raw: string) =>
  raw.replace(/[^0-9]/g, '').replace(/(.{7})/g, '$1 ').trim();

const formatCID = (raw: string) =>
  raw.replace(/[^0-9]/g, '').replace(/(.{6})/g, '$1 ').trim();

const CopyBtn = ({ text, label = 'Copy' }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </Button>
  );
};

const callApi = async (action: string, payload: Record<string, unknown> = {}) => {
  const { data: sess } = await supabase.auth.getSession();
  const jwt = sess.session?.access_token;
  if (!jwt) throw new Error('Not authenticated');
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-cid`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

export default function AdminGetCIDTools() {
  // ─── Balance state ───
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // ─── Single CID generation ───
  const [iid, setIid] = useState('');
  const [provider, setProvider] = useState<'auto' | 'getcid' | 'grahok'>('auto');
  const [cidResult, setCidResult] = useState<{ cid: string; provider: string; elapsed_ms: number } | null>(null);
  const [cidLoading, setCidLoading] = useState(false);
  const [cidError, setCidError] = useState<string | null>(null);

  // ─── Compare providers ───
  const [compareIid, setCompareIid] = useState('');
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // ─── Batch ───
  const [batchInput, setBatchInput] = useState('');
  const [batchProvider, setBatchProvider] = useState<'auto' | 'getcid' | 'grahok'>('auto');
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // ─── Load balance on mount ───
  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const data = await callApi('admin_balance');
      setBalance(data);
    } catch (e) {
      toast.error(`Balance check failed: ${(e as Error).message}`);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // ─── Single CID ───
  const handleGenerate = async () => {
    if (iid.trim().length < 4) {
      toast.error('Installation ID খুব ছোট');
      return;
    }
    setCidLoading(true);
    setCidResult(null);
    setCidError(null);
    try {
      const data = await callApi('admin_generate', { installation_id: iid, provider });
      setCidResult(data);
      toast.success(`CID generated via ${data.provider}`);
    } catch (e) {
      setCidError((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setCidLoading(false);
    }
  };

  // ─── Compare ───
  const handleCompare = async () => {
    if (compareIid.trim().length < 4) {
      toast.error('Installation ID খুব ছোট');
      return;
    }
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const data = await callApi('admin_compare', { installation_id: compareIid });
      setCompareResult(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCompareLoading(false);
    }
  };

  // ─── Batch ───
  const handleBatch = async () => {
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('কমপক্ষে একটি IID দিন');
      return;
    }
    if (lines.length > 50) {
      toast.error('সর্বোচ্চ ৫০টি IID একসাথে চলবে');
      return;
    }
    setBatchLoading(true);
    setBatchResult(null);
    try {
      const data = await callApi('admin_batch', { installation_ids: lines, provider: batchProvider });
      setBatchResult(data);
      toast.success(`${data.success}/${data.total} successful`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBatchLoading(false);
    }
  };

  const exportBatchCSV = () => {
    if (!batchResult) return;
    const csv = [
      'Installation ID,Status,CID,Provider,Error',
      ...batchResult.results.map(r => [
        r.installation_id,
        r.status,
        r.cid || '',
        r.provider || '',
        r.error || (r.errors ? JSON.stringify(r.errors) : ''),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cid-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <span className="p-2 rounded-lg bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </span>
            CID Gateway Tools
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Microsoft Phone Activation — Confirmation ID generator with multi-channel auto-fallback
          </p>
        </div>
        <Button onClick={loadBalance} disabled={balanceLoading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${balanceLoading ? 'animate-spin' : ''}`} />
          Refresh Balances
        </Button>
      </div>

      {/* ─── Balance Cards ─── */}
      <div className="grid md:grid-cols-2 gap-4">
        {(['getcid', 'grahok'] as const).map((key) => {
          const p = balance?.providers[key];
          const isPrimary = key === 'getcid';
          const channelLabel = isPrimary ? 'Primary Channel' : 'Backup Channel';
          return (
            <Card key={key} className={`relative overflow-hidden ${isPrimary ? 'border-primary/40' : ''}`}>
              <Badge className={`absolute top-3 right-3 ${isPrimary ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}`} variant="outline">
                {isPrimary ? 'Primary' : 'Backup'}
              </Badge>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4" />
                  {channelLabel}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isPrimary ? 'Auto-routed first for every request' : 'Activated automatically on primary failure'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking…
                  </div>
                ) : p?.status === 'ok' ? (
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-foreground">
                      {p.currency === 'USD' ? '$' : '৳'}{Number(p.balance ?? 0).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </div>
                  </div>
                ) : p?.status === 'not_configured' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" /> Channel credentials not configured
                  </div>
                ) : p?.status === 'unavailable' ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      {(p as any)?.message || 'Balance check not supported'}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                      Channel still works for CID generation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-destructive">
                      <XCircle className="h-4 w-4" /> Error
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p?.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Main Tabs ─── */}
      <Tabs defaultValue="single" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="single" className="gap-2 py-2.5">
            <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Single</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-2 py-2.5">
            <GitCompare className="h-4 w-4" /> <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2 py-2.5">
            <Layers className="h-4 w-4" /> <span className="hidden sm:inline">Batch</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2 py-2.5">
            <Code2 className="h-4 w-4" /> <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
        </TabsList>
          <TabsTrigger value="single" className="gap-2 py-2.5">
            <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Single</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-2 py-2.5">
            <GitCompare className="h-4 w-4" /> <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2 py-2.5">
            <Layers className="h-4 w-4" /> <span className="hidden sm:inline">Batch</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 py-2.5">
            <History className="h-4 w-4" /> <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2 py-2.5">
            <Code2 className="h-4 w-4" /> <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Single CID ─── */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Generate Single CID
              </CardTitle>
              <CardDescription>
                Microsoft Office/Windows phone activation থেকে পাওয়া Installation ID দিন।
                Admin মোডে কোনো balance কাটা হবে না।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-[1fr_180px] gap-3">
                <div className="space-y-2">
                  <Label htmlFor="iid">Installation ID (IID)</Label>
                  <Input
                    id="iid"
                    placeholder="e.g. 1217711-9199424-2493151-5767021-..."
                    value={iid}
                    onChange={(e) => setIid(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Numbers এবং dashes — formatting ঠিক করে নেওয়া হবে অটো
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Routing</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Smart (auto-fallback)</SelectItem>
                      <SelectItem value="getcid">Primary only</SelectItem>
                      <SelectItem value="grahok">Backup only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={cidLoading} size="lg" className="w-full md:w-auto gap-2">
                {cidLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate CID
              </Button>

              {cidError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Generation Failed</AlertTitle>
                  <AlertDescription className="break-all">{cidError}</AlertDescription>
                </Alert>
              )}

              {cidResult && (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 gap-1.5" variant="outline">
                        <CheckCircle2 className="h-3 w-3" /> Success via {cidResult.provider === 'getcid' ? 'Primary' : 'Backup'} Channel
                      </Badge>
                      <Badge variant="outline" className="gap-1.5">
                        <Clock className="h-3 w-3" /> {cidResult.elapsed_ms}ms
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Confirmation ID (CID)</Label>
                      <div className="mt-2 p-4 rounded-lg bg-background border font-mono text-base md:text-lg break-all">
                        {formatCID(cidResult.cid)}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <CopyBtn text={cidResult.cid} label="Copy CID" />
                      <CopyBtn text={formatCID(cidResult.cid)} label="Copy formatted" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: Compare ─── */}
        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                Compare Both Providers
              </CardTitle>
              <CardDescription>
                একই IID দুটো provider-এ একসাথে পাঠিয়ে compare করো — কোনটা কাজ করছে, কোনটার response কী।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="compare-iid">Installation ID</Label>
                <Input
                  id="compare-iid"
                  placeholder="Installation ID..."
                  value={compareIid}
                  onChange={(e) => setCompareIid(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleCompare} disabled={compareLoading} className="gap-2">
                {compareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                Compare Both
              </Button>

              {compareResult && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Total: {compareResult.total_elapsed_ms}ms
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {(['getcid', 'grahok'] as const).map((p) => {
                      const r = compareResult[p];
                      const ok = r.status === 'success';
                      return (
                        <Card key={p} className={ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span>{p === 'getcid' ? 'Primary Channel' : 'Backup Channel'}</span>
                              {ok ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Success
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                                  <XCircle className="h-3 w-3" /> Failed
                                </Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {ok ? (
                              <>
                                <div className="font-mono text-sm break-all p-3 rounded bg-background border">
                                  {formatCID(r.cid!)}
                                </div>
                                <CopyBtn text={r.cid!} />
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-destructive">{r.error}</p>
                                {r.raw && (
                                  <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">{r.raw}</pre>
                                )}
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: Batch ─── */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Batch Generation
              </CardTitle>
              <CardDescription>
                সর্বোচ্চ ৫০টি IID একসাথে — প্রতি লাইনে একটি IID দিন।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-[1fr_180px] gap-3">
                <div className="space-y-2">
                  <Label htmlFor="batch-input">Installation IDs (one per line)</Label>
                  <Textarea
                    id="batch-input"
                    placeholder={`1217711-9199424-2493151-5767021-...\n2334411-8829293-1192812-9912345-...\n...`}
                    rows={8}
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {batchInput.split('\n').filter(l => l.trim()).length} / 50 IIDs
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Routing</Label>
                  <Select value={batchProvider} onValueChange={(v) => setBatchProvider(v as typeof batchProvider)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Smart (auto-fallback)</SelectItem>
                      <SelectItem value="getcid">Primary only</SelectItem>
                      <SelectItem value="grahok">Backup only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleBatch} disabled={batchLoading} className="gap-2">
                  {batchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                  Process Batch
                </Button>
                {batchResult && (
                  <Button onClick={exportBatchCSV} variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Export CSV
                  </Button>
                )}
              </div>

              {batchResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Card><CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold">{batchResult.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </CardContent></Card>
                    <Card><CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600">{batchResult.success}</div>
                      <div className="text-xs text-muted-foreground">Success</div>
                    </CardContent></Card>
                    <Card><CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-destructive">{batchResult.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </CardContent></Card>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">IID</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">CID / Error</th>
                            <th className="p-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchResult.results.map((r, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2 text-muted-foreground">{i + 1}</td>
                              <td className="p-2 font-mono truncate max-w-[200px]">{r.installation_id.slice(0, 30)}…</td>
                              <td className="p-2">
                                {r.status === 'success' ? (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                                    {r.provider === 'getcid' ? 'Primary' : 'Backup'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                                    failed
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2 font-mono break-all max-w-[300px]">
                                {r.cid ? formatCID(r.cid) : (r.error || JSON.stringify(r.errors))}
                              </td>
                              <td className="p-2">
                                {r.cid && <CopyBtn text={r.cid} />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: History ─── */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Generation History
                </CardTitle>
                <CardDescription>
                  All CIDs generated through the system (admin + resellers, last 100)
                </CardDescription>
              </div>
              <Button onClick={loadHistory} disabled={historyLoading} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No generations yet</div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">User</th>
                          <th className="p-2 text-left">IID</th>
                          <th className="p-2 text-left">CID</th>
                          <th className="p-2 text-left">Cost</th>
                          <th className="p-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id} className="border-t hover:bg-muted/40">
                            <td className="p-2 whitespace-nowrap">
                              {new Date(h.created_at).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </td>
                            <td className="p-2">{h.user?.display_name || h.user?.email || <span className="text-muted-foreground">—</span>}</td>
                            <td className="p-2 font-mono truncate max-w-[180px]">{h.installation_id.slice(0, 25)}…</td>
                            <td className="p-2 font-mono truncate max-w-[180px]">{h.cid.slice(0, 25)}…</td>
                            <td className="p-2">${(h.price_cents / 100).toFixed(2)}</td>
                            <td className="p-2"><CopyBtn text={h.cid} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 5: API Documentation (Internal — provider-agnostic) ─── */}
        <TabsContent value="docs">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary" /> Internal CID Gateway API
                </CardTitle>
                <CardDescription>
                  Our reseller-facing endpoint. Upstream channels are abstracted — neither resellers nor end users see provider names.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Routing is fully transparent</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    Every reseller request is auto-routed through our internal channels. Upstream provider names, URLs, and error responses are never exposed to clients — only generic success or "temporarily unavailable" messages are returned.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Generate CID
                  </h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`POST {SUPABASE_URL}/functions/v1/get-cid
Content-Type: application/json

{
  "action": "getcid",
  "token": "{RESELLER_SESSION_TOKEN}",
  "installation_id": "{IID}"
}`}
                  </pre>
                  <table className="w-full text-xs mt-3 border">
                    <thead className="bg-muted"><tr>
                      <th className="p-2 text-left">Field</th>
                      <th className="p-2 text-left">Required</th>
                      <th className="p-2 text-left">Description</th>
                    </tr></thead>
                    <tbody>
                      <tr className="border-t"><td className="p-2 font-mono">action</td><td className="p-2">Yes</td><td className="p-2">Always <code>"getcid"</code></td></tr>
                      <tr className="border-t"><td className="p-2 font-mono">token</td><td className="p-2">Yes</td><td className="p-2">Reseller session token (from /reseller-auth)</td></tr>
                      <tr className="border-t"><td className="p-2 font-mono">installation_id</td><td className="p-2">Yes</td><td className="p-2">Microsoft IID (digits or dash-separated)</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response — Success</h4>
                  <pre className="bg-muted p-3 rounded text-xs">{`{
  "cid": "228126-846886-493986-...",
  "balance_after_cents": 4900,
  "billed_user_id": "..."
}`}</pre>
                  <p className="text-xs text-muted-foreground mt-2">No provider/upstream channel info is ever included.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response — Errors</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    {[
                      ['Unauthenticated', '{"error": "Authentication required"}'],
                      ['Invalid session', '{"error": "Invalid or expired session"}'],
                      ['Bad IID', '{"error": "Installation ID too short"}'],
                      ['Insufficient balance', '{"error": "Insufficient balance. Need $1.00, have $0.00"}'],
                      ['All channels down', '{"error": "CID generation temporarily unavailable. Please try again."}'],
                    ].map(([label, body]) => (
                      <div key={label} className="border rounded p-2">
                        <div className="font-medium">{label}</div>
                        <pre className="text-[10px] mt-1 text-muted-foreground">{body}</pre>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" /> Check Balance
                  </h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`POST {SUPABASE_URL}/functions/v1/get-cid
{ "action": "balance", "token": "{RESELLER_SESSION_TOKEN}" }

Response: { "ok": true, "balance": 42 }`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">cURL Example</h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`# Generate CID
curl -X POST "{SUPABASE_URL}/functions/v1/get-cid" \\
  -H "Content-Type: application/json" \\
  -H "apikey: {ANON_KEY}" \\
  -d '{"action":"getcid","token":"SESSION_TOKEN","installation_id":"YOUR_IID"}'`}
                  </pre>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Operational notes</AlertTitle>
                  <AlertDescription className="text-xs space-y-1 mt-2">
                    <div>• Each successful CID costs <strong>$1.00</strong> from the reseller's balance</div>
                    <div>• Admin-issued CIDs (no <code>token</code>, JWT auth) bypass billing</div>
                    <div>• Smart routing: Primary Channel first, automatic failover to Backup Channel</div>
                    <div>• HTTP timeout: at least <strong>60 seconds</strong> recommended (CID can take 5–30s)</div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
