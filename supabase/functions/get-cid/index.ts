import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const GRAHOK_API_TOKEN = Deno.env.get('GRAHOK_API_TOKEN');
  if (!GRAHOK_API_TOKEN) {
    return new Response(JSON.stringify({ error: 'API token not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, installation_id } = await req.json();

    if (action === 'balance') {
      const res = await fetch(`https://grahok.io/api/balance.php?token=${GRAHOK_API_TOKEN}`);
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'getcid') {
      if (!installation_id || installation_id.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Installation ID is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const formData = new FormData();
      formData.append('token', GRAHOK_API_TOKEN);
      formData.append('installation_id', installation_id.trim());

      const res = await fetch('https://grahok.io/api/getcid.php', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
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
