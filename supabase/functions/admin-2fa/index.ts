// Admin 2FA (Google Authenticator / TOTP) edge function
// Handles: status, setup, enable, verify-login, validate-session, disable, logout
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as OTPAuth from "https://esm.sh/otpauth@9.3.2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ISSUER = "Shahed Store Admin";
const DEFAULT_SESSION_TTL_HOURS = 12;
const DEFAULT_REMEMBER_TTL_DAYS = 30;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function generateSecret(): string {
  // 20 random bytes → base32 (TOTP standard)
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  bytes.forEach((b) => (bits += b.toString(2).padStart(8, "0")));
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += ALPHA[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const b = crypto.getRandomValues(new Uint8Array(5));
    let s = "";
    for (const x of b) s += x.toString(16).padStart(2, "0");
    codes.push(s.slice(0, 4) + "-" + s.slice(4, 8));
  }
  return codes;
}

function generateSessionToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function verifyTotp(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: "admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  // ±2 window (~150s tolerance) to handle device/server clock drift
  const delta = totp.validate({ token: code, window: 2 });
  return delta !== null;
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function generateEmailCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

const BodySchema = z.object({
  action: z.enum([
    "status",
    "setup",
    "enable",
    "verify-login",
    "validate-session",
    "disable",
    "logout",
    "send-email-otp",
    "reset",
    "regenerate-backup-codes",
    "get-config",
    "update-config",
  ]),
  code: z.string().trim().optional(),
  token: z.string().trim().optional(),
  remember: z.boolean().optional(),
  config: z.object({
    session_ttl_hours: z.number().int().min(1).max(720).optional(),
    remember_device_ttl_days: z.number().int().min(1).max(365).optional(),
    allow_remember_device: z.boolean().optional(),
  }).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    // Validate user JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    // Verify admin role
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admin access required" }, 403);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { action, code, token, remember, config } = parsed.data;

    // Helper: load (or default) admin 2FA config
    const loadConfig = async () => {
      const { data } = await admin
        .from("admin_2fa_config")
        .select("session_ttl_hours, remember_device_ttl_days, allow_remember_device")
        .eq("id", 1)
        .maybeSingle();
      return {
        session_ttl_hours: data?.session_ttl_hours ?? DEFAULT_SESSION_TTL_HOURS,
        remember_device_ttl_days: data?.remember_device_ttl_days ?? DEFAULT_REMEMBER_TTL_DAYS,
        allow_remember_device: data?.allow_remember_device ?? true,
      };
    };

    const computeExpiresAt = async (rememberFlag?: boolean) => {
      const cfg = await loadConfig();
      const useRemember = !!rememberFlag && cfg.allow_remember_device;
      const ms = useRemember
        ? cfg.remember_device_ttl_days * 24 * 3600 * 1000
        : cfg.session_ttl_hours * 3600 * 1000;
      return {
        expiresAt: new Date(Date.now() + ms).toISOString(),
        remembered: useRemember,
        ttlHours: useRemember ? cfg.remember_device_ttl_days * 24 : cfg.session_ttl_hours,
      };
    };

    // ─── get-config ───
    if (action === "get-config") {
      return json(await loadConfig());
    }

    // ─── update-config ───
    if (action === "update-config") {
      if (!config) return json({ error: "config required" }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (config.session_ttl_hours !== undefined) patch.session_ttl_hours = config.session_ttl_hours;
      if (config.remember_device_ttl_days !== undefined) patch.remember_device_ttl_days = config.remember_device_ttl_days;
      if (config.allow_remember_device !== undefined) patch.allow_remember_device = config.allow_remember_device;
      const { error } = await admin
        .from("admin_2fa_config")
        .upsert({ id: 1, ...patch }, { onConflict: "id" });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, config: await loadConfig() });
    }

    // ─── status ───
    if (action === "status") {
      const { data } = await admin
        .from("admin_2fa")
        .select("enabled")
        .eq("user_id", userId)
        .maybeSingle();
      return json({ enabled: !!data?.enabled });
    }

    // ─── setup: generate (or regenerate) pending secret ───
    if (action === "setup") {
      const { data: existing } = await admin
        .from("admin_2fa")
        .select("enabled")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing?.enabled) {
        return json({ error: "2FA already enabled. Disable first to re-enroll." }, 400);
      }
      const secret = generateSecret();
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(
        userData.user.email ?? "admin",
      )}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=30`;

      await admin
        .from("admin_2fa")
        .upsert({ user_id: userId, secret, enabled: false, backup_codes: [] }, { onConflict: "user_id" });

      return json({ secret, otpauthUrl });
    }

    // ─── enable: confirm TOTP code, switch on ───
    if (action === "enable") {
      if (!code) return json({ error: "Code required" }, 400);
      const { data: row } = await admin
        .from("admin_2fa")
        .select("secret, enabled")
        .eq("user_id", userId)
        .maybeSingle();
      if (!row) return json({ error: "Run setup first" }, 400);
      if (row.enabled) return json({ error: "Already enabled" }, 400);
      if (!verifyTotp(row.secret, code)) return json({ error: "Invalid code" }, 400);

      const backupCodes = generateBackupCodes();
      await admin
        .from("admin_2fa")
        .update({
          enabled: true,
          verified_at: new Date().toISOString(),
          backup_codes: backupCodes,
        })
        .eq("user_id", userId);

      // Also issue a session token so the user isn't immediately bounced to login
      const sessionToken = generateSessionToken();
      const { expiresAt, remembered } = await computeExpiresAt(remember);
      await admin.from("admin_2fa_sessions").insert({
        user_id: userId,
        token: sessionToken,
        user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        expires_at: expiresAt,
      });

      return json({ success: true, backupCodes, token: sessionToken, expiresAt, remembered });
    }

    // ─── send-email-otp: generate code and email it to ALL admin emails ───
    if (action === "send-email-otp") {
      // Generate 6-digit code, hash it, store
      const otpCode = generateEmailCode();
      const hash = await sha256(otpCode);
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

      // Invalidate previous unused codes for this user
      await admin
        .from("admin_email_otps")
        .update({ used_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("used_at", null);

      await admin.from("admin_email_otps").insert({
        user_id: userId,
        code_hash: hash,
        expires_at: expires,
        ip,
      });

      // Look up ALL admin user_ids → emails (from profiles, fallback to auth)
      const { data: adminRoles } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = (adminRoles ?? []).map((r: { user_id: string }) => r.user_id);
      const recipientEmails = new Set<string>();

      if (adminIds.length) {
        const { data: profs } = await admin
          .from("profiles")
          .select("user_id, email")
          .in("user_id", adminIds);
        for (const p of profs ?? []) {
          if (p?.email) recipientEmails.add(String(p.email).toLowerCase());
        }
      }
      // Always include the requesting admin's email as a guarantee
      if (userData.user.email) recipientEmails.add(userData.user.email.toLowerCase());

      // Fan out via send-transactional-email
      const requestedByEmail = userData.user.email ?? "unknown";
      const sendPromises = Array.from(recipientEmails).map((to) =>
        admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "admin-2fa-code",
            recipientEmail: to,
            templateData: {
              code: otpCode,
              requestedByEmail,
              ip: ip ?? "",
              expiresInMinutes: 10,
            },
          },
        }).catch((e) => ({ error: e }))
      );
      const results = await Promise.all(sendPromises);
      const sentCount = results.filter((r: any) => !r?.error).length;

      console.log(`[admin-2fa] email OTP sent to ${sentCount}/${recipientEmails.size} admins for ${requestedByEmail}`);

      return json({
        success: true,
        sentTo: sentCount,
        totalAdmins: recipientEmails.size,
        expiresAt: expires,
      });
    }

    // ─── verify-login: TOTP, backup, OR email OTP → issue session token ───
    if (action === "verify-login") {
      if (!code) return json({ error: "Code required" }, 400);

      const cleaned = code.replace(/\s+/g, "");
      let ok = false;
      let usedBackup: string | null = null;
      let usedEmailOtpId: string | null = null;

      // Try TOTP / backup first (only if 2FA enabled)
      const { data: row } = await admin
        .from("admin_2fa")
        .select("secret, enabled, backup_codes")
        .eq("user_id", userId)
        .maybeSingle();

      if (row?.enabled) {
        if (/^\d{6}$/.test(cleaned)) {
          ok = verifyTotp(row.secret, cleaned);
        }
        if (!ok && row.backup_codes?.includes(cleaned.toLowerCase())) {
          ok = true;
          usedBackup = cleaned.toLowerCase();
        }
      }

      // Fallback: email OTP (works even without TOTP enabled)
      if (!ok && /^\d{6}$/.test(cleaned)) {
        const hash = await sha256(cleaned);
        const { data: otpRow } = await admin
          .from("admin_email_otps")
          .select("id, expires_at, used_at, attempts")
          .eq("user_id", userId)
          .eq("code_hash", hash)
          .is("used_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (otpRow) {
          ok = true;
          usedEmailOtpId = otpRow.id;
        }
      }

      if (!ok) return json({ error: "Invalid or expired code" }, 400);

      // Consume backup code
      if (usedBackup && row) {
        const remaining = (row.backup_codes ?? []).filter((c: string) => c !== usedBackup);
        await admin.from("admin_2fa").update({ backup_codes: remaining }).eq("user_id", userId);
      }
      // Consume email OTP
      if (usedEmailOtpId) {
        await admin.from("admin_email_otps")
          .update({ used_at: new Date().toISOString() })
          .eq("id", usedEmailOtpId);
      }

      // Issue session token
      const sessionToken = generateSessionToken();
      const { expiresAt, remembered } = await computeExpiresAt(remember);

      await admin.from("admin_2fa_sessions").insert({
        user_id: userId,
        token: sessionToken,
        user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        expires_at: expiresAt,
      });

      if (row?.enabled) {
        await admin.from("admin_2fa").update({ last_used_at: new Date().toISOString() }).eq("user_id", userId);
      }

      // Cleanup expired
      await admin
        .from("admin_2fa_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .eq("user_id", userId);

      return json({ success: true, token: sessionToken, expiresAt, remembered, usedBackup: !!usedBackup });
    }

    // ─── validate-session ───
    if (action === "validate-session") {
      if (!token) return json({ valid: false });
      const { data } = await admin
        .from("admin_2fa_sessions")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      return json({ valid: !!data });
    }

    // ─── disable (requires current TOTP code) ───
    if (action === "disable") {
      if (!code) return json({ error: "Code required" }, 400);
      const { data: row } = await admin
        .from("admin_2fa")
        .select("secret, enabled, backup_codes")
        .eq("user_id", userId)
        .maybeSingle();
      if (!row || !row.enabled) return json({ error: "2FA not enabled" }, 400);

      const cleaned = code.replace(/\s+/g, "");
      const ok =
        (/^\d{6}$/.test(cleaned) && verifyTotp(row.secret, cleaned)) ||
        (row.backup_codes ?? []).includes(cleaned.toLowerCase());
      if (!ok) return json({ error: "Invalid code" }, 400);

      await admin.from("admin_2fa").delete().eq("user_id", userId);
      await admin.from("admin_2fa_sessions").delete().eq("user_id", userId);
      return json({ success: true });
    }

    // ─── reset: wipe TOTP secret so admin can re-enroll (requires valid 2FA session OR email OTP code) ───
    if (action === "reset") {
      // Auth path A: caller has a valid admin_2fa_sessions token (passed login already)
      let authorized = false;
      if (token) {
        const { data: sess } = await admin
          .from("admin_2fa_sessions")
          .select("expires_at")
          .eq("user_id", userId)
          .eq("token", token)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();
        if (sess) authorized = true;
      }
      // Auth path B: caller supplies a fresh email OTP code (6 digits) OR a backup code (xxxx-xxxx)
      if (!authorized && code) {
        const cleaned = code.replace(/\s+/g, "");
        // B1: numeric 6-digit email OTP
        if (/^\d{6}$/.test(cleaned)) {
          const hash = await sha256(cleaned);
          const { data: otpRow } = await admin
            .from("admin_email_otps")
            .select("id")
            .eq("user_id", userId)
            .eq("code_hash", hash)
            .is("used_at", null)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (otpRow) {
            authorized = true;
            await admin.from("admin_email_otps")
              .update({ used_at: new Date().toISOString() })
              .eq("id", otpRow.id);
          }
        }
        // B2: backup code (consume it on success)
        if (!authorized) {
          const { data: row2 } = await admin
            .from("admin_2fa")
            .select("backup_codes")
            .eq("user_id", userId)
            .maybeSingle();
          const lower = cleaned.toLowerCase();
          if (row2?.backup_codes?.includes(lower)) {
            authorized = true;
            const remaining = (row2.backup_codes ?? []).filter((c: string) => c !== lower);
            await admin.from("admin_2fa").update({ backup_codes: remaining }).eq("user_id", userId);
          }
        }
      }
      if (!authorized) {
        return json({ error: "Verification required. Provide a backup code, email code, or valid session." }, 401);
      }

      await admin.from("admin_2fa").delete().eq("user_id", userId);
      // Keep current sessions alive so admin doesn't get bounced while re-enrolling
      return json({ success: true });
    }

    // ─── regenerate-backup-codes: issue 8 fresh codes (requires valid 2FA session, TOTP, or email OTP) ───
    if (action === "regenerate-backup-codes") {
      const { data: row } = await admin
        .from("admin_2fa")
        .select("secret, enabled")
        .eq("user_id", userId)
        .maybeSingle();
      if (!row?.enabled) return json({ error: "2FA must be enabled first" }, 400);

      let authorized = false;
      // Path A: valid session token
      if (token) {
        const { data: sess } = await admin
          .from("admin_2fa_sessions")
          .select("expires_at")
          .eq("user_id", userId)
          .eq("token", token)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();
        if (sess) authorized = true;
      }
      // Path B: TOTP or email OTP code
      if (!authorized && code) {
        const cleaned = code.replace(/\s+/g, "");
        if (/^\d{6}$/.test(cleaned)) {
          if (verifyTotp(row.secret, cleaned)) {
            authorized = true;
          } else {
            const hash = await sha256(cleaned);
            const { data: otpRow } = await admin
              .from("admin_email_otps")
              .select("id")
              .eq("user_id", userId)
              .eq("code_hash", hash)
              .is("used_at", null)
              .gt("expires_at", new Date().toISOString())
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (otpRow) {
              authorized = true;
              await admin.from("admin_email_otps")
                .update({ used_at: new Date().toISOString() })
                .eq("id", otpRow.id);
            }
          }
        }
      }
      if (!authorized) {
        return json({ error: "Verification required. Provide your 6-digit code or email code." }, 401);
      }

      const backupCodes = generateBackupCodes();
      await admin.from("admin_2fa")
        .update({ backup_codes: backupCodes })
        .eq("user_id", userId);

      return json({ success: true, backupCodes });
    }

    // ─── logout: invalidate current session token ───
    if (action === "logout") {
      if (token) {
        await admin
          .from("admin_2fa_sessions")
          .delete()
          .eq("user_id", userId)
          .eq("token", token);
      }
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-2fa error:", e);
    return json({ error: (e as Error).message ?? "Server error" }, 500);
  }
});
