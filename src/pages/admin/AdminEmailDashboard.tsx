import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, RefreshCw, AlertCircle, CheckCircle2, Clock, Ban } from "lucide-react";
import { toast } from "sonner";

type LogRow = {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

const RANGES: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };

export default function AdminEmailDashboard() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [template, setTemplate] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - RANGES[range]);
      const { data, error } = await supabase
        .from("email_send_log")
        .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      setRows((data || []) as LogRow[]);
    } catch (e: any) {
      toast.error(e.message || "Failed to load email logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, [range]);

  // Deduplicate by message_id keeping latest status
  const deduped = useMemo(() => {
    const map = new Map<string, LogRow>();
    for (const r of rows) {
      const key = r.message_id || r.id;
      if (!map.has(key)) map.set(key, r); // rows already sorted desc, so first wins
    }
    return Array.from(map.values());
  }, [rows]);

  const templates = useMemo(() => {
    const s = new Set<string>();
    deduped.forEach(r => r.template_name && s.add(r.template_name));
    return Array.from(s).sort();
  }, [deduped]);

  const filtered = useMemo(() => {
    return deduped.filter(r => {
      if (template !== "all" && r.template_name !== template) return false;
      if (status !== "all" && r.status !== status) return false;
      if (search && !(r.recipient_email || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [deduped, template, status, search]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const sent = filtered.filter(r => r.status === "sent").length;
    const failed = filtered.filter(r => r.status === "dlq" || r.status === "failed" || r.status === "bounced").length;
    const pending = filtered.filter(r => r.status === "pending").length;
    const suppressed = filtered.filter(r => r.status === "suppressed").length;
    return { total, sent, failed, pending, suppressed };
  }, [filtered]);

  // Per-template summary
  const perTemplate = useMemo(() => {
    const map = new Map<string, { name: string; total: number; sent: number; failed: number; pending: number; lastSent?: string; lastError?: string }>();
    for (const r of deduped) {
      const name = r.template_name || "(unknown)";
      const cur = map.get(name) || { name, total: 0, sent: 0, failed: 0, pending: 0 };
      cur.total++;
      if (r.status === "sent") {
        cur.sent++;
        if (!cur.lastSent || new Date(r.created_at) > new Date(cur.lastSent)) cur.lastSent = r.created_at;
      } else if (r.status === "dlq" || r.status === "failed" || r.status === "bounced") {
        cur.failed++;
        if (!cur.lastError && r.error_message) cur.lastError = r.error_message;
      } else if (r.status === "pending") {
        cur.pending++;
      }
      map.set(name, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [deduped]);

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const statusBadge = (s: string | null) => {
    if (s === "sent") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />Sent</Badge>;
    if (s === "dlq" || s === "failed" || s === "bounced") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    if (s === "pending") return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    if (s === "suppressed") return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"><Ban className="w-3 h-3 mr-1" />Suppressed</Badge>;
    return <Badge variant="outline">{s || "—"}</Badge>;
  };

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6 text-primary" /> Email Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Track every transactional email — sends, failures, and delivery stats.</p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Time Range</label>
            <div className="flex gap-1">
              {Object.keys(RANGES).map(k => (
                <Button key={k} size="sm" variant={range === k ? "default" : "outline"} onClick={() => setRange(k)} className="flex-1">{k}</Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Template</label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="dlq">Failed (DLQ)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Search Recipient</label>
            <Input placeholder="email@example.com" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} color="text-foreground" />
        <StatCard label="Sent" value={stats.sent} color="text-emerald-600" />
        <StatCard label="Failed" value={stats.failed} color="text-red-600" />
        <StatCard label="Pending" value={stats.pending} color="text-amber-600" />
        <StatCard label="Suppressed" value={stats.suppressed} color="text-slate-600" />
      </div>

      {/* Per-template summary */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Per-Template Summary</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Sent</TableHead>
                <TableHead className="text-center">Failed</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead>Last Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perTemplate.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No data in this range</TableCell></TableRow>
              ) : perTemplate.map(t => (
                <TableRow key={t.name}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-center">{t.total}</TableCell>
                  <TableCell className="text-center text-emerald-600 font-semibold">{t.sent}</TableCell>
                  <TableCell className="text-center text-red-600 font-semibold">{t.failed}</TableCell>
                  <TableCell className="text-center text-amber-600">{t.pending}</TableCell>
                  <TableCell className="text-xs">{fmt(t.lastSent)}</TableCell>
                  <TableCell className="text-xs text-red-600 max-w-xs truncate" title={t.lastError || ""}>{t.lastError || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detailed log */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Email Log ({filtered.length})</h2>
          <div className="flex items-center gap-2 text-sm">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</Button>
            <span className="text-muted-foreground">{page + 1} / {pageCount}</span>
            <Button size="sm" variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No emails match the current filters</TableCell></TableRow>
              ) : pageRows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.template_name || "—"}</TableCell>
                  <TableCell className="text-xs break-all">{r.recipient_email || "—"}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{fmt(r.created_at)}</TableCell>
                  <TableCell className="text-xs text-red-600 max-w-md truncate" title={r.error_message || ""}>{r.error_message || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</div>
    </Card>
  );
}
