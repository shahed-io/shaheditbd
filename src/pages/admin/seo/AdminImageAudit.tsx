import { useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ImageOff, AlertTriangle, CheckCircle2, Download, RefreshCw, Globe } from "lucide-react";
import { toast } from "sonner";

type Issue = "missing-alt" | "empty-alt" | "missing-title" | "missing-lazy" | "missing-dimensions" | "non-webp";

interface ImageIssue {
  page: string;
  src: string;
  alt: string | null;
  title: string | null;
  loading: string | null;
  width: number;
  height: number;
  issues: Issue[];
}

interface PageResult {
  url: string;
  status: "pending" | "loading" | "done" | "error";
  totalImages: number;
  issueCount: number;
  error?: string;
}

const ISSUE_LABEL: Record<Issue, string> = {
  "missing-alt": "Missing ALT",
  "empty-alt": "Empty ALT",
  "missing-title": "Missing TITLE",
  "missing-lazy": "No lazy load",
  "missing-dimensions": "No width/height",
  "non-webp": "Not WebP",
};

const ISSUE_COLOR: Record<Issue, string> = {
  "missing-alt": "bg-red-500/10 text-red-600 border-red-500/30",
  "empty-alt": "bg-orange-500/10 text-orange-600 border-orange-500/30",
  "missing-title": "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  "missing-lazy": "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "missing-dimensions": "bg-sky-500/10 text-sky-600 border-sky-500/30",
  "non-webp": "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

const DEFAULT_PAGES = [
  "/",
  "/shop",
  "/blog",
  "/help",
  "/free-tools",
  "/about",
  "/contact",
  "/refund-policy",
  "/terms",
  "/privacy",
];

export default function AdminImageAudit() {
  const [pages, setPages] = useState<PageResult[]>([]);
  const [issues, setIssues] = useState<ImageIssue[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [customUrl, setCustomUrl] = useState("");
  const [filter, setFilter] = useState<Issue | "all">("all");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build initial URL list from DB-driven content
  useEffect(() => {
    (async () => {
      const urls = new Set<string>(DEFAULT_PAGES);
      const sb: any = supabase;
      const productsRes = await sb.from("products").select("slug").eq("is_active", true).limit(30);
      const blogsRes = await sb.from("blog_posts").select("slug").eq("is_published", true).limit(30);
      const catsRes = await sb.from("categories").select("slug").limit(20);
      (productsRes.data ?? []).forEach((p: any) => p.slug && urls.add(`/product/${p.slug}`));
      (blogsRes.data ?? []).forEach((b: any) => b.slug && urls.add(`/blog/${b.slug}`));
      (catsRes.data ?? []).forEach((c: any) => c.slug && urls.add(`/shop?category=${c.slug}`));
      setPages(
        Array.from(urls).map((url) => ({
          url,
          status: "pending",
          totalImages: 0,
          issueCount: 0,
        })),
      );
    })();
  }, []);

  const scanPage = (url: string): Promise<{ images: ImageIssue[]; total: number }> => {
    return new Promise((resolve, reject) => {
      const iframe = iframeRef.current;
      if (!iframe) return reject(new Error("iframe missing"));

      const timeout = setTimeout(() => {
        iframe.onload = null;
        reject(new Error("Timeout (12s)"));
      }, 12000);

      iframe.onload = () => {
        // Give SPA time to render + lazy hydrate
        setTimeout(() => {
          try {
            const doc = iframe.contentDocument;
            if (!doc) {
              clearTimeout(timeout);
              return reject(new Error("Cannot access iframe document"));
            }
            const imgs = Array.from(doc.images);
            const results: ImageIssue[] = [];
            imgs.forEach((img) => {
              const src = img.currentSrc || img.src;
              if (!src || src.startsWith("data:")) return;
              const alt = img.getAttribute("alt");
              const title = img.getAttribute("title");
              const loading = img.getAttribute("loading");
              const w = img.naturalWidth || img.width;
              const h = img.naturalHeight || img.height;
              // skip tiny tracking pixels/icons
              if (w > 0 && w < 32 && h > 0 && h < 32) return;

              const found: Issue[] = [];
              if (alt === null) found.push("missing-alt");
              else if (alt.trim() === "") found.push("empty-alt");
              if (!title) found.push("missing-title");
              if (loading !== "lazy" && loading !== "eager") found.push("missing-lazy");
              if (!img.getAttribute("width") || !img.getAttribute("height")) found.push("missing-dimensions");
              if (!/\.webp(\?|$)/i.test(src) && !src.includes("supabase.co/storage")) found.push("non-webp");

              if (found.length > 0) {
                results.push({
                  page: url,
                  src,
                  alt,
                  title,
                  loading,
                  width: w,
                  height: h,
                  issues: found,
                });
              }
            });
            clearTimeout(timeout);
            resolve({ images: results, total: imgs.length });
          } catch (e: any) {
            clearTimeout(timeout);
            reject(e);
          }
        }, 2500);
      };

      iframe.src = url;
    });
  };

  const runScan = async (urlList?: string[]) => {
    const targets = urlList ?? pages.map((p) => p.url);
    if (targets.length === 0) return;
    setScanning(true);
    setIssues([]);
    setProgress(0);

    const allIssues: ImageIssue[] = [];
    const updated = [...pages];

    for (let i = 0; i < targets.length; i++) {
      const url = targets[i];
      const idx = updated.findIndex((p) => p.url === url);
      if (idx >= 0) updated[idx] = { ...updated[idx], status: "loading" };
      setPages([...updated]);

      try {
        const { images, total } = await scanPage(url);
        allIssues.push(...images);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            status: "done",
            totalImages: total,
            issueCount: images.length,
          };
        }
      } catch (e: any) {
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], status: "error", error: e.message };
        }
      }
      setPages([...updated]);
      setIssues([...allIssues]);
      setProgress(Math.round(((i + 1) / targets.length) * 100));
    }

    setScanning(false);
    toast.success(`Scan complete — ${allIssues.length} issues across ${targets.length} pages`);
  };

  const addCustomUrl = () => {
    const url = customUrl.trim();
    if (!url || !url.startsWith("/")) {
      toast.error("URL must start with /");
      return;
    }
    if (pages.some((p) => p.url === url)) {
      toast.error("Already in list");
      return;
    }
    setPages([...pages, { url, status: "pending", totalImages: 0, issueCount: 0 }]);
    setCustomUrl("");
  };

  const exportCsv = () => {
    const rows = [
      ["Page", "Image Src", "ALT", "Title", "Loading", "Width", "Height", "Issues"].join(","),
      ...issues.map((i) =>
        [
          `"${i.page}"`,
          `"${i.src}"`,
          `"${(i.alt ?? "").replace(/"/g, '""')}"`,
          `"${(i.title ?? "").replace(/"/g, '""')}"`,
          `"${i.loading ?? ""}"`,
          i.width,
          i.height,
          `"${i.issues.join("; ")}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `image-seo-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const stats = useMemo(() => {
    const s: Record<Issue, number> = {
      "missing-alt": 0,
      "empty-alt": 0,
      "missing-title": 0,
      "missing-lazy": 0,
      "missing-dimensions": 0,
      "non-webp": 0,
    };
    issues.forEach((i) => i.issues.forEach((iss) => s[iss]++));
    return s;
  }, [issues]);

  const totalImages = pages.reduce((acc, p) => acc + p.totalImages, 0);
  const scannedPages = pages.filter((p) => p.status === "done").length;

  const filteredIssues = filter === "all" ? issues : issues.filter((i) => i.issues.includes(filter));

  useEffect(() => { document.title = "Image SEO Audit — Admin"; }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">


      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageOff className="h-6 w-6" /> Image SEO Audit
          </h1>
          <p className="text-sm text-muted-foreground">
            Crawls public pages and finds images missing ALT, TITLE, lazy load, or dimensions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runScan()} disabled={scanning || pages.length === 0}>
            {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Scan All Pages
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={issues.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {scanning && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Scanning... {progress}%</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pages</p>
            <p className="text-2xl font-bold">{scannedPages}/{pages.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Images</p>
            <p className="text-2xl font-bold">{totalImages}</p>
          </CardContent>
        </Card>
        {(Object.keys(stats) as Issue[]).map((k) => (
          <Card
            key={k}
            className={`cursor-pointer transition ${filter === k ? "ring-2 ring-primary" : ""}`}
            onClick={() => setFilter(filter === k ? "all" : k)}
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{ISSUE_LABEL[k]}</p>
              <p className="text-2xl font-bold">{stats[k]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues ({filteredIssues.length})</TabsTrigger>
          <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-2">
          {filter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
              Clear filter: {ISSUE_LABEL[filter]}
            </Button>
          )}
          {filteredIssues.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {issues.length === 0 ? "Run a scan to see image issues." : "No issues match this filter."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredIssues.slice(0, 500).map((i, idx) => (
                <Card key={idx}>
                  <CardContent className="p-3 flex gap-3 items-start">
                    <img
                      src={i.src}
                      alt=""
                      className="w-16 h-16 object-cover rounded bg-muted flex-shrink-0"
                      loading="lazy"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {i.issues.map((iss) => (
                          <Badge key={iss} variant="outline" className={`text-xs ${ISSUE_COLOR[iss]}`}>
                            {ISSUE_LABEL[iss]}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs font-mono truncate text-muted-foreground">{i.src}</p>
                      <p className="text-xs">
                        <span className="text-muted-foreground">Page:</span> {i.page} •{" "}
                        <span className="text-muted-foreground">ALT:</span>{" "}
                        {i.alt === null ? <em className="text-red-600">null</em> : i.alt || <em>empty</em>} •{" "}
                        <span className="text-muted-foreground">Size:</span> {i.width}×{i.height}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredIssues.length > 500 && (
                <p className="text-xs text-center text-muted-foreground">
                  Showing first 500 of {filteredIssues.length}. Export CSV for full list.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pages" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" /> Add URL
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="/some-page"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomUrl()}
              />
              <Button onClick={addCustomUrl}>Add</Button>
            </CardContent>
          </Card>

          <div className="space-y-1">
            {pages.map((p) => (
              <div
                key={p.url}
                className="flex items-center justify-between gap-2 p-2 rounded border bg-card text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {p.status === "loading" && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  {p.status === "done" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  {p.status === "error" && <AlertTriangle className="h-3 w-3 text-red-500" />}
                  <span className="font-mono truncate">{p.url}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.status === "done" && (
                    <>
                      <Badge variant="outline" className="text-xs">{p.totalImages} imgs</Badge>
                      {p.issueCount > 0 ? (
                        <Badge variant="destructive" className="text-xs">{p.issueCount} issues</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">OK</Badge>
                      )}
                    </>
                  )}
                  {p.status === "error" && (
                    <span className="text-xs text-red-500 truncate max-w-[200px]">{p.error}</span>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => runScan([p.url])} disabled={scanning}>
                    Scan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden iframe for scanning */}
      <iframe
        ref={iframeRef}
        title="scanner"
        className="fixed -left-[9999px] top-0 w-[1280px] h-[800px] opacity-0 pointer-events-none"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
