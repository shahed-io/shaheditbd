import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create the admin user
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: 'info.shahedit@gmail.com',
    password: '1234@Shahed',
    email_confirm: true,
  });

  if (createError && !createError.message.includes('already been registered')) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
  }

  let userId = userData?.user?.id;

  // If user already exists, fetch their ID
  if (!userId) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === 'info.shahedit@gmail.com');
    if (existingUser) {
      userId = existingUser.id;
      // Update password
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: '1234@Shahed' });
    }
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Could not find or create user' }), { status: 400 });
  }

  // Assign admin role (upsert)
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, userId }), { status: 200 });
});
