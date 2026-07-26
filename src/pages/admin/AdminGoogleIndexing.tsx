import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
  KeyRound,
  Search,
} from "lucide-react";

interface StatusResp {
  configured: boolean;
  service_account_email?: string | null;
  project_id?: string | null;
  last_tested_at?: string | null;
  last_test_ok?: boolean | null;
  last_test_message?: string | null;
  updated_at?: string | null;
}

interface LogRow {
  id: string;
  product_id: string | null;
  url: string;
  notification_type: string;
  status_code: number | null;
  ok: boolean;
  response_body: string | null;
  error: string | null;
  submitted_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
}

async function callFn(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("google-indexing", {
    body: { action, ...body },
  });
  if (error) {
    // Try to surface the real message the function returned.
    let details = error.message;
    try {
      const anyErr = error as unknown as { context?: { text?: () => Promise<string> } };
      if (anyErr.context?.text) details = await anyErr.context.text();
    } catch { /* ignore */ }
    throw new Error(details);
  }
  return data;
}

export default function AdminGoogleIndexing() {
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const data = await callFn("status");
      setStatus(data);
    } catch (e: any) {
      toast.error(`Status failed: ${e.message}`);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(500);
    setProducts(data || []);
  }, []);

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from("google_indexing_log")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(500);
    setLogs((data as LogRow[]) || []);
  }, []);

  useEffect(() => {
    loadStatus();
    loadProducts();
    loadLogs();
  }, [loadStatus, loadProducts, loadLogs]);

  const saveKey = async () => {
    if (!keyInput.trim()) return toast.error("Paste your service account JSON first");
    setSaving(true);
    try {
      const data = await callFn("save_key", { service_account_json: keyInput });
      toast.success(`Saved: ${data.service_account_email}`);
      setKeyInput("");
      await loadStatus();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteKey = async () => {
    if (!confirm("Remove stored Google service account key?")) return;
    try {
      await callFn("delete_key");
      toast.success("Key removed");
      await loadStatus();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const data = await callFn("test");
      if (data.ok) toast.success(data.message);
      else toast.error(data.message);
      await loadStatus();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  };

  const submitOne = async (productId: string) => {
    setBusy(productId);
    try {
      const data = await callFn("submit", { product_ids: [productId] });
      const r = data.results?.[0];
      if (r?.ok) toast.success(`Submitted ${r.url}`);
      else toast.error(r?.error || `HTTP ${r?.status}`);
      await loadLogs();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const submitAll = async () => {
    if (!confirm(`Submit all ${products.length} product URLs to Google? (Quota: 200/day)`)) return;
    setBusy("all");
    try {
      const data = await callFn("submit", { all: true });
      toast.success(
        `Submitted ${data.submitted}. OK: ${data.succeeded}, Failed: ${data.failed}`,
      );
      await loadLogs();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const lastLogByProduct = useMemo(() => {
    const map = new Map<string, LogRow>();
    for (const l of logs) if (l.product_id && !map.has(l.product_id)) map.set(l.product_id, l);
    return map;
  }, [logs]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-6 h-6" />
          Google API Integration
        </h1>
        <p className="text-muted-foreground mt-1">
          Auto-submit product URLs to Google Indexing API. Quota: 200 requests/day.
        </p>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> Service Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.configured ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  Connected as {status.service_account_email}
                </div>
                {status.project_id && (
                  <div className="text-xs text-muted-foreground">
                    Project: {status.project_id}
                  </div>
                )}
                {status.last_tested_at && (
                  <div className="text-xs">
                    Last test:{" "}
                    <span className={status.last_test_ok ? "text-emerald-600" : "text-red-600"}>
                      {status.last_test_ok ? "OK" : "FAILED"}
                    </span>{" "}
                    · {new Date(status.last_tested_at).toLocaleString()}
                    {status.last_test_message && (
                      <div className="text-muted-foreground mt-1 break-words">
                        {status.last_test_message}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={testConnection} disabled={testing} variant="outline" size="sm">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="ml-2">Test Connection</span>
                </Button>
                <Button onClick={deleteKey} variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              No service account configured. Paste your JSON key below.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Google Service Account JSON</label>
            <Textarea
              rows={8}
              placeholder='{ "type": "service_account", "project_id": "...", "private_key": "...", "client_email": "...", ... }'
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Create at Google Cloud Console → IAM & Admin → Service Accounts. Enable the
              <b> Indexing API</b>, then add the service account email as an <b>Owner</b> in Google Search Console.
              The key is stored server-side only — never exposed to the browser.
            </p>
            <Button onClick={saveKey} disabled={saving || !keyInput.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Submit</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {products.length} active products. Sitemap auto-updates on every save.
          </div>
          <Button
            onClick={submitAll}
            disabled={busy === "all" || !status?.configured}
            size="lg"
          >
            {busy === "all" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit All Products
          </Button>
        </CardContent>
      </Card>

      {/* Status table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 flex">
          <CardTitle>Products & Last Submission</CardTitle>
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Product</th>
                <th className="p-3">Last Submitted</th>
                <th className="p-3">Status</th>
                <th className="p-3">Response</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const last = lastLogByProduct.get(p.id);
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">/product/{p.slug}</div>
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap">
                      {last ? new Date(last.submitted_at).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      {last ? (
                        last.ok ? (
                          <Badge className="bg-emerald-600">OK {last.status_code}</Badge>
                        ) : (
                          <Badge variant="destructive">
                            {last.status_code ? `HTTP ${last.status_code}` : "ERROR"}
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline">Never</Badge>
                      )}
                    </td>
                    <td className="p-3 max-w-md">
                      <div className="text-xs text-muted-foreground break-words line-clamp-2">
                        {last?.error || last?.response_body || "—"}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === p.id || !status?.configured}
                        onClick={() => submitOne(p.id)}
                      >
                        {busy === p.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span className="ml-1">Submit</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No products.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex-row items-center justify-between flex">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadLogs}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Time</th>
                <th className="p-3">URL</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 100).map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-3 text-xs whitespace-nowrap">
                    {new Date(l.submitted_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-xs break-all">{l.url}</td>
                  <td className="p-3 text-xs">{l.notification_type}</td>
                  <td className="p-3">
                    {l.ok ? (
                      <Badge className="bg-emerald-600">OK</Badge>
                    ) : (
                      <Badge variant="destructive">FAIL</Badge>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-md break-words line-clamp-2">
                    {l.error || l.response_body || "—"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
