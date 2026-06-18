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
// Returns lockout duration in seconds based on the current total failed count.
// The schedule escalates with each tier (every 3 failures).
function getLockoutSeconds(failedCount: number): number {
  if (failedCount < 3)  return 0;       // No lockout yet
  if (failedCount < 6)  return 30;      // 30 seconds
  if (failedCount < 9)  return 60;      // 1 minute
  if (failedCount < 12) return 600;     // 10 minutes
  if (failedCount < 15) return 3600;    // 1 hour
  if (failedCount < 18) return 86400;   // 24 hours
  if (failedCount < 21) return 172800;  // 48 hours
  if (failedCount < 24) return 259200;  // 3 days
  return 604800;                         // 7 days (max — permanent-ish lockout)
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
    return jsonResponse({ message: "Method not allowed" }, 405);

  // Admin client — uses service role, bypasses RLS
  // This is the ONLY client that has access to the login_attempts table.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  let email: string;
  let password: string;

  try {
    const body = await req.json();
    email = (body.email || "").toLowerCase().trim();
    password = body.password || "";
  } catch {
    return jsonResponse({ message: "Invalid request body" }, 400);
  }

  if (!email || !password) {
    return jsonResponse({ message: "Email and password are required" }, 400);
  }

  // ── STEP 1: Check current lockout status ──────────────────────────────────
  const { data: attemptRecord } = await supabase
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
      return jsonResponse(
        {
          message: `Too many failed attempts. Your account is locked for ${formatDuration(remainingSeconds)}. Please try again later.`,
          locked: true,
          lockoutUntil: attemptRecord.lockout_until,
          remainingSeconds,
        },
        429
      );
    }
  }

  // ── STEP 2: Attempt login via Supabase Auth ───────────────────────────────
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  // ── STEP 3A: Handle failed login ──────────────────────────────────────────
  if (authError || !authData?.session) {
    const currentFailed = (attemptRecord?.failed_count ?? 0) + 1;
    const lockoutSeconds = getLockoutSeconds(currentFailed);
    const lockoutUntil =
      lockoutSeconds > 0
        ? new Date(Date.now() + lockoutSeconds * 1000).toISOString()
        : null;

    // Upsert the failure record
    await supabase.from("login_attempts").upsert(
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
      const attemptsBeforeLockout = 3 - currentFailed;
      if (attemptsBeforeLockout > 0) {
        message = `Invalid email or password. ${attemptsBeforeLockout} attempt${attemptsBeforeLockout !== 1 ? "s" : ""} remaining before lockout.`;
      }
    }

    return jsonResponse(
      {
        message,
        locked: lockoutSeconds > 0,
        lockoutUntil,
        remainingSeconds: lockoutSeconds > 0 ? lockoutSeconds : 0,
      },
      401
    );
  }

  // ── STEP 3B: Login successful — reset the rate limiter ───────────────────
  await supabase.from("login_attempts").upsert(
    {
      email,
      failed_count: 0,
      lockout_until: null,
      last_attempt_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  const { session, user } = authData;

  // ── STEP 4: Load profile and check account status ─────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role, status, status_date, status_duration, employee_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Kill the session we just created — profile is corrupt/missing
    await supabase.auth.admin.signOut(session.access_token);
    return jsonResponse(
      { message: "Could not load your user profile. Please contact support." },
      500
    );
  }

  const pStatus = profile.status || "active";

  if (pStatus === "inactive") {
    await supabase.auth.admin.signOut(session.access_token);
    return jsonResponse(
      { message: "Your account is inactive. Please contact support." },
      403
    );
  }
  if (pStatus === "terminate") {
    await supabase.auth.admin.signOut(session.access_token);
    return jsonResponse(
      { message: "Your account has been terminated. Please contact support." },
      403
    );
  }
  if (pStatus === "resign") {
    await supabase.auth.admin.signOut(session.access_token);
    return jsonResponse(
      { message: "Your account has been marked as resigned. Please contact support." },
      403
    );
  }

  if (pStatus === "suspend") {
    if (profile.status_date && profile.status_duration) {
      const suspendStart = new Date(profile.status_date);
      const diffDays = Math.floor(
        (Date.now() - suspendStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= profile.status_duration) {
        await supabase.auth.admin.signOut(session.access_token);
        return jsonResponse(
          {
            message: `Your account is suspended for ${profile.status_duration} days. Please contact support.`,
          },
          403
        );
      }
    } else {
      await supabase.auth.admin.signOut(session.access_token);
      return jsonResponse(
        { message: "Your account is suspended. Please contact support." },
        403
      );
    }
  }

  // ── STEP 5: Device tracking (max 3 concurrent devices) ───────────────────
  // Device ID comes from the frontend's localStorage. If not sent, skip check.
  let deviceId: string | null = null;
  try {
    const body = await req.clone().json();
    deviceId = body.deviceId || null;
  } catch {
    // no deviceId provided
  }

  if (deviceId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: activeSessions } = await supabase
      .from("active_sessions")
      .select("device_id")
      .eq("user_id", user.id)
      .gte("last_active", oneHourAgo);

    if (activeSessions) {
      const otherDevices = activeSessions.filter(
        (s: { device_id: string }) => s.device_id !== deviceId
      );
      if (otherDevices.length >= 3) {
        await supabase.auth.admin.signOut(session.access_token);
        return jsonResponse(
          {
            message:
              "Maximum of 3 devices are already logged in. Please log out from another device first.",
          },
          403
        );
      }
    }

    await supabase.from("active_sessions").upsert(
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
