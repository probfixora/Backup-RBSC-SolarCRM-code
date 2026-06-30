// supabase/functions/secure-login/index.ts
// Secure backend login proxy with progressive rate limiting.
// This is the ONLY place that interacts with supabase.auth.signInWithPassword.
// The frontend sends email + password here; never directly to Supabase Auth.
// Deploy: supabase functions deploy secure-login

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Progressive lockout schedule ──────────────────────────────────────────────
// Lockout is only applied when failedCount reaches a multiple of 3.
// Between lockouts, the user gets 3 fresh attempts.
//
// Tier chart (which multiple-of-3 we're at):
//   failedCount=3  (tier 1) → 30 seconds
//   failedCount=6  (tier 2) → 1 minute
//   failedCount=9  (tier 3) → 10 minutes
//   failedCount=12 (tier 4) → 1 hour
//   failedCount=15 (tier 5) → 24 hours
//   failedCount=18 (tier 6) → 48 hours
//   failedCount=21 (tier 7) → 3 days
//   failedCount=24+ (tier 8+) → 7 days
function getLockoutSeconds(failedCount: number): number {
  // Only lock at multiples of 3
  if (failedCount % 3 !== 0) return 0;

  const tier = Math.floor(failedCount / 3);
  if (tier === 1) return 30;       // 30 seconds
  if (tier === 2) return 60;       // 1 minute
  if (tier === 3) return 600;      // 10 minutes
  if (tier === 4) return 3600;     // 1 hour
  if (tier === 5) return 86400;    // 24 hours
  if (tier === 6) return 172800;   // 48 hours
  if (tier === 7) return 259200;   // 3 days
  return 604800;                    // 7 days (tier 8+)
}

// How many attempts remain before the next lockout triggers
function attemptsUntilNextLockout(failedCount: number): number {
  const remainder = failedCount % 3;
  return remainder === 0 ? 3 : 3 - remainder;
}

// Format seconds into a human-readable duration string
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  if (seconds < 3600) {
    const m = Math.round(seconds / 60);
    return `${m} minute${m !== 1 ? "s" : ""}`;
  }
  if (seconds < 86400) {
    const h = Math.round(seconds / 3600);
    return `${h} hour${h !== 1 ? "s" : ""}`;
  }
  const d = Math.round(seconds / 86400);
  return `${d} day${d !== 1 ? "s" : ""}`;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST")
    return jsonResponse({ success: false, message: "Method not allowed" });

  // Admin client — uses service role, bypasses RLS
  // This is the ONLY client that has access to the login_attempts table.
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Auth client — used ONLY for checking passwords
  // This prevents the user's JWT from polluting the admin client's state.
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } }
  );

  let email: string;
  let password: string;
  let deviceId: string | null = null;

  try {
    const body = await req.json();
    email = (body.email || "").toLowerCase().trim();
    password = body.password || "";
    deviceId = body.deviceId || null;
  } catch {
    return jsonResponse({ success: false, message: "Invalid request body" });
  }

  if (!email || !password) {
    return jsonResponse({ success: false, message: "Email and password are required" });
  }

  // ── STEP 1: Check current lockout status ──────────────────────────────────
  const { data: attemptRecord } = await supabaseAdmin
    .from("login_attempts")
    .select("failed_count, lockout_until")
    .eq("email", email)
    .maybeSingle();

  if (attemptRecord?.lockout_until) {
    const lockoutUntil = new Date(attemptRecord.lockout_until);
    const now = new Date();
    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil(
        (lockoutUntil.getTime() - now.getTime()) / 1000
      );
      // Always return 200 so the JS client can reliably parse the body
      return jsonResponse({
        success: false,
        message: `Too many failed attempts. Your account is locked for ${formatDuration(remainingSeconds)}. Please try again later.`,
        locked: true,
        lockoutUntil: attemptRecord.lockout_until,
        remainingSeconds,
      });
    }
  }

  // ── STEP 2: Attempt login via Supabase Auth ───────────────────────────────
  const { data: authData, error: authError } =
    await supabaseAuth.auth.signInWithPassword({ email, password });

  // ── STEP 3A: Handle failed login ──────────────────────────────────────────
  if (authError || !authData?.session) {
    const currentFailed = (attemptRecord?.failed_count ?? 0) + 1;
    const lockoutSeconds = getLockoutSeconds(currentFailed);
    const lockoutUntil =
      lockoutSeconds > 0
        ? new Date(Date.now() + lockoutSeconds * 1000).toISOString()
        : null;

    // Upsert the failure record
    await supabaseAdmin.from("login_attempts").upsert(
      {
        email,
        failed_count: currentFailed,
        lockout_until: lockoutUntil,
        last_attempt_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    // Build the response message
    let message = "Invalid email or password. Please check your credentials.";
    if (lockoutSeconds > 0) {
      message = `Invalid credentials. Too many failed attempts — you are now locked out for ${formatDuration(lockoutSeconds)}.`;
    } else {
      const remaining = attemptsUntilNextLockout(currentFailed);
      message = `Invalid email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before lockout.`;
    }

    // Always return 200 so the JS client can reliably parse the body
    return jsonResponse({
      success: false,
      message,
      locked: lockoutSeconds > 0,
      lockoutUntil,
      remainingSeconds: lockoutSeconds > 0 ? lockoutSeconds : 0,
    });
  }

  // ── STEP 3B: Login successful — delete the rate limit record entirely ────
  // Deleting is more reliable than updating with null — the Supabase JS client
  // can silently drop null values in update/upsert payloads.
  // Semantics: no row = no failed attempts = fresh start. Clean and simple.
  const { error: deleteError } = await supabaseAdmin
    .from("login_attempts")
    .delete()
    .eq("email", email.toLowerCase().trim());

  if (deleteError) {
    // Log so this shows up in Supabase Edge Function logs (Dashboard → Functions → Logs)
    console.error("[secure-login] Failed to delete login_attempts row:", JSON.stringify(deleteError));
  } else {
    console.log("[secure-login] login_attempts reset for:", email);
  }

  const { session, user } = authData;

  // ── STEP 4: Load profile and check account status ─────────────────────────
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("name, role, status, status_date, status_duration, employee_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Kill the session we just created — profile is corrupt/missing
    await supabaseAdmin.auth.admin.signOut(session.access_token);
    return jsonResponse(
      { message: "Could not load your user profile. Please contact support." },
      500
    );
  }

  const pStatus = profile.status || "active";

  if (pStatus === "inactive") {
    await supabaseAdmin.auth.admin.signOut(session.access_token);
    return jsonResponse({ success: false, message: "Your account is inactive. Please contact support." });
  }
  if (pStatus === "terminate") {
    await supabaseAdmin.auth.admin.signOut(session.access_token);
    return jsonResponse({ success: false, message: "Your account has been terminated. Please contact support." });
  }
  if (pStatus === "resign") {
    await supabaseAdmin.auth.admin.signOut(session.access_token);
    return jsonResponse({ success: false, message: "Your account has been marked as resigned. Please contact support." });
  }

  if (pStatus === "suspend") {
    if (profile.status_date && profile.status_duration) {
      const suspendStart = new Date(profile.status_date);
      const diffDays = Math.floor(
        (Date.now() - suspendStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= profile.status_duration) {
        await supabaseAdmin.auth.admin.signOut(session.access_token);
        return jsonResponse({
          success: false,
          message: `Your account is suspended for ${profile.status_duration} days. Please contact support.`,
        });
      }
    } else {
      await supabaseAdmin.auth.admin.signOut(session.access_token);
      return jsonResponse({ success: false, message: "Your account is suspended. Please contact support." });
    }
  }

  // ── STEP 5: Device tracking (max 3 concurrent devices) ───────────────────
  // deviceId was already parsed from the request body above
  if (deviceId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: activeSessions } = await supabaseAdmin
      .from("active_sessions")
      .select("device_id, last_active")
      .eq("user_id", user.id)
      .gte("last_active", oneHourAgo);

    if (activeSessions) {
      const otherDevices = activeSessions.filter(
        (s: { device_id: string }) => s.device_id !== deviceId
      );
      
      // If limit is reached, evict the oldest session instead of blocking login
      if (otherDevices.length >= 3) {
        otherDevices.sort((a: any, b: any) => new Date(a.last_active).getTime() - new Date(b.last_active).getTime());
        const oldestDeviceId = otherDevices[0].device_id;
        
        await supabaseAdmin
          .from("active_sessions")
          .delete()
          .eq("user_id", user.id)
          .eq("device_id", oldestDeviceId);
      }
    }

    await supabaseAdmin.from("active_sessions").upsert(
      {
        user_id: user.id,
        device_id: deviceId,
        last_active: new Date().toISOString(),
      },
      { onConflict: "user_id, device_id" }
    );
  }

  // ── STEP 6: Return session and profile data to the frontend ───────────────
  return jsonResponse({
    success: true,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    user: {
      id: user.id,
      email: user.email,
      name: profile.name,
      role: profile.role,
      employeeId: profile.employee_id || "N/A",
    },
  });
});
