// TikTok Events API (server-side conversion tracking)
// Mirrors browser pixel events to TikTok's Events API for higher accuracy
// when ad blockers / iOS tracking restrictions limit the client pixel.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccountConfig {
  pixel_id: string;
  access_token: string;
  test_event_code?: string;
}

interface RequestBody {
  event_name: string;
  event_source_url?: string;
  accounts: AccountConfig[];
  user_data?: Record<string, any>;
  custom_data?: Record<string, any>;
  event_id?: string;
}

const sha256Hex = async (input: string): Promise<string> => {
  const buf = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    if (!body?.event_name || !Array.isArray(body.accounts) || body.accounts.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hash PII for privacy (TikTok requires SHA-256 hashed user identifiers)
    const userData: Record<string, any> = { ...(body.user_data || {}) };
    if (userData.email && typeof userData.email === 'string') {
      userData.email = await sha256Hex(userData.email);
    }
    if (userData.phone && typeof userData.phone === 'string') {
      userData.phone = await sha256Hex(userData.phone.replace(/\D/g, ''));
    }

    const eventId = body.event_id || `${body.event_name}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const eventTime = Math.floor(Date.now() / 1000);

    const results: any[] = [];

    for (const acc of body.accounts) {
      if (!acc.pixel_id || !acc.access_token) continue;

      const payload = {
        event_source: 'web',
        event_source_id: acc.pixel_id,
        data: [{
          event: body.event_name,
          event_time: eventTime,
          event_id: eventId,
          user: userData,
          properties: body.custom_data || {},
          page: body.event_source_url ? { url: body.event_source_url } : undefined,
        }],
        ...(acc.test_event_code ? { test_event_code: acc.test_event_code } : {}),
      };

      try {
        const r = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Token': acc.access_token,
          },
          body: JSON.stringify(payload),
        });
        const json = await r.json().catch(() => ({}));
        results.push({ pixel_id: acc.pixel_id, status: r.status, response: json });
      } catch (err: any) {
        results.push({ pixel_id: acc.pixel_id, error: String(err?.message || err) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
