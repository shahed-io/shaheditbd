import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const FEED_URL = "https://shahedit.com/product-feed.xml";

type Row = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  price: number | null;
  image_url: string | null;
  images: string[] | null;
  brand: string | null;
  stock_quantity: number | null;
  status: string | null;
};

type Issue = { field: string; label: string };

function auditProduct(p: Row): Issue[] {
  const issues: Issue[] = [];
  if (!p.name?.trim()) issues.push({ field: "name", label: "Missing title" });
  if (!p.slug?.trim()) issues.push({ field: "slug", label: "Missing slug (no product URL)" });
  const desc = (p.description || p.short_description || "").trim();
  if (!desc) issues.push({ field: "description", label: "Missing description" });
  else if (desc.length < 30) issues.push({ field: "description", label: "Description too short (<30 chars)" });
  if (!p.image_url && !(p.images && p.images.length)) issues.push({ field: "image_url", label: "Missing image" });
  if (p.price == null || Number(p.price) <= 0) issues.push({ field: "price", label: "Missing or zero price" });
  if (!p.brand?.trim()) issues.push({ field: "brand", label: "Missing brand (defaults to Shahed IT)" });
  return issues;
}

export default function AdminGoogleFeed() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,slug,description,short_description,price,image_url,images,brand,stock_quantity,status")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const audited = useMemo(
    () => rows.map((p) => ({ p, issues: auditProduct(p) })),
    [rows]
  );
  const withIssues = audited.filter((x) => x.issues.length > 0);
  const clean = audited.length - withIssues.length;

  const copyUrl = async () => {
    await navigator.clipboard.writeText(FEED_URL);
    toast.success("Feed URL copied");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Google Merchant Feed</h1>
        <p className="text-sm text-muted-foreground">
          Live product feed for Google Merchant Center. Updates automatically as products change.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Feed URL</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={FEED_URL} className="font-mono text-xs" />
            <Button onClick={copyUrl} variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
            <Button asChild variant="outline" size="icon">
              <a href={FEED_URL} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Submit this URL in Google Merchant Center → Products → Feeds → Scheduled fetch.
            Format: RSS 2.0 with the <code>g:</code> namespace.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{rows.length}</div>
              <div className="text-xs text-muted-foreground">Active products in feed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{clean}</div>
              <div className="text-xs text-muted-foreground">Fully valid products</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold">{withIssues.length}</div>
              <div className="text-xs text-muted-foreground">Products with missing fields</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Products needing fixes ({withIssues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {withIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">🎉 All active products have complete Merchant Center data.</p>
          ) : (
            <div className="space-y-2">
              {withIssues.map(({ p, issues }) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-2 justify-between border rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name || <em>Untitled</em>}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.slug ? `/product/${p.slug}` : "no slug"}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {issues.map((i, idx) => (
                        <Badge key={idx} variant="destructive" className="text-[10px]">{i.label}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/ceo/products?edit=${p.id}`}>Fix</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
