// Convert offer/giveaway submissions into customer accounts.
// For each unique email: invite via auth.admin (sends invite email so user sets password),
// or link to existing user if already registered. Marks submission as converted.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Body {
  offer_id: string;
  submission_ids?: string[]; // optional subset; if missing convert all unconverted
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Auth: must be admin
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: roleData } = await admin
      .from('user_roles').select('role')
      .eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return json({ error: 'Forbidden' }, 403);

    const body = (await req.json()) as Body;
    if (!body.offer_id) return json({ error: 'offer_id required' }, 400);

    // Load submissions
    let q = admin.from('offer_submissions')
      .select('id, participant_email, participant_name, participant_phone, converted_to_customer, customer_user_id')
      .eq('offer_id', body.offer_id);
    if (body.submission_ids && body.submission_ids.length > 0) {
      q = q.in('id', body.submission_ids);
    }
    const { data: subs, error: subErr } = await q;
    if (subErr) throw subErr;

    const redirectTo = `${new URL(req.url).origin.replace(/^https?:\/\/[^.]+\.functions\./, 'https://')}`;
    // Better: use SITE_URL env if set
    const siteUrl = Deno.env.get('SITE_URL') || 'https://shahedstore.com.bd';
    const inviteRedirect = `${siteUrl}/reset-password`;

    const results = {
      total: subs?.length || 0,
      invited: 0,        // brand new users invited
      linked_existing: 0, // already had account, just linked
      skipped: 0,        // no email or already converted
      failed: 0,
      errors: [] as Array<{ submission_id: string; email: string | null; error: string }>,
    };

    // De-duplicate by email so we don't double-invite
    const processedEmails = new Map<string, string>(); // email -> user_id

    for (const s of subs || []) {
      const email = (s.participant_email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.skipped++;
        continue;
      }
      if (s.converted_to_customer && s.customer_user_id) {
        results.skipped++;
        continue;
      }

      try {
        let userId = processedEmails.get(email);
        let wasNew = false;

        if (!userId) {
          // Try invite first
          const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
            redirectTo: inviteRedirect,
            data: {
              display_name: s.participant_name || undefined,
              phone: s.participant_phone || undefined,
              source: 'offer_giveaway',
              offer_id: body.offer_id,
            },
          });

          if (invErr) {
            const msg = (invErr.message || '').toLowerCase();
            const alreadyExists = msg.includes('already') || msg.includes('registered') || (invErr as any).status === 422;
            if (alreadyExists) {
              // Look up existing user by email
              const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
              const existing = list?.users?.find((x) => (x.email || '').toLowerCase() === email);
              if (existing) {
                userId = existing.id;
                processedEmails.set(email, userId);
                results.linked_existing++;
              } else {
                throw invErr;
              }
            } else {
              throw invErr;
            }
          } else if (invited?.user) {
            userId = invited.user.id;
            processedEmails.set(email, userId);
            wasNew = true;
            results.invited++;
          }
        } else {
          // Already invited in this batch
          results.linked_existing++;
        }

        if (!userId) throw new Error('no user id returned');

        // Ensure profile has phone/name (trigger usually creates baseline)
        try {
          await admin.from('profiles').update({
            display_name: s.participant_name || undefined,
            phone: s.participant_phone || undefined,
            email,
          }).eq('user_id', userId);
        } catch (_) { /* non-fatal */ }

        await admin.from('offer_submissions').update({
          converted_to_customer: true,
          customer_user_id: userId,
          converted_at: new Date().toISOString(),
          user_id: userId,
        }).eq('id', s.id);
      } catch (e) {
        results.failed++;
        results.errors.push({
          submission_id: s.id,
          email,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return json({ success: true, results });
  } catch (e) {
    console.error('convert-submissions error:', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
