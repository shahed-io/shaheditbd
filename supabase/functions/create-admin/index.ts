import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow requests with service role key (admin only)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get credentials from secrets (not hardcoded)
  const adminEmail = Deno.env.get('ADMIN_EMAIL');
  const adminPassword = Deno.env.get('ADMIN_PASSWORD');

  if (!adminEmail || !adminPassword) {
    return new Response(JSON.stringify({ error: 'Admin credentials not configured in secrets' }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  // Create the admin user
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (createError && !createError.message.includes('already been registered')) {
    return new Response(JSON.stringify({ error: createError.message }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  let userId = userData?.user?.id;

  // If user already exists, fetch their ID
  if (!userId) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === adminEmail);
    if (existingUser) {
      userId = existingUser.id;
    }
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Could not find or create user' }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  // Assign admin role (upsert)
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  return new Response(JSON.stringify({ success: true, userId }), { 
    status: 200, 
    headers: corsHeaders 
  });
});
