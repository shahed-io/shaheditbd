import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event_name, event_source_url, user_data, custom_data, pixels, pixel_id, capi_token, test_event_code } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Enrich user data with IP and UA
    const enrichedUserData: Record<string, any> = { ...(user_data || {}) };
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || req.headers.get('cf-connecting-ip')
      || '0.0.0.0';
    if (!enrichedUserData.client_ip_address) enrichedUserData.client_ip_address = clientIp;
    if (!enrichedUserData.client_user_agent) enrichedUserData.client_user_agent = req.headers.get('user-agent') || '';

    const eventData: Record<string, any> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: enrichedUserData,
    };
    if (event_source_url) eventData.event_source_url = event_source_url;
    if (custom_data) eventData.custom_data = custom_data;

    // Determine which pixels to send to
    let pixelTargets: { pixel_id: string; token: string; test_code?: string }[] = [];

    if (pixels && Array.isArray(pixels)) {
      // Multi-pixel mode: load tokens from DB config
      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'facebook_pixel');

      const map: Record<string, string> = {};
      (settings || []).forEach((r: any) => { map[r.key] = r.value || ''; });

      let allConfigs: any[] = [];
      if (map['fb_pixels_config']) {
        try { allConfigs = JSON.parse(map['fb_pixels_config']); } catch {}
      }

      for (const p of pixels) {
        const cfg = allConfigs.find((c: any) => c.pixel_id === p.pixel_id);
        if (cfg && cfg.capi_enabled && cfg.capi_token) {
          pixelTargets.push({
            pixel_id: cfg.pixel_id,
            token: cfg.capi_token,
            test_code: p.test_event_code || cfg.capi_test_event_code,
          });
        }
      }
    } else if (pixel_id && capi_token) {
      // Direct mode (test from admin)
      pixelTargets.push({ pixel_id, token: capi_token, test_code: test_event_code });
    } else {
      // Legacy single-pixel fallback
      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'facebook_pixel');

      const map: Record<string, string> = {};
      (settings || []).forEach((r: any) => { map[r.key] = r.value || ''; });

      if (map['fb_pixel_id'] && map['fb_capi_token'] && map['fb_capi_enabled'] === 'true') {
        pixelTargets.push({
          pixel_id: map['fb_pixel_id'],
          token: map['fb_capi_token'],
          test_code: test_event_code || map['fb_capi_test_code'],
        });
      }
    }

    if (pixelTargets.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No CAPI pixels configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send events to all target pixels in parallel
    const results = await Promise.allSettled(
      pixelTargets.map(async (target) => {
        const payload: Record<string, any> = { data: [eventData] };
        if (target.test_code) payload.test_event_code = target.test_code;

        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${target.pixel_id}/events?access_token=${target.token}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const fbData = await fbRes.json();
        if (!fbRes.ok) {
          console.error(`CAPI error for pixel ${target.pixel_id}:`, fbData);
          return { pixel_id: target.pixel_id, success: false, error: fbData };
        }
        return { pixel_id: target.pixel_id, success: true, events_received: fbData.events_received };
      })
    );

    const summary = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { pixel_id: pixelTargets[i].pixel_id, success: false, error: String(r.reason) }
    );

    return new Response(JSON.stringify({ success: true, results: summary }), {
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
