import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: uerr } = await userClient.auth.getUser();
    if (uerr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    const initialCredit = parseInt(body.initial_credit ?? '0', 10) || 0;
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists by email
    const { data: existingProfile } = await admin
      .from('profiles').select('user_id').eq('email', email).maybeSingle();

    let userId: string;
    let created = false;

    if (existingProfile) {
      userId = existingProfile.user_id;
    } else {
      // Create new auth user (auto-confirmed so they can log in immediately)
      const { data: createdUser, error: cerr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: name },
      });
      if (cerr || !createdUser.user) {
        return new Response(JSON.stringify({ error: cerr?.message || 'Failed to create user' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = createdUser.user.id;
      created = true;

      // Ensure profile fields
      await admin.from('profiles').update({
        display_name: name,
        email,
        ...(phone ? { phone } : {}),
      }).eq('user_id', userId);
    }

    // Assign initial credit if any
    let newBalance = 0;
    if (initialCredit > 0) {
      const { data: adj, error: aerr } = await admin.rpc('admin_adjust_cid_balance', {
        p_user_id: userId,
        p_delta: initialCredit,
        p_note: created ? 'Initial credit on account creation' : 'Credit added by admin (existing user)',
      });
      // RPC checks auth.uid() — service role bypasses; instead do direct upsert
      if (aerr || !(adj as any)?.success) {
        // Fallback: direct upsert into cid_balances + log adjustment
        const { data: existing } = await admin.from('cid_balances')
          .select('balance, total_added, total_used').eq('user_id', userId).maybeSingle();
        if (existing) {
          newBalance = (existing.balance || 0) + initialCredit;
          await admin.from('cid_balances').update({
            balance: newBalance,
            total_added: (existing.total_added || 0) + initialCredit,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
        } else {
          newBalance = initialCredit;
          await admin.from('cid_balances').insert({
            user_id: userId, balance: initialCredit, total_added: initialCredit, total_used: 0,
          });
        }
        await admin.from('cid_balance_adjustments').insert({
          user_id: userId, delta: initialCredit, balance_after: newBalance,
          note: created ? 'Initial credit on account creation' : 'Credit added by admin',
          adjusted_by: userData.user.id,
        });
        await admin.from('notifications').insert({
          user_id: userId,
          title: '🎁 CID Credit পেয়েছেন!',
          message: `অ্যাডমিন আপনার অ্যাকাউন্টে ${initialCredit} টি CID যোগ করেছেন।`,
          type: 'promo', is_read: false,
        });
      } else {
        newBalance = (adj as any).new_balance;
      }
    }

    // Send credentials email to the new user (only if newly created)
    let emailSent = false;
    if (created) {
      try {
        const { error: emailErr } = await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'cid-account-credentials',
            recipientEmail: email,
            idempotencyKey: `cid-credentials-${userId}`,
            templateData: {
              customerName: name,
              email,
              password,
              initialCredit,
              loginUrl: 'https://shahedstore.com.bd/get-cid',
            },
          },
        });
        if (!emailErr) emailSent = true;
      } catch (_e) {
        // Non-fatal — account already created
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      created,
      email,
      balance: newBalance,
      email_sent: emailSent,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
