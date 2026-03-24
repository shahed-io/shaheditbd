import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const GRAHOK_API_TOKEN = Deno.env.get('GRAHOK_API_TOKEN');
  if (!GRAHOK_API_TOKEN) {
    return new Response(JSON.stringify({ error: 'API token not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const API_URL     = 'https://grahok.io/api/getcid.php';
  const BALANCE_URL = 'https://grahok.io/api/balance.php';

  try {
    const { action, installation_id } = await req.json();

    // ── Balance: GET with token in query string ──────────────────────────────
    if (action === 'balance') {
      const url = `${BALANCE_URL}?token=${encodeURIComponent(GRAHOK_API_TOKEN)}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      const text = await res.text();
      let data: Record<string, unknown> = {};

      try { data = JSON.parse(text); } catch {
        // Plain text fallback (e.g. "Balance: 2")
        const match = text.match(/([0-9]+(?:\.[0-9]+)?)/);
        data = { balance: match ? parseFloat(match[1]) : null, raw: text };
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Get CID: POST with X-API-TOKEN header ────────────────────────────────
    if (action === 'getcid') {
      if (!installation_id || String(installation_id).trim().length < 4) {
        return new Response(JSON.stringify({ error: 'Installation ID too short' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Normalize whitespace (same as PHP)
      const iid = String(installation_id).trim().replace(/\s+/g, ' ');

      const formData = new FormData();
      formData.append('installation_id', iid);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'X-API-TOKEN': GRAHOK_API_TOKEN,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const text = await res.text();
      let data: Record<string, unknown> = {};

      try { data = JSON.parse(text); } catch {
        return new Response(JSON.stringify({ error: 'Upstream did not return JSON', raw: text }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!data['cid']) {
        return new Response(JSON.stringify({
          error: (data['error'] as string) || 'No CID in response',
          raw: text,
        }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
