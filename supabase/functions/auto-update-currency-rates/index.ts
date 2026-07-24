// Fetches live FX rates and updates every currency's rate_per_usd + rate_from_bdt.
// Public endpoint — admin-triggered from the panel. Uses open.er-api.com (free, no key).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Fetch live USD-based rates
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error(`FX API failed: ${res.status}`);
    const fx = await res.json();
    const rates: Record<string, number> = fx?.rates || {};
    if (!rates.USD) throw new Error("Invalid FX response");

    // 2. Read USD -> BDT (prefer live BDT, fallback to stored setting)
    let usdToBdt = Number(rates.BDT);
    if (!isFinite(usdToBdt) || usdToBdt <= 0) {
      const { data: s } = await supabase
        .from("site_settings").select("value").eq("key", "usd_to_bdt_rate").maybeSingle();
      usdToBdt = Number(s?.value ?? 120);
    } else {
      await supabase.from("site_settings")
        .upsert({ key: "usd_to_bdt_rate", value: usdToBdt as any }, { onConflict: "key" });
    }

    // 3. Update every non-BDT currency whose code exists in the FX feed
    const { data: currencies, error: cErr } = await supabase
      .from("currencies").select("id, code");
    if (cErr) throw cErr;

    let updated = 0;
    const missing: string[] = [];
    for (const c of currencies || []) {
      if (c.code === "BDT") continue;
      const rpu = Number(rates[c.code]);
      if (!isFinite(rpu) || rpu <= 0) { missing.push(c.code); continue; }
      const rateFromBdt = usdToBdt / rpu;
      const { error } = await supabase.from("currencies")
        .update({ rate_per_usd: rpu, rate_from_bdt: rateFromBdt }).eq("id", c.id);
      if (!error) updated++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        usd_to_bdt: usdToBdt,
        updated_count: updated,
        missing_codes: missing,
        source: "open.er-api.com",
        updated_at: fx?.time_last_update_utc || new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: String((e as Error).message || e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
