import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { edgeFetch, EDGE } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { Search, Download, UserPlus, Pencil, Trash2, X, User, Briefcase, CreditCard, AlertTriangle } from "lucide-react";
import { State, City } from "country-state-city";

// ── Helpers ────────────────────────────────────────────────────────────────────

const roleMeta = {
  admin: { label: "Admin", color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe" },
  sales: { label: "Sales", color: "#065f46", bg: "#dcfce7", border: "#a7f3d0" },
  registration: { label: "Registration", color: "#7e22ce", bg: "#fdf4ff", border: "#e9d5ff" },
  banking: { label: "Banking & Finance", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  inventory: { label: "Inventory", color: "#9f1239", bg: "#fff1f2", border: "#fecdd3" },
  field_installation: { label: "Installation", color: "#075985", bg: "#e0f2fe", border: "#bae6fd" },
  electrical: { label: "Electrical", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  subsidy: { label: "Subsidy", color: "#9a3412", bg: "#fff7ed", border: "#fed7aa" },
  technical: { label: "Technical QA", color: "#155e75", bg: "#ecfeff", border: "#a5f3fc" },
  accounts: { label: "Accounts", color: "#3f6212", bg: "#f7fee7", border: "#bef264" },
  customer_service: { label: "Customer Service", color: "#5b21b6", bg: "#f5f3ff", border: "#ddd6fe" },
  procurement: { label: "Procurement", color: "#ca8a04", bg: "#fefce8", border: "#fef08a" },
};
const getRoleMeta = (r) =>
  roleMeta[r] || { label: r || "—", color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" };

const AVATAR_COLORS = ["#D97706", "#2563EB", "#7C3AED", "#059669", "#DC2626", "#0891B2", "#DB2777", "#9333ea"];
const avatarColor = (name = "") => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
};

const fmtDateShort = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// ── Add Employee Modal ─────────────────────────────────────────────────────────
const AddEmployeeModal = ({ onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    role: "",
    mobile: "",
    countryCode: "IN +91",
    dob: "",
    country: "India",
    stateIsoCode: "",
    state: "",
    city: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const indianStates = State.getStatesOfCountry("IN");
  const citiesOfState = form.stateIsoCode ? City.getCitiesOfState("IN", form.stateIsoCode) : [];

  const handleStateChange = (e) => {
    const isoCode = e.target.value;
    const selected = indianStates.find(s => s.isoCode === isoCode);
    setForm(prev => ({ ...prev, stateIsoCode: isoCode, state: selected ? selected.name : "", city: "" }));
  };

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (k === 'name') {
      const nameParts = val.trim().split(/\s+/);
      let initials = "";
      if (val.trim() === "") {
        initials = "";
      } else if (nameParts.length > 1) {
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
        initials = nameParts[0].substring(0, 2).toUpperCase();
      } else if (nameParts.length === 1) {
        initials = nameParts[0].toUpperCase() + "X";
      } else {
        initials = "XX";
      }
      const random5 = Math.floor(10000 + Math.random() * 90000);
      const generatedId = initials ? `RBSC${initials}${random5}` : "";
      setForm((prev) => ({ ...prev, name: val, employeeId: prev.employeeId && prev.employeeId.startsWith(`RBSC${initials}`) ? prev.employeeId : generatedId }));
    } else {
      setForm((prev) => ({ ...prev, [k]: val }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Full Name cannot be empty");
    if (!form.email.trim()) return toast.error("Work Email ID cannot be empty");
    if (!form.role) return toast.error("Please select a role");

    setSaving(true);
    try {
      await edgeFetch(EDGE.admin, {
        action: "create_user",
        employeeId: form.employeeId.trim() || undefined,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        mobile: form.mobile.trim(),
        dob: form.dob,
        state: form.state,
        city: form.city,
      });
      toast.success("Employee registered successfully!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "13.5px", color: "#1f2937",
    outline: "none", background: "#fff", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontSize: "12.5px", fontWeight: 600,
    color: "#374151", marginBottom: "5px",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px", overflow: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#f8fafc", borderRadius: "12px", width: "560px", maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden", margin: "auto", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "#4338ca", padding: "18px", textAlign: "center", position: "relative" }}>
          <h2 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, margin: 0 }}>Register New Employee</h2>
          <button type="button" onClick={onClose} style={{ position: "absolute", right: "16px", top: "18px", background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex" }}>
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 30px", background: "#fff", overflowY: "auto", flex: 1 }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Employee ID</label>
                <input type="text" value={form.employeeId} onChange={set("employeeId")} style={{ ...inputStyle, background: "#f8fafc" }} placeholder="Auto-generated" />
              </div>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" value={form.name} onChange={set("name")} style={inputStyle} placeholder="Enter full name" required />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email ID</label>
              <input type="email" value={form.email} onChange={set("email")} style={inputStyle} placeholder="Enter email" required />
            </div>

            <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Select Department</label>
                <select value={form.role} onChange={set("role")} style={{ ...inputStyle, cursor: "pointer" }} required>
                  <option value="">Select department</option>
                  {Object.entries(roleMeta).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <div style={{ ...inputStyle, padding: 0, display: "flex", overflow: "hidden" }}>
                  <select value={form.countryCode} onChange={set("countryCode")} style={{ border: "none", background: "transparent", outline: "none", padding: "9px 8px", width: "85px", borderRight: "1px solid #d1d5db", cursor: "pointer" }}>
                    <option value="IN +91">IN +91</option>
                  </select>
                  <input type="tel" value={form.mobile} onChange={set("mobile")} style={{ border: "none", background: "transparent", outline: "none", flex: 1, padding: "9px 12px", width: "100%" }} placeholder="Mobile number" />
                </div>
              </div>
            </div>

            <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input type="date" value={form.dob} onChange={set("dob")} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input type="text" value={form.country} readOnly style={{ ...inputStyle, background: "#e2e8f0", color: "#64748b" }} />
              </div>
            </div>

            <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>State</label>
                <select value={form.stateIsoCode} onChange={handleStateChange} style={{ ...inputStyle, cursor: "pointer" }} required>
                  <option value="">Select State</option>
                  {indianStates.map(st => (
                    <option key={st.isoCode} value={st.isoCode}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <select value={form.city} onChange={set("city")} style={{ ...inputStyle, cursor: "pointer" }} required disabled={!form.stateIsoCode}>
                  <option value="">Select City</option>
                  {citiesOfState.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "16px 0 8px 0" }}>
              <input type="checkbox" id="termsAgreeModal" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} required style={{ cursor: "pointer" }} />
              <label htmlFor="termsAgreeModal" style={{ fontSize: "13px", color: "#4b5563", cursor: "pointer" }}>
                I agree to all statements in <a href="/terms-of-service" target="_blank" rel="noreferrer" style={{ color: "#4338ca", textDecoration: "none" }}>Terms of Service</a>
              </label>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button type="submit" disabled={saving || !agreedToTerms} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#4338ca", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: saving || !agreedToTerms ? "not-allowed" : "pointer", opacity: saving || !agreedToTerms ? 0.8 : 1 }}>
                {saving ? "Registering..." : "Register"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};


// ── Employee Details Full Page View ──────────────────────────────────────────────
const EmployeeDetailsView = ({ user, onClose, onSaved }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: user.employeeId || "",
    name: user.name || "",
    mobile: user.mobile ? user.mobile.replace(/^\+91\s*/, "") : "",
    dob: user.dob || "",
    gender: user.gender || "",
    country: user.country || "India",
    state: user.state || "",
    city: user.city || "",
    emergencyName: user.emergencyName || "",
    emergencyPhone: user.emergencyPhone || "",
    homeAddress: user.homeAddress || "",
    bankName: user.bankName || "",
    branchName: user.branchName || "",
    accountNumber: user.accountNumber || "",
    ifscCode: user.ifscCode || "",
    experienceYears: user.experienceYears || "",
    companyName: user.companyName || "",
    workLocation: user.workLocation || "",
    professionalDesignation: user.professionalDesignation || "",
    lastCtc: user.lastCtc || "",
    aadharCard: user.aadharCard || "",
    panCard: user.panCard || "",
  });

  const indianStates = State.getStatesOfCountry("IN");
  const currentIsoCode = indianStates.find(s => s.name === form.state)?.isoCode;
  const citiesOfState = currentIsoCode ? City.getCitiesOfState("IN", currentIsoCode) : [];

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      await edgeFetch(EDGE.admin, {
        action: "update_user",
        userId: user.id,
        employeeId: form.employeeId.trim(),
        name: form.name.trim(),
        mobile: form.mobile.trim() ? `+91 ${form.mobile.trim()}` : "",
        dob: form.dob,
        gender: form.gender,
        state: form.state,
        city: form.city.trim(),
        emergencyName: form.emergencyName.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
        homeAddress: form.homeAddress.trim(),
        bankName: form.bankName.trim(),
        branchName: form.branchName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim(),
        experienceYears: form.experienceYears.trim(),
        companyName: form.companyName.trim(),
        workLocation: form.workLocation.trim(),
        professionalDesignation: form.professionalDesignation.trim(),
        lastCtc: form.lastCtc.trim(),
        aadharCard: form.aadharCard.trim(),
        panCard: form.panCard.trim(),
      });
      toast.success("Details updated successfully!");
      onSaved(user.id, form.name.trim(), form.mobile.trim() ? `+91 ${form.mobile.trim()}` : "", form.employeeId.trim());
      onClose();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const rm = getRoleMeta(user.role);
  const color = avatarColor(user.name);

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13.5px",
    color: "#1f2937",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block",
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "5px",
  };
  const navItem = (tab, Icon, label) => (
    <div
      onClick={() => setActiveTab(tab)}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: activeTab === tab ? 700 : 500,
        color: activeTab === tab ? "#2563EB" : "#6b7280",
        background: activeTab === tab ? "#eff6ff" : "transparent",
        marginBottom: "2px",
      }}
    >
      <Icon style={{ width: "15px", height: "15px" }} />
      {label}
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f9fafb", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1d3a6e 0%, #2563EB 100%)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        gap: "16px"
      }}>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            color: "#fff", borderRadius: "6px", width: "36px", height: "36px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Back to Employee List"
        >
          <X style={{ width: "20px", height: "20px" }} />
        </button>
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: "18px", margin: 0 }}>Employee Details</p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: "2px 0 0" }}>{user.name}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="employee-details-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar */}
        <div className="employee-details-sidebar" style={{
          width: "250px",
          flexShrink: 0,
          borderRight: "1px solid #e5e7eb",
          background: "#fff",
          padding: "32px 20px",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px", fontWeight: 700, color: "#fff",
              margin: "0 auto 10px",
            }}>
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <p style={{ fontWeight: 700, fontSize: "14px", color: "#111827", margin: "0 0 2px" }}>{user.name}</p>
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 8px", wordBreak: "break-all" }}>{user.email}</p>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563EB", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>
              {user.employeeId || "N/A"}
            </span>
            <br />
            <span style={{
              display: "inline-block", marginTop: "6px",
              fontSize: "11.5px", fontWeight: 600,
              color: rm.color, background: rm.bg,
              border: `1px solid ${rm.border}`,
              padding: "2px 10px", borderRadius: "20px",
            }}>
              {rm.label}
            </span>
          </div>

          {/* Nav */}
          <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", padding: "0 4px", marginBottom: "6px" }}>
            Dashboard
          </p>
          {navItem("profile", User, "Edit Profile")}
          {navItem("bank", CreditCard, "Bank Information")}
          {navItem("professional", Briefcase, "Professional Information")}

          <div style={{ flex: 1 }} />
        </div>

        {/* Right content */}
        <div className="employee-details-content" style={{ flex: 1, overflow: "auto", padding: "40px", background: "#f9fafb" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", background: "#fff", padding: "32px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
            {activeTab === "profile" && (
              <form onSubmit={handleSave}>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 20px", textAlign: "center" }}>
                  Update Employee Details
                </h3>

                <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Employee ID */}
                  <div>
                    <label style={labelStyle}>Employee ID</label>
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={set("employeeId")}
                      style={inputStyle}
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={set("name")}
                      style={inputStyle}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      style={{ ...inputStyle, background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }}
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label style={labelStyle}>Mobile Number</label>
                    <div style={{ display: "flex", alignItems: "center", ...inputStyle, padding: 0, overflow: "hidden" }}>
                      <div style={{ padding: "9px 12px", background: "#f3f4f6", color: "#6b7280", borderRight: "1px solid #d1d5db", fontWeight: 500 }}>
                        +91
                      </div>
                      <input
                        type="tel"
                        value={form.mobile}
                        onChange={set("mobile")}
                        style={{ border: "none", outline: "none", flex: 1, padding: "9px 12px", fontSize: "13.5px", color: "#1f2937" }}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* DOB */}
                  <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={set("dob")}
                      style={inputStyle}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select value={form.gender} onChange={set("gender")} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div>
                    <label style={labelStyle}>Country</label>
                    <input type="text" value={form.country} readOnly style={{ ...inputStyle, background: "#f3f4f6", color: "#6b7280" }} />
                  </div>

                  {/* State */}
                  <div>
                    <label style={labelStyle}>State</label>
                    <select value={form.state} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value, city: "" }))} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Select State</option>
                      {indianStates.map((s) => (
                        <option key={s.isoCode} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label style={labelStyle}>City</label>
                    <select value={form.city} onChange={set("city")} style={{ ...inputStyle, cursor: "pointer" }} disabled={!form.state}>
                      <option value="">Select City</option>
                      {citiesOfState.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Emergency Name */}
                  <div>
                    <label style={labelStyle}>Emergency Contact Name</label>
                    <input type="text" value={form.emergencyName} onChange={set("emergencyName")} style={inputStyle} />
                  </div>

                  {/* Emergency Phone */}
                  <div>
                    <label style={labelStyle}>Emergency Contact Phone</label>
                    <input type="tel" value={form.emergencyPhone} onChange={set("emergencyPhone")} style={inputStyle} />
                  </div>

                  {/* Home Address — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Home Address</label>
                    <textarea
                      value={form.homeAddress}
                      onChange={set("homeAddress")}
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      background: "#2563EB", color: "#fff",
                      border: "none", borderRadius: "8px",
                      padding: "11px 28px", fontSize: "14px", fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? "Saving…" : "Update Details"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "bank" && (
              <form onSubmit={handleSave}>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 20px", textAlign: "center" }}>
                  Bank Information
                </h3>
                <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Bank Name</label>
                    <input type="text" value={form.bankName} onChange={set("bankName")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Branch Name</label>
                    <input type="text" value={form.branchName} onChange={set("branchName")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Account Number</label>
                    <input type="text" value={form.accountNumber} onChange={set("accountNumber")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>IFSC Code</label>
                    <input type="text" value={form.ifscCode} onChange={set("ifscCode")} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button type="submit" disabled={saving} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Update Details"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "professional" && (
              <form onSubmit={handleSave}>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 20px", textAlign: "center" }}>
                  Professional Information
                </h3>
                <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Experience (Years)</label>
                    <input type="text" value={form.experienceYears} onChange={set("experienceYears")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company Name</label>
                    <input type="text" value={form.companyName} onChange={set("companyName")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Work Location</label>
                    <input type="text" value={form.workLocation} onChange={set("workLocation")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Designation</label>
                    <input type="text" value={form.professionalDesignation} onChange={set("professionalDesignation")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last CTC (₹)</label>
                    <input type="text" value={form.lastCtc} onChange={set("lastCtc")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Aadhar Card</label>
                    <input type="text" value={form.aadharCard} onChange={set("aadharCard")} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>PAN Card</label>
                    <input type="text" value={form.panCard} onChange={set("panCard")} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginTop: "30px", textAlign: "right" }}>
                  <button type="submit" disabled={saving} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "6px", padding: "12px 32px", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Update Details"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Change Status Modal ────────────────────────────────────────────────────────
const ChangeStatusModal = ({ user, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: user.status || "active",
    statusDate: user.statusDate ? user.statusDate.split("T")[0] : "",
    statusDuration: user.statusDuration || "",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    let computedDuration = null;

    if (["inactive", "terminate", "resign"].includes(form.status) && !form.statusDate) {
      return toast.error("Please select a date");
    }

    if (form.status === "suspend") {
      if (!form.statusDate || !form.toDate) {
        return toast.error("Please select From and To dates for suspension");
      }
      const from = new Date(form.statusDate);
      const to = new Date(form.toDate);
      computedDuration = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
      if (computedDuration <= 0) {
        return toast.error("To date must be after From date");
      }
    }

    setSaving(true);
    try {
      await edgeFetch(EDGE.admin, {
        action: "update_user",
        userId: user.id,
        status: form.status,
        statusDate: ["inactive", "terminate", "resign", "suspend"].includes(form.status) && form.statusDate
                      ? new Date(form.statusDate).toISOString() 
                      : null,
        statusDuration: computedDuration,
      });
      toast.success("Status updated successfully!");
      onSaved(
        user.id, 
        form.status, 
        ["inactive", "terminate", "resign", "suspend"].includes(form.status) ? form.statusDate : null, 
        computedDuration
      );
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "13.5px", color: "#1f2937",
    outline: "none", background: "#fff", boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: "12.5px", fontWeight: 600, color: "#374151", marginBottom: "5px" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "12px", width: "400px", maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>Change Status</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspend">Suspend</option>
              <option value="terminate">Terminate</option>
              <option value="resign">Resign</option>
            </select>
          </div>

          {["inactive", "terminate", "resign"].includes(form.status) && (
            <div>
              <label style={{ ...labelStyle, color: "#6b7280" }}>Select Date</label>
              <input
                type="date"
                value={form.statusDate}
                onChange={(e) => setForm({ ...form, statusDate: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
          )}

          {form.status === "suspend" && (
            <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ ...labelStyle, color: "#6b7280" }}>From</label>
                <input
                  type="date"
                  value={form.statusDate}
                  onChange={(e) => setForm({ ...form, statusDate: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: "#6b7280" }}>To</label>
                <input
                  type="date"
                  value={form.toDate || ""}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", background: "#2563EB", color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1 }}>
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
const DeleteConfirmModal = ({ user, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
      <div style={{ background: "#fff", width: "400px", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", textAlign: "center", position: "relative" }}>
        
        {/* Warning Icon */}
        <div style={{ width: "60px", height: "60px", background: "#fef2f2", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <AlertTriangle style={{ width: "28px", height: "28px", color: "#ef4444" }} />
        </div>

        <h2 style={{ margin: "0 0 10px", fontSize: "20px", fontWeight: 700, color: "#111827" }}>Remove Employee?</h2>
        <p style={{ margin: "0 0 25px", fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}>
          Are you sure you want to remove <strong style={{color: "#374151"}}>{user.name}</strong> from the team? They will immediately lose access to the CRM.
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={deleting}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer" }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={async () => {
              setDeleting(true);
              await onConfirm(user);
              setDeleting(false);
            }} 
            disabled={deleting}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#e11d48", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}
          >
            <Trash2 style={{ width: "16px", height: "16px" }} />
            {deleting ? "Removing..." : "Yes, Remove"}
          </button>
        </div>

      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const EmployeeListPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [editUser, setEditUser] = useState(null); // for modal
  const [statusUser, setStatusUser] = useState(null); // for status modal
  const [deleteUser, setDeleteUser] = useState(null); // for delete modal
  const [showAdd, setShowAdd] = useState(false); // for add modal

  const load = async () => {
    try {
      const data = await edgeFetch(EDGE.admin, { action: "list_users" });
      setUsers(data || []);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // After save — update name, mobile and employeeId in local state without full reload
  const handleSaved = (userId, newName, newMobile, newEmployeeId) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, name: newName, mobile: newMobile, employeeId: newEmployeeId } : u));
  };

  const handleStatusSaved = (userId, newStatus, newStatusDate, newStatusDuration) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus, statusDate: newStatusDate, statusDuration: newStatusDuration } : u));
  };

  const depts = ["All", ...new Set(users.map((u) => getRoleMeta(u.role).label))];

  const rows = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.employeeId?.toLowerCase().includes(q);
    const matchDept = deptFilter === "All" || getRoleMeta(u.role).label === deptFilter;
    return matchSearch && matchDept;
  });

  const handleDownload = () => {
    const hdr = ["Employee ID", "Name", "Department", "Email", "Status", "Registration Date"];
    const body = rows.map((u) => [
      u.employeeId || "N/A",
      u.name || "",
      getRoleMeta(u.role).label,
      u.email || "",
      u.status || "active",
      fmtDate(u.createdAt),
    ]);
    const csv = [hdr, ...body]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "employee_list.csv",
    });
    a.click();
    toast.success("Downloaded!");
  };

  const td = {
    padding: "8px 10px",
    fontSize: "11px",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
      <Sidebar onLogout={onLogout} />

      <main style={{ flex: 1, marginLeft: "var(--main-offset)", display: "flex", flexDirection: "column" }}>

        {editUser ? (
          <EmployeeDetailsView
            user={editUser}
            onClose={() => setEditUser(null)}
            onSaved={handleSaved}
          />
        ) : (
          <>
            {/* ── Blue banner ─────────────────────────────────────────────────── */}
            <div style={{
              background: "linear-gradient(135deg, #1d3a6e 0%, #2563EB 100%)",
              padding: "20px 32px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0 }}>
                Employee List
              </h1>
            </div>

            {/* ── Toolbar ─────────────────────────────────────────────────────── */}
            <div className="header-controls" style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "14px 32px", background: "#fff",
              borderBottom: "1px solid #e5e7eb", flexWrap: "wrap",
            }}>
              <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm" style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <UserPlus style={{ width: "13px", height: "13px" }} /> Add Employees
              </button>
              <button onClick={handleDownload} className="btn btn-sm" style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "8px 16px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <Download style={{ width: "13px", height: "13px" }} /> Download file
              </button>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", color: "#374151", background: "#fff", cursor: "pointer", outline: "none", flex: "1 1 100px", maxWidth: "200px" }}>
                {depts.map((d) => <option key={d}>{d}</option>)}
              </select>
              <button onClick={() => setSearch(inputVal)} className="btn btn-primary btn-sm" style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 600 }}>
                Search
              </button>
              <div style={{ flex: 1 }} className="hide-on-mobile" />
              <div className="header-search" style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "#9ca3af", pointerEvents: "none" }} />
                <input type="text" value={inputVal} onChange={(e) => { setInputVal(e.target.value); setSearch(e.target.value); }} placeholder="Search" style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "7px 12px 7px 28px", fontSize: "13px", color: "#374151", outline: "none", width: "100%", background: "#fff", minWidth: "180px" }} />
              </div>
            </div>

            {/* ── Table ───────────────────────────────────────────────────────── */}
            <div style={{ flex: 1, padding: "24px 30px" }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "30px", height: "30px", border: "3px solid #e5e7eb", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading employees…</p>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                      <thead>
                        <tr style={{ background: "#2563EB" }}>
                          {["Employee ID", "Name", "Department", "Email", "Mobile", "Status", "Registration Date", "Action"].map((h) => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11.5px", fontWeight: 700, color: "#f9fafb", whiteSpace: "nowrap" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px", color: "#9ca3af", fontSize: "13px" }}>No employees found.</td></tr>
                        ) : (
                          rows.map((user, idx) => {
                            const rm = getRoleMeta(user.role);
                            const isActive = (user.status || "active") === "active";
                            const rowBg = idx % 2 === 0 ? "#fff" : "#f9fafb";
                            return (
                              <tr key={user.id} style={{ background: rowBg, transition: "background 0.12s" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}>

                                {/* Employee ID */}
                                <td style={td}>
                                  <span style={{ color: "#2563EB", fontWeight: 600, fontSize: "12.5px", fontFamily: "monospace" }}>
                                    {user.employeeId || "N/A"}
                                  </span>
                                </td>

                                {/* Name — NO avatar */}
                                <td style={td}>
                                  <span style={{ color: "#1d4ed8", fontWeight: 500, fontSize: "13px" }}>
                                    {user.name}
                                  </span>
                                </td>

                                {/* Department — NO pencil icon */}
                                <td style={td}>
                                  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 600, background: rm.bg, color: rm.color, border: `1px solid ${rm.border}` }}>
                                    {rm.label}
                                  </span>
                                </td>

                                {/* Email */}
                                <td style={{ ...td, color: "#1d4ed8", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {user.email}
                                </td>

                                {/* Mobile */}
                                <td style={{ ...td, color: "#6b7280" }}>
                                  {user.mobile || "—"}
                                </td>

                                {/* Status */}
                                <td style={td}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                    <button
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStatusUser(user); }}
                                      style={{
                                        display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "4px", fontSize: "11.5px", fontWeight: 700,
                                        background: user.status === "active" ? "#16a34a" : user.status === "suspend" ? "#d97706" : user.status === "terminate" ? "#dc2626" : user.status === "resign" ? "#4f46e5" : "#6b7280",
                                        color: "#fff", minWidth: "62px", justifyContent: "center", border: "none", cursor: "pointer", textTransform: "capitalize"
                                      }}
                                    >
                                      {user.status || "Active"}
                                    </button>
                                    {user.status !== "active" && (
                                      <span style={{ fontSize: "6px", color: "#fff", background: user.status === "suspend" ? "#d97706" : user.status === "terminate" ? "#dc2626" : user.status === "resign" ? "#4f46e5" : "#6b7280", padding: "1px 6px", borderRadius: "3px", fontWeight: 500 }}>
                                        ({user.status === "suspend" ? `Duration:- ${user.statusDuration || "-"} Days` : `Date:- ${fmtDateShort(user.statusDate) || "N/A"}`})
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Registration Date */}
                                <td style={{ ...td, fontSize: "12px", color: "#6b7280" }}>
                                  {fmtDate(user.createdAt)}
                                </td>

                                {/* Action */}
                                <td style={td}>
                                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                    <button
                                      title="Edit employee"
                                      onClick={() => setEditUser(user)}
                                      style={{ width: "28px", height: "28px", borderRadius: "5px", background: "#fef3c7", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                    >
                                      <Pencil style={{ width: "12px", height: "12px", color: "#d97706" }} />
                                    </button>
                                    <button
                                      title="Delete employee"
                                      onClick={() => setDeleteUser(user)}
                                      style={{ width: "28px", height: "28px", borderRadius: "5px", background: "#fee2e2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                    >
                                      <Trash2 style={{ width: "12px", height: "12px", color: "#dc2626" }} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e7eb", background: "#f9fafb", fontSize: "12px", color: "#6b7280", display: "flex", justifyContent: "space-between" }}>
                    <span>Showing <b style={{ color: "#111827" }}>{rows.length}</b> of <b style={{ color: "#111827" }}>{users.length}</b> employees</span>
                    <span>RBSC Solar CRM</span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "0 32px" }}><Footer /></div>
          </>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}
      {statusUser && (
        <ChangeStatusModal
          user={statusUser}
          onClose={() => setStatusUser(null)}
          onSaved={handleStatusSaved}
        />
      )}
      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={async (user) => {
            try {
              await edgeFetch(EDGE.admin, { action: "delete_user", userId: user.id });
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
              toast.success("Employee deleted successfully");
              setDeleteUser(null);
            } catch (err) {
              toast.error(err.message || "Failed to delete employee");
            }
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default EmployeeListPage;
