import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event_name, event_source_url, user_data, custom_data, test_event_code } = body;

    // Load pixel settings from DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('category', 'facebook_pixel');

    const map: Record<string, string> = {};
    (settings || []).forEach((r: any) => { map[r.key] = r.value || ''; });

    const pixelId   = map['fb_pixel_id'];
    const capiToken = map['fb_capi_token'];
    const capiEnabled = map['fb_capi_enabled'] === 'true';

    if (!pixelId || !capiToken || !capiEnabled) {
      return new Response(JSON.stringify({ success: false, error: 'CAPI not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Build payload
    const eventData: Record<string, any> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
    };

    if (event_source_url) eventData.event_source_url = event_source_url;
    if (user_data)        eventData.user_data = user_data;
    if (custom_data)      eventData.custom_data = custom_data;

    const payload: Record<string, any> = {
      data: [eventData],
    };

    const testCode = test_event_code || map['fb_capi_test_code'];
    if (testCode) payload.test_event_code = testCode;

    // Send to Facebook CAPI
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      console.error('Facebook CAPI error:', fbData);
      return new Response(JSON.stringify({ success: false, error: fbData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, events_received: fbData.events_received }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('CAPI function error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
