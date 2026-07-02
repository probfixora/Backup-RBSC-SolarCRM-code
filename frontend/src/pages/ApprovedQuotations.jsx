import React, { useState, useEffect } from "react";
import { supabase, edgeFetch, EDGE } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import { Search, UploadCloud, X, CheckCircle, UserCheck, Plus, Trash2 } from "lucide-react";

// ── Document Definitions ──────────────────────────────────────────────────────

// Core CASH docs — always shown for Cash cases (both Mandatory and Optional)
const CASH_MANDATORY_DOCS = [
  "Aadhar Card Front Photo",
  "Bank Details (Cancelled Cheque / Passbook)",
  "Electricity Bill",
  "GPS photo of site",
];
const CASH_OPTIONAL_DOCS = [
  "Aadhar Card Back Photo",
];

// LOAN docs — retain existing logic, replacing old single Aadhar with split ones
const LOAN_BASE_DOCS = [
  "Electricity Bill (Last 2 Months)",
  "Aadhar Card Front Photo",
  "Aadhar Card Back Photo",
  "PAN Card (Electricity Bill Owner)",
  "Bank Details (Cancelled Cheque / Account Number)",
  "Property Proof (House Tax Receipt / Registry Copy)",
  "GPS photo of site",
];
const LOAN_PROFILE_JOB_DOCS = [
  "3 Months Salary Slip",
  "6 Months Bank Statement",
  "Form 16 of Last 3 Years",
  "Last 3 Year ITR",
];
const LOAN_PROFILE_BIZ_DOCS = [
  "Last 3 Year ITR",
  "6 Months Bank Statement",
  "GST Certificate",
];

// Loan optional docs (Aadhar back is optional)
const LOAN_OPTIONAL_DOCS = ["Aadhar Card Back Photo"];

// Parse Electrical Load kW
const getKw = (q) => {
  if (q.electrical_load)
    return parseInt(String(q.electrical_load).replace(/kW$/i, ""), 10) || 0;
  if (q.total_watt) return Math.round(q.total_watt / 1000);
  return 0;
};

const getLoanBaseDocs = () => LOAN_BASE_DOCS;

const getLoanProfileDocs = (profile) =>
  profile === "Business" ? LOAN_PROFILE_BIZ_DOCS : LOAN_PROFILE_JOB_DOCS;

// Determine mandatory docs based on payment mode
// For loan >3kW: base mandatory + all profile docs are mandatory
const getMandatoryDocs = (paymentMode, kw, profile) => {
  if (paymentMode === "Cash") return CASH_MANDATORY_DOCS;
  const baseMandatory = LOAN_BASE_DOCS.filter((d) => !LOAN_OPTIONAL_DOCS.includes(d));
  if (kw > 3) {
    return [...baseMandatory, ...getLoanProfileDocs(profile)];
  }
  return baseMandatory;
};

// Base docs only — profile docs are rendered in a separate section below
const getAllBaseDocs = (paymentMode) => {
  if (paymentMode === "Cash") return [...CASH_MANDATORY_DOCS, ...CASH_OPTIONAL_DOCS];
  return LOAN_BASE_DOCS;
};

// ─────────────────────────────────────────────────────────────────────────────

const ApprovedQuotations = ({ onLogout }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuotation, setSelected] = useState(null);
  const [paymentMode, setPaymentMode] = useState(""); // "Cash" | "Loan"
  const [profile, setProfile] = useState("Job/Service");
  const [uploadingDocs, setUploadingDocs] = useState(new Set());
  const [sendingToReg, setSendingToReg] = useState(false);
  const [verifiedDocs, setVerifiedDocs] = useState({});
  const [handoffNote, setHandoffNote] = useState("");
  const [showHandoffModal, setShowHandoffModal] = useState(false);

  // Additional custom documents state
  const [additionalDocs, setAdditionalDocs] = useState([]); // [{name: "", file: null, uploading: false, url: ""}]
  const [newDocName, setNewDocName] = useState("");

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const data = await edgeFetch(EDGE.quotation, { action: "list" });
      setQuotations(
        (data || []).filter(
          (q) => q.status === "Approved" && q.current_department === "Sales",
        ),
      );
    } catch {
      toast.error("Failed to load approved quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const filtered = quotations.filter(
    (q) =>
      (q.customer_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (q.quotation_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customer_mobile || "").includes(searchTerm),
  );

  const openModal = (q) => {
    setSelected(q);
    setPaymentMode("");
    setProfile(
      q.customer_occupation === "Business" ? "Business" : "Job/Service",
    );
    setVerifiedDocs({});
    setHandoffNote("");
    setShowHandoffModal(false);
    setAdditionalDocs([]);
    setNewDocName("");
  };

  // Derived
  const kw = selectedQuotation ? getKw(selectedQuotation) : 0;
  const isAbove3kw = kw > 3; // profile docs required above 3kW
  const baseDocs = paymentMode ? getAllBaseDocs(paymentMode) : [];
  const mandatoryDocs = paymentMode ? getMandatoryDocs(paymentMode, kw, profile) : [];

  const uploaded = mandatoryDocs.filter(
    (d) => selectedQuotation?.documents?.[d],
  ).length;
  const allMandatoryUploaded =
    mandatoryDocs.length > 0 && uploaded === mandatoryDocs.length;

  const allMandatoryVerified =
    allMandatoryUploaded && mandatoryDocs.every((d) => verifiedDocs[d]);

  const isReadyToSend = allMandatoryVerified && paymentMode !== "";

  const handleProfileChange = async (p) => {
    setProfile(p);
    try {
      await edgeFetch(EDGE.quotation, {
        action: "update_status",
        id: selectedQuotation.id,
        customer_occupation: p,
      });
      setSelected((prev) => ({ ...prev, customer_occupation: p }));
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleFileUpload = async (e, docName) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDocs((prev) => new Set([...prev, docName]));
    try {
      const ext = file.name.split(".").pop();
      const safeDocName = docName.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${selectedQuotation.quotation_id}_${safeDocName}_${Date.now()}.${ext}`;
      const filePath = `${selectedQuotation.quotation_id}/${fileName}`;
      const { error } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (error && error.message?.includes("Bucket not found")) {
        const retry = await supabase.storage
          .from("Documents")
          .upload(filePath, file);
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      const publicUrl =
        urlData?.publicUrl ||
        supabase.storage.from("Documents").getPublicUrl(filePath).data
          .publicUrl;

      const newDocs = {
        ...(selectedQuotation.documents || {}),
        [docName]: publicUrl,
      };
      await edgeFetch(EDGE.quotation, {
        action: "update_status",
        id: selectedQuotation.id,
        documents: newDocs,
      });
      setSelected((prev) => ({ ...prev, documents: newDocs }));
      toast.success(`${docName} uploaded!`);
      fetchQuotations();
    } catch (err) {
      console.error(err);
      toast.error(
        `Error uploading ${docName}: ${err.message || JSON.stringify(err)}`,
      );
    } finally {
      setUploadingDocs((prev) => {
        const next = new Set(prev);
        next.delete(docName);
        return next;
      });
    }
  };

  const handleAddAdditionalDoc = () => {
    if (!newDocName.trim()) {
      toast.error("Please enter a document name first.");
      return;
    }
    setAdditionalDocs((prev) => [
      ...prev,
      { name: newDocName.trim(), uploading: false, url: "" },
    ]);
    setNewDocName("");
  };

  const handleRemoveAdditionalDoc = (idx) => {
    setAdditionalDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAdditionalDocUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    const doc = additionalDocs[idx];
    setAdditionalDocs((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, uploading: true } : d)),
    );

    try {
      const ext = file.name.split(".").pop();
      const safeDocName = doc.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${selectedQuotation.quotation_id}_ADDITIONAL_${safeDocName}_${Date.now()}.${ext}`;
      const filePath = `${selectedQuotation.quotation_id}/${fileName}`;

      const { error } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (error && error.message?.includes("Bucket not found")) {
        const retry = await supabase.storage
          .from("Documents")
          .upload(filePath, file);
        if (retry.error) throw retry.error;
      } else if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      const publicUrl =
        urlData?.publicUrl ||
        supabase.storage.from("Documents").getPublicUrl(filePath).data.publicUrl;

      // Save to quotation documents with a prefix for identification
      const docKey = `ADDITIONAL::${doc.name}`;
      const newDocs = {
        ...(selectedQuotation.documents || {}),
        [docKey]: publicUrl,
      };
      await edgeFetch(EDGE.quotation, {
        action: "update_status",
        id: selectedQuotation.id,
        documents: newDocs,
      });
      setSelected((prev) => ({ ...prev, documents: newDocs }));
      setAdditionalDocs((prev) =>
        prev.map((d, i) =>
          i === idx ? { ...d, uploading: false, url: publicUrl } : d,
        ),
      );
      toast.success(`${doc.name} uploaded!`);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
      setAdditionalDocs((prev) =>
        prev.map((d, i) => (i === idx ? { ...d, uploading: false } : d)),
      );
    }
  };

  const handleSendToRegClick = () => {
    if (!isReadyToSend) return;
    setShowHandoffModal(true);
  };

  const handleSendToReg = async () => {
    if (!handoffNote.trim()) {
      toast.error("Please write a handoff note before proceeding.");
      return;
    }
    setSendingToReg(true);
    try {
      const res = await edgeFetch(EDGE.quotation, {
        action: "send_to_registration",
        id: selectedQuotation.id,
        remarks: handoffNote.trim(),
        payment_mode: paymentMode,
      });
      if (res.success) {
        toast.success(`Case ${res.caseId} created — sent to Registration!`);
        setQuotations((prev) =>
          prev.filter((q) => q.id !== selectedQuotation.id),
        );
        setSelected(null);
        setShowHandoffModal(false);
      }
    } catch (err) {
      toast.error("Failed: " + err.message);
    } finally {
      setSendingToReg(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--page-bg)",
      }}
    >
      <Sidebar onLogout={onLogout} />

      <main
        style={{
          flex: 1,
          marginLeft: "var(--main-offset)",
          padding: "28px 32px",
        }}
      >
        <Header
          title="Approved Customers"
          subtitle="Upload required documents to convert a quotation into a Case"
          icon={<UserCheck style={{ width: 20, height: 20 }} />}
          onLogout={onLogout}
        />

        {/* ── Toolbar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "0 1 360px" }}>
            <Search
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "15px",
                height: "15px",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search by name, ID or mobile…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: "40px" }}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <>
          <div className="table-wrap hide-on-mobile">
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Quotation ID</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          textAlign: "center",
                          padding: "48px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        Loading approved customers…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          textAlign: "center",
                          padding: "56px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <UserCheck
                          style={{
                            width: "32px",
                            height: "32px",
                            margin: "0 auto 12px",
                            display: "block",
                            opacity: 0.35,
                          }}
                        />
                        No approved customers found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((q, idx) => (
                      <tr key={q.id}>
                        <td style={{ color: "var(--text-4)", fontWeight: 500 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "var(--text-1)",
                              marginBottom: "2px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {q.customer_name}
                          </p>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--color-text-secondary)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {q.customer_mobile || "—"}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              color: "var(--color-primary)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {q.quotation_id}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge badge-green">
                            <CheckCircle
                              style={{ width: "11px", height: "11px" }}
                            />
                            Approved
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            id={`upload-btn-${q.id}`}
                            onClick={() => openModal(q)}
                            className="btn btn-primary btn-sm"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <UploadCloud
                              style={{ width: "13px", height: "13px" }}
                            />
                            Upload Document
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-foot">
              {filtered.length} approved customer
              {filtered.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Mobile cards */}
          <div
            className="mobile-only"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "var(--color-text-muted)",
                }}
              >
                Loading approved customers…
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "56px",
                  color: "var(--color-text-muted)",
                  background: "var(--surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                }}
              >
                <UserCheck
                  style={{
                    width: "32px",
                    height: "32px",
                    margin: "0 auto 12px",
                    display: "block",
                    opacity: 0.35,
                  }}
                />
                No approved customers found
              </div>
            ) : (
              filtered.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    background: "var(--surface)",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--text-1)",
                      }}
                    >
                      {q.customer_name}
                    </span>
                    <span className="badge badge-green" style={{ padding: "4px 8px" }}>
                      <CheckCircle style={{ width: "11px", height: "11px" }} />
                      Approved
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                    }}
                  >
                    {q.quotation_id}
                  </div>
                  <button
                    id={`upload-btn-${q.id}-mob`}
                    onClick={() => openModal(q)}
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <UploadCloud style={{ width: "15px", height: "15px" }} />
                    Upload Document
                  </button>
                </div>
              ))
            )}
          </div>
        </>

        <Footer />
      </main>

      {/* ── Document Upload Modal ── */}
      {selectedQuotation && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div
            className="modal-card animate-scale-in"
            style={{
              maxWidth: "700px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-1)",
                    marginBottom: "4px",
                  }}
                >
                  Document Upload Gate
                </h2>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      background: "var(--color-primary-light)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {selectedQuotation.quotation_id}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-2)",
                    }}
                  >
                    {selectedQuotation.customer_name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent-light)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {kw} kW
                  </span>
                  {paymentMode && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        marginLeft: "auto",
                      }}
                    >
                      {uploaded}/{mandatoryDocs.length} mandatory uploaded
                    </span>
                  )}
                </div>
              </div>
              <button
                id="close-modal-btn"
                onClick={() => setSelected(null)}
                className="btn btn-ghost"
                style={{ padding: "6px", borderRadius: "50%", flexShrink: 0 }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>

              {/* ── Step 1: Payment Mode Selection ── */}
              <div
                style={{
                  marginBottom: "20px",
                  padding: "16px",
                  background: paymentMode ? "#f0fdf4" : "#fefce8",
                  border: `1px solid ${paymentMode ? "#86efac" : "#fde68a"}`,
                  borderRadius: "var(--radius-md)",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: paymentMode ? "#166534" : "#92400e",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {paymentMode ? "✅" : "⚠️"} Step 1: Select Payment Mode
                  <span
                    style={{
                      fontSize: "10px",
                      background: "#fef08a",
                      color: "#713f12",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 700,
                    }}
                  >
                    REQUIRED
                  </span>
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  {["Cash", "Loan"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "8px",
                        border: `2px solid ${paymentMode === mode ? (mode === "Cash" ? "#16a34a" : "#2563eb") : "#e2e8f0"}`,
                        background:
                          paymentMode === mode
                            ? mode === "Cash"
                              ? "#dcfce7"
                              : "#dbeafe"
                            : "#fff",
                        color:
                          paymentMode === mode
                            ? mode === "Cash"
                              ? "#166534"
                              : "#1e40af"
                            : "#64748b",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {mode === "Cash" ? "💵" : "🏦"} {mode}
                    </button>
                  ))}
                </div>
                {paymentMode === "Cash" && (
                  <p style={{ marginTop: "10px", fontSize: "12px", color: "#166534", fontWeight: 500 }}>
                    Cash case: Only 5 documents required (4 mandatory + 1 optional Aadhar back).
                  </p>
                )}
                {paymentMode === "Loan" && (
                  <p style={{ marginTop: "10px", fontSize: "12px", color: "#1e40af", fontWeight: 500 }}>
                    Loan case: Documents required based on system capacity and customer profile.
                  </p>
                )}
              </div>

              {/* ── Documents Section (only shown after payment mode selected) ── */}
              {paymentMode && (
                <>
                  {/* Loan: Profile Selector (>3kW) */}
                  {paymentMode === "Loan" && isAbove3kw && (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "14px",
                        background: "var(--color-info-light)",
                        border: "1px solid #BFDBFE",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1E3A8A",
                          marginBottom: "10px",
                        }}
                      >
                        Select Customer Profile
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            background: "var(--color-danger-light)",
                            color: "var(--color-danger)",
                            padding: "2px 7px",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 700,
                          }}
                        >
                          {kw} kW — Profile docs required
                        </span>
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {[
                          { key: "Job/Service", label: "💼 Job / Service", count: LOAN_PROFILE_JOB_DOCS.length },
                          { key: "Business", label: "🏢 Business", count: LOAN_PROFILE_BIZ_DOCS.length },
                        ].map(({ key, label, count }) => (
                          <button
                            key={key}
                            type="button"
                            id={`profile-${key.replace(/\//g, "-")}`}
                            onClick={() => handleProfileChange(key)}
                            className={
                              profile === key
                                ? "btn btn-primary btn-sm"
                                : "btn btn-secondary btn-sm"
                            }
                          >
                            {label}
                            <span style={{ opacity: 0.75, fontWeight: 500 }}>
                              (+{count})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document section label */}
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-text-muted)",
                      marginBottom: "10px",
                    }}
                  >
                    📋 {paymentMode === "Cash" ? "Required Documents" : "Base Documents"}
                  </p>

                  {/* Document rows */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    {baseDocs.map((doc, idx) => {
                      const isMandatory = mandatoryDocs.includes(doc);
                      return (
                        <DocRow
                          key={doc}
                          idx={idx}
                          docName={doc}
                          isMandatory={isMandatory}
                          isUploaded={!!selectedQuotation.documents?.[doc]}
                          isUploading={uploadingDocs.has(doc)}
                          fileUrl={selectedQuotation.documents?.[doc]}
                          onUpload={handleFileUpload}
                          isVerified={verifiedDocs[doc]}
                          onVerify={() =>
                            setVerifiedDocs((prev) => ({ ...prev, [doc]: true }))
                          }
                        />
                      );
                    })}

                    {/* Loan: profile-specific docs (>3kW) */}
                    {paymentMode === "Loan" && isAbove3kw && (
                      <>
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "var(--color-primary)",
                            marginTop: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          {profile === "Business"
                            ? "🏢 Business Profile Documents"
                            : "💼 Job / Service Profile Documents"}
                        </p>
                        {(profile === "Business"
                          ? LOAN_PROFILE_BIZ_DOCS
                          : LOAN_PROFILE_JOB_DOCS
                        ).map((doc, idx) => {
                          const isMandatory = mandatoryDocs.includes(doc);
                          return (
                            <DocRow
                              key={doc}
                              idx={LOAN_BASE_DOCS.length + idx}
                              docName={doc}
                              isMandatory={isMandatory}
                              isUploaded={!!selectedQuotation.documents?.[doc]}
                              isUploading={uploadingDocs.has(doc)}
                              fileUrl={selectedQuotation.documents?.[doc]}
                              onUpload={handleFileUpload}
                              badge={
                                profile === "Business" ? "BUSINESS" : "JOB/SERVICE"
                              }
                              isVerified={verifiedDocs[doc]}
                              onVerify={() =>
                                setVerifiedDocs((prev) => ({
                                  ...prev,
                                  [doc]: true,
                                }))
                              }
                            />
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* ── Additional Documents ── */}
                  <div
                    style={{
                      borderTop: "1px dashed var(--border)",
                      paddingTop: "16px",
                      marginBottom: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-text-muted)",
                        marginBottom: "10px",
                      }}
                    >
                      📎 Additional Documents (Optional)
                    </p>

                    {/* Add new additional doc */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Document name (e.g. NOC Letter)"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddAdditionalDoc();
                        }}
                        className="input"
                        style={{ flex: 1, fontSize: "13px" }}
                      />
                      <button
                        type="button"
                        onClick={handleAddAdditionalDoc}
                        className="btn btn-secondary btn-sm"
                        style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Plus style={{ width: "13px", height: "13px" }} />
                        Add
                      </button>
                    </div>

                    {/* List of additional docs */}
                    {additionalDocs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {additionalDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              borderRadius: "var(--radius-md)",
                              border: `1px solid ${doc.url ? "#A7F3D0" : "var(--color-border)"}`,
                              background: doc.url ? "var(--color-accent-light)" : "var(--color-surface)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "26px",
                                  height: "26px",
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: doc.url ? "var(--color-accent)" : "var(--surface-2)",
                                  color: doc.url ? "#fff" : "var(--text-4)",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                }}
                              >
                                {doc.url ? <CheckCircle style={{ width: "13px", height: "13px" }} /> : "📎"}
                              </div>
                              <div>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: doc.url ? "#065F46" : "var(--text-2)" }}>
                                  {doc.name}
                                </span>
                                <span style={{ fontSize: "10px", color: "var(--text-4)", marginLeft: "6px" }}>
                                  Optional
                                </span>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: "5px 10px", fontSize: "12px" }}
                                >
                                  View
                                </a>
                              ) : (
                                <label
                                  className="btn btn-primary btn-sm"
                                  style={{
                                    cursor: doc.uploading ? "not-allowed" : "pointer",
                                    opacity: doc.uploading ? 0.6 : 1,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontSize: "12px",
                                  }}
                                >
                                  {doc.uploading ? "Uploading…" : (
                                    <>
                                      <UploadCloud style={{ width: "12px", height: "12px" }} />
                                      Upload
                                    </>
                                  )}
                                  {!doc.uploading && (
                                    <input
                                      type="file"
                                      style={{ display: "none" }}
                                      onChange={(e) => handleAdditionalDocUpload(e, idx)}
                                      accept=".pdf,image/*"
                                    />
                                  )}
                                </label>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveAdditionalDoc(idx)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#ef4444",
                                  padding: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                title="Remove this document"
                              >
                                <Trash2 style={{ width: "14px", height: "14px" }} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border)",
                paddingTop: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isReadyToSend
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                }}
              >
                {!paymentMode
                  ? "⚠️ Select payment mode to begin"
                  : isReadyToSend
                  ? "✅ All mandatory documents ready!"
                  : `⏳ ${mandatoryDocs.length - uploaded} mandatory document(s) remaining`}
              </span>
              <button
                id="send-to-registration-btn"
                disabled={!isReadyToSend || sendingToReg}
                onClick={handleSendToRegClick}
                className={
                  isReadyToSend && !sendingToReg
                    ? "btn btn-primary"
                    : "btn btn-secondary"
                }
                style={{
                  cursor:
                    !isReadyToSend || sendingToReg ? "not-allowed" : "pointer",
                  opacity: !isReadyToSend ? 0.55 : 1,
                }}
              >
                {sendingToReg ? "Processing…" : "Verify Documents & Send to Registration →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Handoff Note Modal ── */}
      {showHandoffModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHandoffModal(false);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  ✏️ Handoff Note
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  Required before sending to Registration
                </p>
              </div>
              <button
                onClick={() => setShowHandoffModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            <div
              style={{
                padding: "12px 14px",
                background: paymentMode === "Loan" ? "#eff6ff" : "#f0fdf4",
                border: `1px solid ${paymentMode === "Loan" ? "#bfdbfe" : "#86efac"}`,
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "12px",
                color: paymentMode === "Loan" ? "#1e40af" : "#166534",
                fontWeight: 500,
              }}
            >
              {paymentMode === "Loan"
                ? "🏦 Loan case — please mention the bank name and any loan-related details."
                : "💵 Cash case — please add a note for the Registration team (e.g. installation timeline, special instructions)."}
            </div>

            <textarea
              value={handoffNote}
              onChange={(e) => setHandoffNote(e.target.value)}
              placeholder={
                paymentMode === "Loan"
                  ? "e.g. Loan approved via HDFC Bank. EMI starts next month. Customer to sign at registration..."
                  : "e.g. Customer paid full cash. Priority installation requested for next week..."
              }
              rows={5}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `2px solid ${handoffNote.trim() ? "#16a34a" : "#e2e8f0"}`,
                fontSize: "13px",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
                background: "#f8fafc",
              }}
            />
            {!handoffNote.trim() && (
              <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "6px", fontWeight: 600 }}>
                * This note is mandatory before sending.
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowHandoffModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendToReg}
                disabled={!handoffNote.trim() || sendingToReg}
                className={handoffNote.trim() && !sendingToReg ? "btn btn-primary" : "btn btn-secondary"}
                style={{
                  cursor: !handoffNote.trim() || sendingToReg ? "not-allowed" : "pointer",
                  opacity: !handoffNote.trim() ? 0.55 : 1,
                  fontSize: "13px",
                }}
              >
                {sendingToReg ? "Sending…" : "Confirm & Send to Registration →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Reusable Document Row ─────────────────────────────────────────────────────
const DocRow = ({
  idx,
  docName,
  isMandatory,
  isUploaded,
  isUploading,
  fileUrl,
  onUpload,
  badge,
  isVerified,
  onVerify,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderRadius: "var(--radius-md)",
      border: `1px solid ${isUploaded ? "#A7F3D0" : badge ? "#BFDBFE" : "var(--color-border)"}`,
      background: isUploaded
        ? "var(--color-accent-light)"
        : badge
          ? "var(--color-info-light)"
          : "var(--color-surface)",
      transition: "all 0.2s ease",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isUploaded
            ? "var(--color-accent)"
            : badge
              ? "var(--color-info)"
              : "var(--surface-2)",
          color: isUploaded || badge ? "#fff" : "var(--text-4)",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        {isUploaded ? (
          <CheckCircle style={{ width: "14px", height: "14px" }} />
        ) : (
          idx + 1
        )}
      </div>
      <div>
        <span
          style={{
            fontSize: "13.5px",
            fontWeight: 500,
            color: isUploaded ? "#065F46" : "var(--text-2)",
          }}
        >
          {docName}
        </span>
        {isMandatory ? (
          <span
            style={{
              marginLeft: "6px",
              fontSize: "10px",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            *
          </span>
        ) : (
          <span
            style={{
              marginLeft: "6px",
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            Optional
          </span>
        )}
        {badge && (
          <span
            className="badge badge-indigo"
            style={{ fontSize: "10px", padding: "2px 7px", marginLeft: "6px" }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>

    <div style={{ flexShrink: 0, marginLeft: "12px" }}>
      {isUploaded ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ padding: "5px 10px", fontSize: "12px" }}
          >
            View
          </a>
          {!isVerified ? (
            <>
              <label
                className="btn btn-secondary btn-sm"
                style={{ cursor: "pointer", fontSize: "12px" }}
              >
                Replace
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => onUpload(e, docName)}
                  accept=".pdf,image/*"
                />
              </label>
              <button
                type="button"
                onClick={onVerify}
                className="btn btn-primary btn-sm"
                style={{ fontSize: "12px" }}
              >
                Verify
              </button>
            </>
          ) : (
            <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700, padding: "5px 10px" }}>
              Verified ✅
            </span>
          )}
        </div>
      ) : (
        <label
          className="btn btn-primary btn-sm"
          style={{
            cursor: isUploading ? "not-allowed" : "pointer",
            opacity: isUploading ? 0.6 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {isUploading ? (
            "Uploading…"
          ) : (
            <>
              <UploadCloud style={{ width: "13px", height: "13px" }} />
              Upload
            </>
          )}
          {!isUploading && (
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => onUpload(e, docName)}
              accept=".pdf,image/*"
            />
          )}
        </label>
      )}
    </div>
  </div>
);

export default ApprovedQuotations;
