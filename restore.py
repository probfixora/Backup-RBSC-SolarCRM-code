import sys

with open('supabase/functions/quotation/index.ts', 'r', encoding='utf-8') as f:
    current = f.read()

# I will append the deleted code exactly as it was.
append_code = """
// ─── PDF Generation via Puppeteer (Browserless) or Fallback API ────────────────
async function generatePDF(q: Record<string, unknown>): Promise<Uint8Array> {
  const html = generateProposalHTML(q, logoBase64);
  const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");

  // Attempt 1: If Browserless Key is provided (Preferred Puppeteer method)
  if (browserlessKey) {
    const res = await fetch(`https://chrome.browserless.io/pdf?token=${browserlessKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: html,
        options: {
          format: "A4",
          printBackground: true,
          margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" } // margins handled in CSS
        },
        gotoOptions: {
          waitUntil: "networkidle0" // Wait for Tailwind CDN
        }
      })
    });
    if (res.ok) {
      return new Uint8Array(await res.arrayBuffer());
    } else {
      console.error("Browserless API failed, falling back...", await res.text());
    }
  }

  // Attempt 2: Fallback to open source API for converting HTML to PDF
  const fallbackRes = await fetch("https://api.html2pdf.app/v1/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: html })
  });

  if (fallbackRes.ok) {
    return new Uint8Array(await fallbackRes.arrayBuffer());
  }

  throw new Error("PDF generation failed. Please configure BROWSERLESS_API_KEY for robust Puppeteer PDF generation.");
}

// ─── Email via Brevo HTTP API ──────────────────────────────────────────────────
async function sendEmail(q: any, pdfBytes: Uint8Array) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const gmailEmail = Deno.env.get("GMAIL_EMAIL");
  
  if (!brevoApiKey) throw new Error("BREVO_API_KEY not configured");
  if (!gmailEmail) throw new Error("GMAIL_EMAIL not configured");

  // Convert Uint8Array to base64 for the PDF attachment
  const binaryString = Array.from(pdfBytes).map(b => String.fromCharCode(b)).join('');
  const b64 = btoa(binaryString);

  const dateStr = new Date(q.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  const price = Number(q.product_price || 0).toLocaleString('en-IN');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:620px;margin:30px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#ffffff,#f9f9f9);padding:20px 36px;border-bottom:3px solid #16a34a;text-align:center;}
.header img{max-height:60px;margin-bottom:10px;}
.header h1{margin:0;font-size:22px;color:#1a1a5e;}.header p{margin:4px 0 0;font-size:13px;color:#666;}
.body{padding:28px 36px}.badge{display:inline-block;background:#eef2ff;color:#4f46e5;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:20px}
.greeting{font-size:18px;font-weight:bold;color:#1e1b4b;margin-bottom:10px}
.intro{font-size:14px;color:#374151;line-height:1.6}
table{width:100%;border-collapse:collapse;margin:24px 0;font-size:13px}
th,td{padding:12px 16px;text-align:left;border-bottom:1px solid #e5e7eb}
th{background:#f9fafb;color:#4b5563;font-weight:600}
td{color:#111827}
.total-row td{background:#f3f4f6;font-weight:bold;font-size:15px;color:#111827}
.footer{background:#f9fafb;padding:20px 36px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="wrap">
  <div class="header">
    <img src="data:image/png;base64,${logoBase64}" alt="RBSC Solar Logo"/>
    <h1>RBSC Solar</h1><p>Innovative Energy Technology</p>
  </div>
  <div class="body">
    <div class="badge">Solar Quotation</div>
    <div class="greeting">Dear ${q.customer_name},</div>
    <p class="intro">Thank you for choosing <strong>RBSC Solar</strong>! Please find your solar system quotation PDF attached.</p>
    <table>
      <tr><th colspan="2">Quotation Summary</th></tr>
      <tr><td>Quotation ID</td><td><strong>${q.quotation_id}</strong></td></tr>
      <tr><td>Date</td><td>${dateStr}</td></tr>
      <tr><td>System Type</td><td>${q.product_category}</td></tr>
      <tr><td>Panel Brand</td><td>${q.product_brand}</td></tr>
      <tr><td>System Capacity</td><td>${q.panel_unit}</td></tr>
      <tr class="total-row"><td>Total Quotation Price</td><td>&#8377;${price}</td></tr>
    </table>
    <p class="intro">Our team will contact you shortly. Feel free to reach out for any queries.</p>
    <p class="intro"><strong>Warm regards,</strong><br/>RBSC Solar Team</p>
  </div>
  <div class="footer">&#169; ${new Date().getFullYear()} RBSC Solar. All rights reserved.</div>
</div>
</body></html>`;

  const payload = {
    sender: {
      name: "RBSC Solar",
      email: gmailEmail,
    },
    to: [
      {
        email: q.customer_email as string,
      },
    ],
    subject: `Your Solar Quotation ${q.quotation_id} – RBSC Solar`,
    htmlContent: html,
    attachment: [
      {
        name: `Quotation_${q.quotation_id}.pdf`,
        content: b64,
      },
    ],
  };

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
    const errorData = await res.text();
    throw new Error(`Brevo API error: ${errorData}`);
  }

  const result = await res.json();
  console.log(`✅ Quotation email sent via Brevo to ${q.customer_email}, Message ID: ${result.messageId}`);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const user = await getUser(req, supabase);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "";

    // ── CREATE QUOTATION ───────────────────────────────────────────────────
    if (action === "create") {
      if (user.role !== "sales" && user.role !== "admin") {
        return jsonResponse({ message: "Only sales team can create quotations" }, 403);
      }

      const { data: quotation, error } = await supabase
        .from("quotations")
        .insert({
          customer_name: body.customerName,
          customer_mobile: body.customerMobile,
          customer_email: body.customerEmail,
          customer_address: body.customerAddress,
          electrical_division: body.electricalDivision,
          electrical_number: body.electricalNumber,
          electrical_load: body.electricalLoad,
          product_category: body.productCategory,
          product_brand: body.productBrand,
          product_name: body.productName || "",
          panel_unit: body.panelUnit,
          panel_count: body.panelCount,
          total_watt: body.totalWatt,
          product_price: body.productPrice,
          panel_warranty: body.panelWarranty,
          inverter_brand: body.inverterBrand,
          inverter_kw: body.inverterKw,
          inverter_warranty: body.inverterWarranty,
          battery_brand: body.batteryBrand || null,
          battery_count: body.batteryCount || 0,
          battery_warranty: body.batteryWarranty || null,
          battery_capacity: body.batteryCapacity || 0,
          battery_price: body.batteryPrice || 0,
          structure: body.structure,
          bos: body.bos,
          employee_id: body.employeeId,
          employee_name: body.employeeName,
          employee_email: body.employeeEmail,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate PDF, upload to storage, send email
      try {
        const pdfBytes = await generatePDF(quotation);
        
        // Ensure customer email is present before sending
        if (!quotation.customer_email) {
          throw new Error("No customer email provided for quotation.");
        }

        // Upload PDF to Supabase Storage (Quotations bucket)
        const fileName = `Quotation_${quotation.quotation_id}.pdf`;
        const { error: storageError } = await supabase.storage
          .from("Quotations")
          .upload(fileName, pdfBytes, {
            contentType: "application/pdf",
            upsert: true, // Overwrite if exists
          });
        
        if (storageError) {
          console.error("Failed to upload PDF to storage:", storageError);
          // We can continue to email even if storage fails, but good to log
        } else {
          console.log(`✅ PDF uploaded to storage: ${fileName}`);
        }

        // Send email
        await sendEmail(quotation, pdfBytes);
        console.log(`✅ Email sent to ${quotation.customer_email}`);
      } catch (err) {
        console.error("PDF/Email error:", err);
        // Returning error for debugging purposes to see why Brevo fails
        return jsonResponse({ success: false, message: `Email failed: ${String(err)}` }, 500);
      }

      return jsonResponse({ success: true, message: "Quotation created and emailed.", data: quotation }, 201);
    }

    // ── GET ALL QUOTATIONS ─────────────────────────────────────────────────
    if (action === "list") {
      let query = supabase.from("quotations").select("*").order("created_at", { ascending: false });

      if (user.role === "sales") {
        query = query.eq("created_by", user.id);
      } else if (user.role === "registration") {
        query = query.eq("current_department", "Registration");
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // ── GET ONE QUOTATION ──────────────────────────────────────────────────
    if (action === "get_one") {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", body.id)
        .single();
      if (error) return jsonResponse({ message: "Quotation not found" }, 404);
      return jsonResponse(data);
    }

    // ── UPDATE STATUS / DETAILS ────────────────────────────────────────────
    if (action === "update_status") {
      const updatePayload: Record<string, unknown> = {};
      if (body.status) updatePayload.status = body.status;
      if (body.currentDepartment) updatePayload.current_department = body.currentDepartment;
      if (body.customer_occupation) updatePayload.customer_occupation = body.customer_occupation;
      if (body.documents) updatePayload.documents = body.documents;

      const { data, error } = await supabase
        .from("quotations")
        .update(updatePayload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) {
        return jsonResponse({ message: `Quotation update failed: ${error.message}` }, 400);
      }
      return jsonResponse({ success: true, data });
    }

    // ── SEND TO REGISTRATION (Converts Quotation -> Case) ──────────────────
    if (action === "send_to_registration") {
      if (user.role !== "sales" && user.role !== "admin") {
        return jsonResponse({ message: "Only sales or admin can send to registration" }, 403);
      }

      const { data: q, error: qErr } = await supabase.from("quotations").select("*").eq("id", body.id).single();
      if (qErr) return jsonResponse({ message: "Quotation not found" }, 404);

      const { data: newCase, error: caseErr } = await supabase.from("cases").insert({
        customer_name: q.customer_name,
        phone: q.customer_mobile,
        email: q.customer_email,
        address: q.customer_address,
        load_required: Number(q.total_watt || 0),
        payment_type: 'cash', // Default fallback
        assigned_team: 'Registration',
        status: 'In Progress',
        current_stage: 'Registration Done',
        documents: q.documents || {},
        created_by: user.id,
      }).select().single();

      if (caseErr) return jsonResponse({ message: `Case creation failed: ${caseErr.message}` }, 400);

      const { error: updErr } = await supabase.from("quotations").update({
        current_department: "Registration"
      }).eq("id", body.id);

      if (updErr) return jsonResponse({ message: `Quotation update failed: ${updErr.message}` }, 400);

      return jsonResponse({ success: true, caseId: newCase.case_id });
    }

    // ── CATALOG PRODUCTS (static lookup) ──────────────────────────────────
    if (action === "catalog_products") {
      const products = [
        { id: "p1", name: "Luminous 335W Mono", watt: 335, price: 15000, categoryId: "Off Grid", brandId: "Luminous" },
        { id: "p2", name: "Luminous 440W Bifacial", watt: 440, price: 20000, categoryId: "On Grid", brandId: "Luminous" },
        { id: "p3", name: "Tata 330W Poly", watt: 330, price: 12000, categoryId: "Off Grid", brandId: "Tata Power" },
        { id: "p4", name: "Tata 545W Mono", watt: 545, price: 25000, categoryId: "On Grid", brandId: "Tata Power" },
        { id: "p5", name: "Adani 330W Poly", watt: 330, price: 11000, categoryId: "Off Grid", brandId: "Adani" },
        { id: "p6", name: "Adani 540W Mono", watt: 540, price: 24000, categoryId: "On Grid", brandId: "Adani" },
      ];
      const filtered = products.filter(
        (p) =>
          (!body.categoryId || p.categoryId === body.categoryId) &&
          (!body.brandId || p.brandId === body.brandId)
      );
      return jsonResponse(filtered);
    }

    return jsonResponse({ message: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ message }, message.includes("Unauthorized") ? 401 : 500);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
"""

with open('supabase/functions/quotation/index.ts', 'w', encoding='utf-8') as f:
    f.write(current + "\n" + append_code)
