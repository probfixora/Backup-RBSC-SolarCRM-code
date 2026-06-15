// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rgipmrviqapxxilsiclm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnaXBtcnZpcWFweHhpbHNpY2xtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzEyNDYsImV4cCI6MjA5MzgwNzI0Nn0.8Dd5klNtsPGFCikUZYihVJTq-TLiS1Tn58pJ2vENHgM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Edge Function base URLs ──────────────────────────────────────────────────
export const EDGE = {
  workflow: `${SUPABASE_URL}/functions/v1/workflow`,
  analytics: `${SUPABASE_URL}/functions/v1/analytics`,
  quotation: `${SUPABASE_URL}/functions/v1/quotation`,
  admin: `${SUPABASE_URL}/functions/v1/admin`,
};

// ─── Authenticated fetch helper ───────────────────────────────────────────────
// Automatically attaches the current user's JWT to every Edge Function call.
export async function edgeFetch(url, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token || localStorage.getItem("token");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    // Only force-logout on genuine JWT expiry/invalidity (401 with JWT-specific message).
    // Normal RBAC 403s or validation 400s must NOT clear the session —
    // they should be handled by the calling component.
    if (res.status === 401) {
      const msg = (data.message || "").toLowerCase();
      const isJwtError =
        msg.includes("invalid jwt") ||
        msg.includes("jwt expired") ||
        msg.includes("not authenticated") ||
        msg.includes("token is expired");
      if (isJwtError) {
        console.warn(
          "[edgeFetch] JWT expired — clearing session and redirecting to login.",
        );
        supabase.auth.signOut().catch(() => {});
        localStorage.clear();
        // Throw BEFORE redirect so calling code can catch it cleanly
        const sessionError = new Error("Session expired. Please log in again.");
        sessionError.isSessionExpired = true;
        window.location.href = "/login";
        throw sessionError;
      }
    }
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}
