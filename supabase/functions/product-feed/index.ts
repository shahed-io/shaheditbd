// Google Merchant Center product feed (RSS 2.0 + g: namespace)
// Public endpoint. Serves live XML built from the products table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://shahedit.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function xmlEscape(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(s: unknown): string {
  if (!s) return "";
  return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function absoluteImage(url: string | null | undefined): string {
  if (!url) return "";
  const u = String(url).trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return SITE + u;
  return SITE + "/" + u;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: products, error } = await supabase
      .from("products")
      .select("id,name,slug,description,short_description,price,original_price,image_url,images,brand,stock_quantity,status")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const items = (products ?? []).map((p: any) => {
      const link = `${SITE}/product/${p.slug ?? p.id}`;
      const imgs: string[] = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
      const mainImg = absoluteImage(p.image_url || imgs[0]);
      const extraImgs = imgs
        .map((u) => absoluteImage(u))
        .filter((u) => u && u !== mainImg)
        .slice(0, 10);
      const price = Number(p.price ?? 0).toFixed(2);
      const desc = stripHtml(p.description || p.short_description || p.name);
      const inStock = (p.stock_quantity == null || Number(p.stock_quantity) > 0);
      const availability = inStock ? "in_stock" : "out_of_stock";
      const brand = p.brand?.trim?.() || "Shahed IT";

      return `    <item>
      <g:id>${xmlEscape(p.id)}</g:id>
      <g:title>${xmlEscape(p.name)}</g:title>
      <g:description>${xmlEscape(desc || p.name)}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(mainImg)}</g:image_link>
${extraImgs.map((u) => `      <g:additional_image_link>${xmlEscape(u)}</g:additional_image_link>`).join("\n")}
      <g:price>${price} BDT</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${xmlEscape(brand)}</g:brand>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Shahed IT — Google Shopping Feed</title>
    <link>${SITE}</link>
    <description>Digital software and license keys for Bangladesh.</description>
${items.join("\n")}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...cors,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (e) {
    console.error("product-feed error", e);
    return new Response(`<?xml version="1.0"?><error>${xmlEscape((e as Error).message)}</error>`, {
      status: 500,
      headers: { ...cors, "Content-Type": "application/xml" },
    });
  }
});
