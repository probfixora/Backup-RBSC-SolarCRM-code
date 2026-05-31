// supabase/functions/workflow/index.ts
// Handles ALL case operations — replaces Express caseController.js + caseRoutes.js
// Deploy: supabase functions deploy workflow

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logoBase64 } from "../quotation/logoBase64.ts";

// ─── Workflow configuration ───────────────────────────────────────────────────

const workflowStages = [
  "Registration Done",
  "Phone Verification Done",
  "Bank & Finance",
  "Sent to Store",
  "Installation Done",
  "Plant Activated",
  "Sent to Subsidy",
  "Subsidy Registration Completed",
  "Completed",
];

const stageToTeam: Record<string, string> = {
  "Registration Done": "Registration",
  "Phone Verification Done": "Registration",
  "Bank & Finance": "Banking",
  "Sent to Store": "Inventory",
  "Installation Done": "Installation",
  "Plant Activated": "Installation",
  "Sent to Subsidy": "Subsidy",
  "Subsidy Registration Completed": "Subsidy",
  Completed: "Admin",
};

const stageToAllowedRole: Record<string, string[]> = {
  "Registration Done": ["registration", "admin"],
  "Phone Verification Done": ["registration", "admin"],
  "Bank & Finance": ["banking", "admin"],
  "Sent to Store": ["inventory", "admin"],
  "Installation Done": ["field_installation", "admin"],
  "Plant Activated": ["field_installation", "admin"],
  "Sent to Subsidy": ["subsidy", "admin"],
  "Subsidy Registration Completed": ["subsidy", "admin"],
  Completed: ["admin"],
};

// Build role → allowed stages map
const roleStageMap: Record<string, string[]> = {};
for (const [stage, roles] of Object.entries(stageToAllowedRole)) {
  for (const role of roles) {
    if (!roleStageMap[role]) roleStageMap[role] = [];
    roleStageMap[role].push(stage);
  }
}

// ─── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ─── Helper: verify JWT and get user profile ──────────────────────────────────
async function getUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header");

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");

  // Get role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, status")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");
  if (profile.status === "inactive") throw new Error("Account is inactive");

  return { ...user, name: profile.name, role: profile.role?.toLowerCase() };
}

// ─── Document Masking Helper ────────────────────────────────────────────────────
function maskDocumentsForRole(role: string, docsObj: any) {
  if (!docsObj || typeof docsObj !== 'object') return {};
  const restrictedRoles = ['inventory', 'field_installation', 'electrical', 'store'];
  if (!restrictedRoles.includes(role)) return docsObj;

  const sensitiveKeywords = ['aadhar', 'pan', 'itr', 'salary', 'bank', 'form 16', 'gst', 'kyc'];
  const maskedDocs: any = {};

  for (const [key, value] of Object.entries(docsObj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeywords.some(kw => keyLower.includes(kw));
    if (!isSensitive) {
      maskedDocs[key] = value;
    }
  }
  return maskedDocs;
}

// ─── Case-Level Data Masking ─────────────────────────────────────────────────
// Strips fields from the case row that the given role is not authorized to see.
// Approved rules (2026-05-24):
//   inventory        → Customer Name ✓, Tracking ID, Load Required, Dispatch; NO phone, address, financials
//   field_installation → Customer Name ✓, Tracking ID, Address, Phone; NO financials, NO KYC docs
//   subsidy          → Customer Name, Subsidy fields, Aadhar/Bank Passbook/Electricity Bill; NO loan financials
//   banking / admin / registration → full access
function maskCaseDataForRole(role: string, caseRow: any): any {
  if (!caseRow || typeof caseRow !== 'object') return caseRow;
  // Full access roles — return as-is
  if (['admin', 'registration', 'banking', 'sales'].includes(role)) return caseRow;

  // Fields that are ALWAYS redacted for restricted roles
  const alwaysHidden: string[] = [];

  if (role === 'inventory') {
    // Inventory sees: customer_name, tracking_id, id, current_stage, assigned_team,
    //                 load_required, status, created_at, stage_start_time,
    //                 dispatch_items, handoff_note, documents (already masked by maskDocumentsForRole)
    // Hidden: phone, alternate_phone, address, pin_code, reference, consumer_id,
    //         all finance fields, subsidy fields
    alwaysHidden.push(
      'phone', 'alternate_phone', 'address', 'pin_code', 'reference', 'consumer_id',
      'payment_type', 'payment_mode', 'cash_amount', 'down_payment', 'loan_amount',
      'emi_amount', 'bank_name', 'lender_name', 'marked_delayed_by', 'marked_delayed_at',
      'delay_reason', 'loan_account_number', 'loan_tenure',
      'subsidy_ref_number', 'subsidy_phase1_amount', 'subsidy_phase2_amount', 'subsidy_note',
      'installation_note', 'site_visit_date',
    );
  } else if (role === 'field_installation') {
    // Installation sees: customer_name, tracking_id, id, current_stage, assigned_team,
    //                    load_required, status, address, phone, geo_location,
    //                    site_visit_date, installation_note, documents (masked)
    // Hidden: financials, subsidy, alternate_phone, pin_code, reference, consumer_id
    alwaysHidden.push(
      'alternate_phone', 'pin_code', 'reference', 'consumer_id',
      'payment_type', 'payment_mode', 'cash_amount', 'down_payment', 'loan_amount',
      'emi_amount', 'bank_name', 'lender_name', 'loan_account_number', 'loan_tenure',
      'marked_delayed_by', 'marked_delayed_at', 'delay_reason',
      'subsidy_ref_number', 'subsidy_phase1_amount', 'subsidy_phase2_amount', 'subsidy_note',
    );
  } else if (role === 'subsidy') {
    // Subsidy sees: customer_name, tracking_id, id, current_stage, status,
    //              consumer_id, load_required, subsidy_ref_number, subsidy amounts,
    //              documents (subsidy team needs Aadhar, Bank Passbook, Electricity Bill)
    // Hidden: internal loan financials, phone, address
    alwaysHidden.push(
      'phone', 'alternate_phone', 'address', 'pin_code', 'reference',
      'payment_type', 'payment_mode', 'cash_amount', 'down_payment', 'loan_amount',
      'emi_amount', 'bank_name', 'lender_name', 'loan_account_number', 'loan_tenure',
      'marked_delayed_by', 'marked_delayed_at', 'delay_reason',
      'installation_note', 'site_visit_date', 'dispatch_items', 'handoff_note',
    );
  }

  const masked: any = { ...caseRow };
  for (const field of alwaysHidden) {
    if (field in masked) masked[field] = null;
  }
  return masked;
}

// ─── Main server ──────────────────────────────────────────────────────────────
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── PUBLIC: debug_schema ─────────────────────────────────────────────────
  const rawBody = await req.json().catch(() => ({}));
  if (rawBody.action === "debug_schema") {
    const { data, error } = await supabase.from('case_history').select('*').limit(2);
    // Let's just fix the bug! Remove updated_by_id!
    return new Response(JSON.stringify({ rows: data }), { headers: corsHeaders });
  }

  // ── PUBLIC: track_status ─────────────────────────────────────────────────
  if (rawBody.action === "track_status") {
    const trackingId = (rawBody.trackingId || rawBody.caseId || "").trim().toUpperCase();
    if (!trackingId) {
      return new Response(JSON.stringify({ message: "Tracking ID is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try tracking_id column first (RBSC-RAME-94721 format), fallback to case_id (CASE-0001)
    let data: any = null;
    let error: any = null;

    const byTrackingId = await supabase
      .from("cases")
      .select("id, tracking_id, current_stage, status")
      .eq("tracking_id", trackingId)
      .maybeSingle();

    if (byTrackingId.data) {
      data = byTrackingId.data;
    } else {
      const byCaseId = await supabase
        .from("cases")
        .select("id, tracking_id, current_stage, status")
        .eq("id", trackingId)
        .maybeSingle();
      data = byCaseId.data;
      error = byCaseId.error;
    }

    if (!data) {
      return new Response(JSON.stringify({ message: "Tracking ID not found. Please check the ID from your email and try again." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        case_id: data.id,
        tracking_id: data.tracking_id || data.id,
        current_stage: data.current_stage,
        status: data.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const user = await getUser(req, supabase);
    const body = rawBody;
    const action = body.action || "";

    // ── GET ALL CASES ──────────────────────────────────────────────────────
    if (action === "get_all") {
      let query = supabase.from("cases").select("*").order("created_at", { ascending: false });

      // Admin simulating an employee role — filter by that role's stages
      const effectiveRole = (user.role === "admin" && body.viewAsRole)
        ? body.viewAsRole.toLowerCase()
        : user.role;

      if (effectiveRole !== "admin") {
        if (effectiveRole === "registration" || effectiveRole === "banking" ||
            effectiveRole === "inventory"     || effectiveRole === "field_installation" ||
            effectiveRole === "subsidy"       || effectiveRole === "sales") {
          // These departments need full pipeline visibility:
          //   • Registration  — creates all cases, needs to track the whole journey
          //   • Banking       — tracks loan/cash approvals even after hand-off
          //   • Inventory     — dispatches goods; needs to see dispatched+completed cases too
          //   • Field Install — installs plants; needs to see installed+completed cases
          //   • Subsidy       — registers subsidies; needs to see subsidy+completed cases
          //   • Sales         — creates quotations; needs to see their customers progress
          // Sensitive docs are still masked per-role via maskDocumentsForRole.
          // No stage restriction here — all cases are visible.
        } else {
          // All other depts: strict stage-based — see only cases at their active stage
          const allowedStages = roleStageMap[effectiveRole] || [];
          if (allowedStages.length === 0) return jsonResponse([]);
          query = query.in("current_stage", allowedStages);
        }
      }

      if (body.stage) query = query.eq("current_stage", body.stage);
      if (body.team) query = query.eq("assigned_team", body.team);
      if (body.search) {
        query = query.or(`customer_name.ilike.%${body.search}%,id.ilike.%${body.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const maskedData = data.map((caseObj: any) => {
        const withMaskedDocs = {
          ...caseObj,
          documents: maskDocumentsForRole(effectiveRole, caseObj.documents),
        };
        return maskCaseDataForRole(effectiveRole, withMaskedDocs);
      });

      return jsonResponse(maskedData);
    }

    // ── GET ONE CASE ───────────────────────────────────────────────────────
    if (action === "get_one") {
      const { data: caseData, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (error) return jsonResponse({ message: "Case not found" }, 404);

      // RBAC check:
      // - Admin: unrestricted
      // - Registration: can READ any case (full pipeline visibility); write enforced in update_stage
      // - Others: can read cases AT their stage OR that have already PASSED their last stage
      //   (so departments can open the drawer for cases in their "Completed" tab)
      if (user.role !== "admin" && user.role !== "registration") {
        const myStages = (roleStageMap[user.role] || []);
        const myLastStageIdx = Math.max(
          ...myStages.map((s: string) => workflowStages.indexOf(s))
        );
        const caseStageIdx = workflowStages.indexOf(caseData.current_stage);
        // Allow access if:
        //   a) case is currently at one of my stages, OR
        //   b) case has passed my last stage (I've already handed it off — read-only)
        const canRead = myStages.includes(caseData.current_stage) ||
                        (myLastStageIdx >= 0 && caseStageIdx > myLastStageIdx);
        if (!canRead) {
          return jsonResponse({ message: "Access restricted to your department's cases." }, 403);
        }
      }

      const { data: history } = await supabase
        .from("case_history")
        .select("*")
        .eq("case_id", body.caseId)
        .order("timestamp", { ascending: true });  // chronological order

      const { data: comments } = await supabase
        .from("case_comments")
        .select("*")
        .eq("case_id", body.caseId)
        .order("created_at", { ascending: false });

      caseData.documents = maskDocumentsForRole(user.role, caseData.documents);
      const maskedCase   = maskCaseDataForRole(user.role, caseData);

      return jsonResponse({ case: maskedCase, history: history || [], comments: comments || [] });
    }

    // ── CREATE CASE ────────────────────────────────────────────────────────
    if (action === "create_case") {
      if (user.role !== "registration" && user.role !== "admin") {
        return jsonResponse({ message: "Only Registration department can create cases" }, 403);
      }

      const { data: newCase, error } = await supabase
        .from("cases")
        .insert({
          customer_name: body.customerName,
          phone: body.phone,
          alternate_phone: body.alternatePhone || "",
          address: body.address,
          reference: body.reference || "",
          consumer_id: body.consumerId || "",
          pin_code: body.pinCode || "",
          load_required: body.loadRequired,
          payment_type: body.paymentType || 'cash',
          current_stage: "Registration Done",
          assigned_team: "Registration",
          stage_start_time: new Date().toISOString(),
          created_by: user.id,
          sales_person: body.salesPerson || user.name,
          system_specs: body.systemSpecs || {},
          documents: body.documents || {}
        })
        .select()
        .single();

      if (error) throw error;

      // ── Generate & save branded tracking_id ──────────────────────────────
      const customerName   = body.customerName || "";
      const nameSlug       = customerName.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4).padEnd(4, "X");
      const randomDigits   = String(Math.floor(10000 + Math.random() * 90000));
      const trackingIdVal  = `${Deno.env.get("ID_PREFIX") || "RBSC"}-${nameSlug}-${randomDigits}`; // e.g. RBSC-RAME-94721

      // ── Generate Customer ID: [NAME4]-[DDMMYYYY]-[XXXXX] ─────────────────
      const now            = new Date();
      const dd   = String(now.getDate()).padStart(2, "0");
      const mm   = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = String(now.getFullYear());
      const custRandom     = String(Math.floor(10000 + Math.random() * 90000));
      const customerIdVal  = `${nameSlug}-${dd}${mm}${yyyy}-${custRandom}`; // e.g. RAME-23052026-94721
      // ─────────────────────────────────────────────────────────────────────

      // Store tracking_id and customer_id in the cases table
      await supabase.from("cases").update({
        tracking_id: trackingIdVal,
        customer_id: customerIdVal,
      }).eq("id", newCase.id);
      // ─────────────────────────────────────────────────────────────────────

      // Create history entry with department
      await supabase.from("case_history").insert({
        case_id: newCase.id,
        stage: "Registration Done",
        department: "Registration",
        updated_by: user.name,
        action_type: "case_created",
        remarks: "Customer Registered",
      });

      // ── SEND REGISTRATION CONFIRMATION EMAIL ──────────────────────────────
      // Fire-and-forget: email failure must NEVER block case creation.
      // We log errors but do not throw or roll back.
      const sendRegistrationEmail = async (): Promise<void> => {
        const brevoApiKey = Deno.env.get("BREVO_API_KEY");
        const senderEmail  = Deno.env.get("GMAIL_EMAIL");
        const customerEmail = newCase.email || body.email || "";

        if (!brevoApiKey || !senderEmail) {
          console.warn("[create_case] BREVO_API_KEY or GMAIL_EMAIL not set — skipping confirmation email.");
          return;
        }
        if (!customerEmail) {
          console.warn(`[create_case] No email address for case ${newCase.id} — skipping confirmation email.`);
          return;
        }

        const companyName = Deno.env.get("COMPANY_NAME") || "${Deno.env.get("COMPANY_NAME") || "RBSC Solar"}";
        const companyEmail = Deno.env.get("COMPANY_EMAIL") || "${Deno.env.get("COMPANY_EMAIL") || "info@rbscsolar.com"}";
        const companyWebsite = Deno.env.get("COMPANY_WEBSITE") || "${Deno.env.get("COMPANY_WEBSITE") || "www.rbscsolar.com"}";
        const companyAddress = Deno.env.get("COMPANY_ADDRESS_LINE1") || "Lucknow, Uttar Pradesh, India";
        const companyPrimary = Deno.env.get("COMPANY_NAME_PRIMARY") || "RBSC";
        const companySecondary = Deno.env.get("COMPANY_NAME_SECONDARY") || "Solar";

        const caseId       = newCase.id;                      // e.g. CASE-0001 (DB record)
        const customerName  = newCase.customer_name || "Customer";
        const registeredOn  = new Date().toLocaleDateString("en-IN", {
          day: "2-digit", month: "long", year: "numeric",
        });

        // ── Use the already-generated & saved Tracking ID ─────────────────
        const trackingId  = trackingIdVal;  // e.g. RBSC-RAME-94721

        const trackingUrl = `https://${companyWebsite.replace('www.', '').replace('https://', '')}/track?id=${encodeURIComponent(trackingIdVal)}`;
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Registration Successful — ${companyName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;background:#f0f4f8;color:#1a202c}
    .wrapper{max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)}
    /* Header */
    .header{background:linear-gradient(135deg,#1a1a5e 0%,#16a34a 100%);padding:28px 40px 24px;text-align:center}
    .header-logo{display:block;margin:0 auto 10px;max-height:64px;width:auto}
    .header h1{color:#fff;font-size:20px;font-weight:700;letter-spacing:0.3px;margin:0}
    .header p{color:rgba(255,255,255,0.80);font-size:13px;margin-top:4px}
    /* Badge */
    .badge-wrap{text-align:center;margin:-18px 0 0}
    .badge{display:inline-block;background:#16a34a;color:#fff;font-size:12px;font-weight:700;
           letter-spacing:1px;text-transform:uppercase;padding:6px 18px;border-radius:20px;
           box-shadow:0 2px 8px rgba(22,163,74,0.35)}
    /* Body */
    .body{padding:36px 40px}
    .greeting{font-size:18px;font-weight:700;color:#1a1a5e;margin-bottom:10px}
    .intro{font-size:14px;color:#4a5568;line-height:1.7;margin-bottom:24px}
    /* Tracking card */
    .tracking-card{background:linear-gradient(135deg,#eef2ff,#ecfdf5);border:1.5px solid #c7d2fe;
                   border-radius:10px;padding:24px 28px;margin-bottom:24px;text-align:center}
    .tracking-label{font-size:12px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
    .tracking-id{font-size:30px;font-weight:700;color:#1a1a5e;letter-spacing:2px;font-family:monospace}
    .tracking-sublabel{font-size:12px;color:#64748b;margin-top:6px}
    /* Details table */
    .details{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
    .details tr:not(:last-child) td{border-bottom:1px solid #e2e8f0}
    .details td{padding:11px 14px;color:#374151}
    .details td:first-child{font-weight:600;color:#1a1a5e;background:#f8fafc;width:42%;border-radius:4px 0 0 4px}
    /* CTA Button */
    .cta-wrap{text-align:center;margin-bottom:28px}
    .cta-btn{display:inline-block;background:linear-gradient(135deg,#1a1a5e,#16a34a);color:#fff !important;
             font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;
             border-radius:8px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(22,163,74,0.30)}
    /* Steps */
    .steps-title{font-size:13px;font-weight:700;color:#1a1a5e;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px}
    .steps{display:flex;gap:0;margin-bottom:28px;border-radius:8px;overflow:hidden}
    .step{flex:1;padding:12px 8px;text-align:center;background:#f8fafc;border-right:1px solid #e2e8f0}
    .step:last-child{border-right:none}
    .step-dot{width:28px;height:28px;border-radius:50%;background:#e2e8f0;color:#94a3b8;
              font-size:12px;font-weight:700;line-height:28px;text-align:center;margin:0 auto 6px}
    .step-dot.active{background:#16a34a;color:#fff}
    .step-label{font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
    /* Help */
    .help{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;font-size:13px;color:#92400e;margin-bottom:24px}
    .help strong{color:#78350f}
    /* Footer */
    .footer{background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0}
    .footer-logo{font-size:16px;font-weight:700;color:#1a1a5e;margin-bottom:4px}
    .footer-logo span{color:#16a34a}
    .footer p{font-size:11px;color:#94a3b8;line-height:1.6;margin-top:4px}
    .footer a{color:#6366f1;text-decoration:none}
  </style>
</head>
<body>
<div class="wrapper">

  <!-- Header -->
  <div class="header">
    ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="${companyName} Logo" class="header-logo" />` : ""}
    <h1>Registration Successful!</h1>
    <p>Your solar installation has been officially registered</p>
  </div>

  <!-- Green Badge -->
  <div class="badge-wrap" style="padding:18px 0 0">
    <span class="badge">Confirmed</span>
  </div>

  <!-- Body -->
  <div class="body">
    <div class="greeting">Hello ${customerName},</div>
    <p class="intro">
      Welcome to <strong>${companyName}</strong>! Your details have been successfully verified and registered in our system.
      You can track your live installation
      case progress at any time.
    </p>

    <!-- Tracking ID Card -->
    <div class="tracking-card">
      <div class="tracking-label">Your Unique Tracking ID</div>
      <div class="tracking-id">${trackingId}</div>
      <div class="tracking-sublabel">Keep this ID safe for future reference</div>
    </div>

    <!-- Case Details -->
    <table class="details">
      <tr>
        <td>Customer Name</td>
        <td>${customerName}</td>
      </tr>
      <tr>
        <td>Customer ID</td>
        <td>${customerIdVal}</td>
      </tr>
      <tr>
        <td>Registered On</td>
        <td>${registeredOn}</td>
      </tr>
      <tr>
        <td>Current Stage</td>
        <td>📋 Registration Done</td>
      </tr>
      <tr>
        <td>Assigned Team</td>
        <td>Registration Department</td>
      </tr>
      <tr>
        <td>Status</td>
        <td><span style="color:#16a34a;font-weight:700">● In Progress</span></td>
      </tr>
    </table>

    <!-- Track Live Button -->
    <div class="cta-wrap">
      <a href="${trackingUrl}" class="cta-btn">Track Installation Live</a>
    </div>

    <!-- Visual Journey -->
    <div class="steps-title">Installation Journey</div>
    <div class="steps">
      <div class="step">
        <div class="step-dot active">✓</div>
        <div class="step-label" style="color:#16a34a">Registered</div>
      </div>
      <div class="step">
        <div class="step-dot">2</div>
        <div class="step-label">Survey</div>
      </div>
      <div class="step">
        <div class="step-dot">3</div>
        <div class="step-label">Approval</div>
      </div>
      <div class="step">
        <div class="step-dot">4</div>
        <div class="step-label">Installed</div>
      </div>
    </div>

    <!-- Help Box -->
    <div class="help">
      <strong>Need Help?</strong> If you have any questions about your registration 
      or need to update your information, please contact us at 
      <strong>${companyEmail}</strong> and quote your Tracking ID 
      <strong>${trackingId}</strong>.
    </div>

    <p style="font-size:13px;color:#4a5568;line-height:1.7">
      Warm regards,<br/>
      <strong style="color:#1a1a5e">${companyName} Team</strong><br/>
      <span style="color:#94a3b8;font-size:12px">${companyAddress}</span>
    </p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-logo">${companyPrimary} <span>${companySecondary}</span></div>
    <p>
      © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br/>
      ${Deno.env.get("COMPANY_ADDRESS_LINE1") || "Lucknow, Uttar Pradesh, India"}<br/>
      <a href="https://${companyWebsite.replace('www.', '').replace('https://', '')}">${companyWebsite}</a> &nbsp;|&nbsp; 
      <a href="mailto:${companyEmail}">${companyEmail}</a>
    </p>
    <p style="margin-top:8px;color:#cbd5e1;font-size:10px">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>

</div>
</body>
</html>`;

        const payload = {
          sender: { name: companyName, email: senderEmail },
          to: [{ email: customerEmail, name: customerName }],
          subject: `Registration Confirmed — Your Tracking ID: ${trackingId}`,
          htmlContent,
        };

        try {
          const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoApiKey,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error(`[create_case] Brevo API error for case ${caseId}: ${errText}`);
          } else {
            const result = await res.json();
            console.log(`[create_case] ✅ Confirmation email sent to ${customerEmail} for case ${caseId}. Brevo messageId: ${result.messageId}`);
          }
        } catch (emailErr) {
          // Log only — never block or roll back the case creation
          console.error(`[create_case] Failed to send confirmation email for case ${caseId}:`, emailErr);
        }
      };

      // Kick off email in background — non-blocking
      // @ts-ignore
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(sendRegistrationEmail());
      } else {
        sendRegistrationEmail();
      }
      // ─────────────────────────────────────────────────────────────────────

      return jsonResponse(newCase, 201);
    }

    // ── UPDATE STAGE ───────────────────────────────────────────────────────
    if (action === "update_stage") {
      const { data: caseObj, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (error) return jsonResponse({ message: "Case not found" }, 404);

      const currentStageRaw = caseObj.current_stage?.trim();
      const normalizedStage = workflowStages.find(
        (s) => s.toLowerCase() === currentStageRaw.toLowerCase()
      );
      if (!normalizedStage) return jsonResponse({ message: `Invalid workflow state: "${currentStageRaw}"` }, 400);

      const currentIndex = workflowStages.indexOf(normalizedStage);

      // ── DOCUMENT GATE: Registration Done → next stage requires all docs Verified ──
      if (normalizedStage === "Registration Done" || normalizedStage === "Phone Verification Done") {
        const docStatuses = caseObj.document_statuses || {};
        const docs = caseObj.documents || {};
        const unverified = Object.keys(docs).filter(
          (docName) => (docStatuses[docName] || "Yellow") !== "Green"
        );
        if (unverified.length > 0) {
          return jsonResponse({
            message: "Document not verified kindly verify first then proceed",
            unverifiedDocs: unverified,
          }, 400);
        }
      }
      // ──────────────────────────────────────────────────────────────────────


      // RBAC check
      const allowedRoles = stageToAllowedRole[normalizedStage] || [];
      if (user.role !== "admin" && !allowedRoles.includes(user.role)) {
        return jsonResponse({
          message: `Unauthorized: Your role (${user.role}) cannot update cases at "${normalizedStage}"`,
        }, 403);
      }

      if (currentIndex === workflowStages.length - 1) {
        return jsonResponse({ message: "Case is already at final stage" }, 400);
      }

      const expectedNextStage = workflowStages[currentIndex + 1];
      if (expectedNextStage.toLowerCase() !== body.newStage?.trim().toLowerCase()) {
        return jsonResponse({
          message: `Invalid transition. From ${normalizedStage}, you can only move to ${expectedNextStage}`,
        }, 400);
      }

      // ── SPECIAL: "Subsidy Registration Completed" auto-completes the case ──
      const isSubsidyComplete = expectedNextStage === "Subsidy Registration Completed";

      const newStatus = (expectedNextStage === "Completed" || isSubsidyComplete)
        ? "Completed"
        : (caseObj.status === "Delayed" && caseObj.marked_delayed_at ? "Delayed" : "In Progress");

      const finalStage = isSubsidyComplete ? "Completed" : expectedNextStage;
      const finalTeam  = stageToTeam[finalStage] || "Admin";

      const { data: updated, error: updateError } = await supabase
        .from("cases")
        .update({
          current_stage:   finalStage,
          assigned_team:   finalTeam,
          stage_start_time: new Date().toISOString(),
          status:          newStatus,
          // ── Escalation timer reset ───────────────────────────────────────────
          // Reset stage_entered_at so the pg_cron escalation job calculates
          // staleness from when the case arrived at this new stage, not creation.
          // Also reset escalation_level to 0 (clean slate for new department).
          stage_entered_at:  new Date().toISOString(),
          escalation_level:  0,
          // ────────────────────────────────────────────────────────────────────
        })
        .eq("id", body.caseId)
        .select()
        .single();

      if (updateError) throw updateError;

      // History: log the stage transition with department info
      const historyStage = isSubsidyComplete ? "Subsidy Registration Completed" : caseObj.current_stage;
      const historyDept  = stageToTeam[historyStage] || "Unknown";
      await supabase.from("case_history").insert({
        case_id:        caseObj.id,
        stage:          historyStage,
        department:     historyDept,
        updated_by:     user.name,
        action_type:    "stage_update",
        remarks:        isSubsidyComplete
          ? (body.remarks || "Subsidy Registration Completed — Customer marked as Completed")
          : body.remarks,
      });

      // If subsidy complete, add a second history entry marking as Completed
      if (isSubsidyComplete) {
        await supabase.from("case_history").insert({
          case_id:        caseObj.id,
          stage:          "Completed",
          department:     "Admin",
          updated_by:     "System (Auto)",
          action_type:    "system_auto",
          remarks:        "Customer automatically marked Completed after Subsidy Registration",
        });
      }

      // ── AUTO-INVENTORY DEDUCTION FOR "Sent to Store" ────────────────────
      if (finalStage === "Sent to Store") {
        try {
          let specs = caseObj.system_specs;
          if (!specs || Object.keys(specs).length === 0) {
            const { data: quot } = await supabase
              .from("quotations")
              .select("*")
              .ilike("customer_name", caseObj.customer_name)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (quot) {
              specs = {
                productCategory: quot.product_category,
                panelCount: quot.panel_count,
                inverterBrand: quot.inverter_brand,
                inverterKw: quot.inverter_kw,
                batteryBrand: quot.battery_brand,
                batteryCount: quot.battery_count,
                structure: quot.structure,
                bos: quot.bos,
              };
            }
          }

          if (specs) {
            // Find inventory items roughly matching the specs
            const { data: invItems } = await supabase.from("inventory").select("*").eq("is_active", true);
            const itemsToDeduct = [];
            
            if (invItems) {
              // 1. Panels
              if (specs.panelCount) {
                const panel = invItems.find(i => i.category?.toLowerCase() === 'solar panel');
                if (panel) itemsToDeduct.push({ item: panel, qty: Number(specs.panelCount) });
              }
              // 2. Inverter
              if (specs.inverterBrand) {
                const inv = invItems.find(i => i.category?.toLowerCase() === 'inverter' && i.brand?.toLowerCase() === specs.inverterBrand?.toLowerCase())
                            || invItems.find(i => i.category?.toLowerCase() === 'inverter');
                if (inv) itemsToDeduct.push({ item: inv, qty: 1 }); // usually 1 inverter
              }
              // 3. Battery
              if (specs.batteryBrand && specs.batteryCount) {
                const bat = invItems.find(i => i.category?.toLowerCase() === 'battery' && i.brand?.toLowerCase() === specs.batteryBrand?.toLowerCase())
                            || invItems.find(i => i.category?.toLowerCase() === 'battery');
                if (bat) itemsToDeduct.push({ item: bat, qty: Number(specs.batteryCount) });
              }

              // Deduct and log
              for (const { item, qty } of itemsToDeduct) {
                if (qty > 0) {
                  const newStock = Math.max(0, (item.stock || 0) - qty);
                  const newRes = (item.reserved_quantity || 0) + qty;
                  await supabase.from("inventory").update({ stock: newStock, reserved_quantity: newRes }).eq("id", item.id);
                  
                  // Transaction log
                  await supabase.from("inventory_transactions").insert({
                    inventory_id: item.id,
                    inventory_name: item.name,
                    case_id: caseObj.id,
                    transaction_type: "reservation",
                    quantity: -qty,
                    stock_before: item.stock,
                    stock_after: newStock,
                    notes: `Auto-reserved for case ${caseObj.id}`,
                    created_by: "System (Auto)",
                    created_by_role: "system",
                  });
                }
              }

              // Log auto-deduction in case history
              if (itemsToDeduct.length > 0) {
                await supabase.from("case_history").insert({
                  case_id: caseObj.id,
                  stage: "Sent to Store",
                  department: "Inventory",
                  updated_by: "System (Auto)",
                  action_type: "system_auto",
                  remarks: "Inventory automatically calculated and reserved based on system specs.",
                });
              }
            }
          }
        } catch (e) {
          console.error("Auto inventory deduction failed:", e);
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      return jsonResponse(updated);
    }


    // ── MARK / UNMARK DELAYED ─────────────────────────────────────────────
    if (action === "mark_delayed") {
      const { data: caseObj, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (error) return jsonResponse({ message: "Case not found" }, 404);

      let updatePayload: Record<string, unknown>;
      if (body.unmark) {
        updatePayload = {
          status: "In Progress",
          delay_reason: "",
          marked_delayed_by: "",
          marked_delayed_at: null,
        };
      } else {
        if (!body.reason?.trim()) return jsonResponse({ message: "A delay reason is required." }, 400);
        updatePayload = {
          status: "Delayed",
          delay_reason: body.reason.trim(),
          marked_delayed_by: user.name,
          marked_delayed_at: new Date().toISOString(),
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from("cases")
        .update(updatePayload)
        .eq("id", body.caseId)
        .select()
        .single();

      if (updateError) throw updateError;

      await supabase.from("case_history").insert({
        case_id: caseObj.id,
        stage: caseObj.current_stage,
        updated_by: user.name,
        action_type: body.unmark ? "delay_cleared" : "delay_flagged",
        remarks: body.unmark ? "Delay flag removed" : `Marked as Delayed: ${body.reason.trim()}`,
      });

      return jsonResponse(updated);
    }

    // ── ADD COMMENT ────────────────────────────────────────────────────────
    if (action === "add_comment") {
      if (!body.text?.trim()) return jsonResponse({ message: "Comment text is required." }, 400);

      const insertPayload: Record<string, unknown> = {
        case_id:      body.caseId,
        text:         body.text.trim(),
        author:       user.name,
        role:         user.role,
        // New fields — both optional; defaults handled by migration column defaults
        comment_type: body.comment_type || "note",
        parent_id:    body.parent_id || null,
      };

      const { data: comment, error } = await supabase
        .from("case_comments")
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(comment, 201);
    }

    // ── GET COMMENTS ───────────────────────────────────────────────────────
    if (action === "get_comments") {
      const { data, error } = await supabase
        .from("case_comments")
        .select("*")
        .eq("case_id", body.caseId)   // Fixed: was filtering by id, now by case_id
        .order("created_at", { ascending: true }); // Oldest first so thread tree builds correctly
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // ── LOG DOWNLOAD (audit trail for PDF downloads) ────────────────────────
    if (action === "log_download") {
      if (!body.caseId) return jsonResponse({ message: "caseId is required" }, 400);
      const { error } = await supabase.from("case_history").insert({
        case_id:     body.caseId,
        stage:       body.stage    || "N/A",
        department:  body.dept     || user.role,
        updated_by:  user.name,
        action_type: "download_details",
        remarks:     `PDF case details downloaded by ${user.name} (${user.role})`,
      });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }


    // ── UPDATE CASE DETAILS ────────────────────────────────────────────────
    if (action === "update_details") {
      const allowedFields: Record<string, string> = {
        loanAmount: "loan_amount",
        handoffNote: "handoff_note",
        assignedTo: "assigned_to",
        siteVisitDate: "site_visit_date",
        installationNote: "installation_note",
        subsidyRefNumber: "subsidy_ref_number",
        subsidyNote: "subsidy_note",
        documentStatuses: "document_statuses",
      };

      const updatePayload: Record<string, unknown> = {};
      for (const [jsKey, dbKey] of Object.entries(allowedFields)) {
        if (body[jsKey] !== undefined) {
           if (body[jsKey] === "" && dbKey === "site_visit_date") {
              updatePayload[dbKey] = null;
           } else {
              updatePayload[dbKey] = body[jsKey];
           }
        }
      }

      const { data: updated, error } = await supabase
        .from("cases")
        .update(updatePayload)
        .eq("id", body.caseId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(updated);
    }


    // ── UPDATE FINANCE ─────────────────────────────────────────────────────
    if (action === "update_finance") {
      if (user.role !== "admin" && user.role !== "banking") {
        return jsonResponse({ message: "Unauthorized: Only Banking & Finance or Admin can update finance details." }, 403);
      }

      const allowedFields: Record<string, string> = {
        paymentType: "payment_type",
        downPayment: "down_payment",
        cashAmount: "cash_amount",
        paymentMode: "payment_mode",
        loanAmount: "loan_amount",
        emiAmount: "emi_amount",
        bankName: "bank_name",
        bankVisitedDate: "bank_visited_date",
        financeFormStatus: "finance_form_status",
        financeFinalStatus: "finance_final_status",
        disbursementDetails: "disbursement_details",
        financeNotes: "finance_notes",
      };

      const updatePayload: Record<string, unknown> = {};
      for (const [jsKey, dbKey] of Object.entries(allowedFields)) {
        if (body[jsKey] !== undefined) {
          if (body[jsKey] === "") {
             if (dbKey === "bank_visited_date") {
                updatePayload[dbKey] = null;
             } else {
                updatePayload[dbKey] = ["down_payment", "cash_amount", "loan_amount", "emi_amount"].includes(dbKey) ? 0 : "";
             }
          } else if (dbKey === "payment_type") {
             updatePayload[dbKey] = String(body[jsKey]).toLowerCase();
          } else {
             updatePayload[dbKey] = ["down_payment", "cash_amount", "loan_amount", "emi_amount"].includes(dbKey) 
               ? Number(body[jsKey]) 
               : body[jsKey];
          }
        }
      }

      const pType = String(body.paymentType || "").toLowerCase();
      if (pType === "cash") {
        updatePayload.loan_amount = 0;
        updatePayload.emi_amount = 0;
        updatePayload.bank_name = "";
      } else if (pType === "loan") {
        updatePayload.cash_amount = 0;
        updatePayload.payment_mode = "";
      }

      const { data: updated, error } = await supabase
        .from("cases")
        .update(updatePayload)
        .eq("id", body.caseId)
        .select()
        .single();

      if (error) throw error;
      
      await supabase.from("case_history").insert({
        case_id: body.caseId,
        stage: updated.current_stage,
        updated_by: user.name,
        action_type: "finance_update",
        remarks: body.remarks || `Updated financial details.`,
      });
      
      return jsonResponse(updated);
    }

    // ── GET INVENTORY ───────────────────────────────────────────
    if (action === "get_inventory") {
      const { data: invData, error: invErr } = await supabase
        .from("inventory").select("*").order("name");
      if (invErr) throw invErr;

      // Also fetch quotation specs for the given case (to auto-populate dispatch)
      let quotationSpecs = null;
      const { caseId: qCaseId } = body;
      if (qCaseId) {
        const { data: caseRow } = await supabase
          .from("cases")
          .select("customer_name, system_specs")
          .or(`id.eq.${qCaseId},case_id.eq.${qCaseId}`)
          .maybeSingle();

        if (caseRow) {
          // Prefer system_specs if already filled
          const ss = caseRow.system_specs;
          if (ss && typeof ss === 'object' && Object.keys(ss).length > 0) {
            quotationSpecs = ss;
          } else if (caseRow.customer_name) {
            // Fall back to quotations table (most recent quotation for this customer)
            const { data: quot } = await supabase
              .from("quotations")
              .select("product_name, panel_count, panel_unit, inverter_brand, inverter_kw, battery_brand, battery_count, battery_capacity, structure, bos, product_category")
              .ilike("customer_name", caseRow.customer_name)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (quot) {
              quotationSpecs = {
                productName:     quot.product_name,
                productCategory: quot.product_category,
                panelCount:      quot.panel_count,
                panelUnit:       quot.panel_unit,
                inverterBrand:   quot.inverter_brand,
                inverterKw:      quot.inverter_kw,
                batteryBrand:    quot.battery_brand,
                batteryCount:    quot.battery_count,
                batteryCapacity: quot.battery_capacity,
                structure:       quot.structure,
                bos:             quot.bos,
              };
            }
          }
        }
      }

      return jsonResponse({ inventory: invData, quotationSpecs });
    }

    // ── DISPATCH MATERIALS ──────────────────────────────────────────────────
    if (action === "dispatch_materials") {
      if (user.role !== "admin" && user.role !== "store" && user.role !== "inventory") {
        return jsonResponse({ message: "Unauthorized: Only Store/Inventory or Admin can dispatch materials." }, 403);
      }

      const { caseId, items, vehicleNumber, driverName, notes } = body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return jsonResponse({ message: "No items to dispatch." }, 400);
      }

      for (const item of items) {
        const { data: invItem } = await supabase.from("inventory").select("stock").eq("id", item.id).single();
        if (invItem) {
          const newStock = Math.max(0, invItem.stock - item.quantity);
          await supabase.from("inventory").update({ stock: newStock }).eq("id", item.id);
        }
      }

      const { data: dispatchRecord, error: dispatchError } = await supabase
        .from("inventory_dispatches")
        .insert({
          case_id: caseId,
          dispatched_by: user.name,
          dispatched_by_role: user.role,
          status: "Dispatched",
          vehicle_number: vehicleNumber || "",
          driver_name: driverName || "",
          notes: notes || "",
          dispatched_items: items
        })
        .select()
        .single();

      if (dispatchError) throw dispatchError;

      await supabase.from("case_history").insert({
        case_id: caseId,
        stage: "Sent to Store",
        updated_by: user.name,
        action_type: "dispatch",
        remarks: `Dispatched materials via vehicle ${vehicleNumber || 'N/A'}.`,
      });

      return jsonResponse(dispatchRecord);
    }

    // ── ASSIGN CASE ────────────────────────────────────────────────────────
    if (action === "assign") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("id, current_stage")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      const { data: updated, error } = await supabase
        .from("cases")
        .update({ assigned_to: body.assignedTo || "" })
        .eq("id", body.caseId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("case_history").insert({
        case_id: body.caseId,
        stage: caseObj.current_stage,
        updated_by: user.name,
        action_type: "assignment_changed",
        remarks: body.assignedTo ? `Case assigned to ${body.assignedTo}` : "Assignment removed",
      });

      return jsonResponse(updated);
    }

    // ── TOGGLE PRIORITY ────────────────────────────────────────────────────
    if (action === "toggle_priority") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("priority")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      const newPriority = caseObj.priority === "urgent" ? "normal" : "urgent";
      await supabase.from("cases").update({ priority: newPriority }).eq("id", body.caseId);
      return jsonResponse({ priority: newPriority });
    }

    // ── DELETE CASE ────────────────────────────────────────────────────────
    if (action === "delete") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("current_stage, created_by")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      if (caseObj.current_stage !== "Registration Done") {
        return jsonResponse({ message: "Case can only be deleted at the Registration Done stage." }, 403);
      }

      const isAdmin = user.role === "admin";
      const isCreator = caseObj.created_by === user.id;
      if (!isAdmin && !isCreator) {
        return jsonResponse({ message: "Only the admin or the case creator can delete this case." }, 403);
      }

      await supabase.from("cases").delete().eq("id", body.caseId);
      await supabase.from("case_history").delete().eq("case_id", body.caseId);
      await supabase.from("case_comments").delete().eq("case_id", body.caseId);
      return jsonResponse({ message: "Case deleted." });
    }

    // ── TOGGLE CHECKLIST ──────────────────────────────────────────────────
    if (action === "toggle_checklist") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      const listName = body.listName;
      const itemId = body.itemId;
      const checklist = caseObj[listName] || [];
      const updatedList = checklist.map((item: any) =>
        item._id === itemId
          ? { ...item, checked: !item.checked, checkedBy: !item.checked ? user.name : null }
          : item
      );

      await supabase.from("cases").update({ [listName]: updatedList }).eq("id", body.caseId);
      return jsonResponse(updatedList);
    }

    // ── SUBMIT CUSTOMER FEEDBACK (admin only) ──────────────────────────────
    if (action === "submit_feedback") {
      if (user.role !== "admin") return jsonResponse({ message: "Forbidden" }, 403);

      const { caseId, customerName, rating, feedback_text, installation_quality,
              team_behavior, timeline_satisfaction, submitted_by } = body;

      if (!caseId)             return jsonResponse({ message: "caseId required" }, 400);
      if (!rating || rating < 1 || rating > 5)
        return jsonResponse({ message: "rating must be 1-5" }, 400);

      const { data, error } = await supabase
        .from("customer_feedback")
        .insert({
          case_id:               caseId,
          customer_name:         customerName || "",
          rating:                Number(rating),
          feedback_text:         feedback_text || "",
          installation_quality:  installation_quality ? Number(installation_quality) : null,
          team_behavior:         team_behavior ? Number(team_behavior) : null,
          timeline_satisfaction: timeline_satisfaction ? Number(timeline_satisfaction) : null,
          submitted_by:          submitted_by || "admin",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return jsonResponse(data);
    }

    // ── GET FEEDBACK FOR A CASE (admin only) ───────────────────────────────
    if (action === "get_feedback") {
      if (user.role !== "admin") return jsonResponse({ message: "Forbidden" }, 403);

      const { caseId } = body;
      if (!caseId) return jsonResponse({ message: "caseId required" }, 400);

      const { data, error } = await supabase
        .from("customer_feedback")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return jsonResponse(data || []);
    }

    return jsonResponse({ message: "Unknown action" }, 400);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (err as any).message || "Internal error";
    const status = message.includes("Unauthorized") || message.includes("inactive") ? 401 : 500;
    return jsonResponse({ message, details: err }, status);
  }
});

// ─── JSON response helper ──────────────────────────────────────────────────────
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
