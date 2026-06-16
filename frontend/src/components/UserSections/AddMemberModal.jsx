import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import { State, City } from "country-state-city";

const roleMeta = {
  sales: { label: "Sales" },
  banking: { label: "Banking & Finance" },
  field_installation: { label: "Installation" },
  subsidy: { label: "Subsidy" },
  accounts: { label: "Accounts" },
  registration: { label: "Registration" },
  inventory: { label: "Inventory" },
  electrical: { label: "Electrical" },
  technical: { label: "Technical QA" },
  customer_service: { label: "Customer Service" },
  admin: { label: "Admin" },
};

const AddMemberModal = ({ ctx }) => {
  const { showAddModal, setShowAddModal, fetchUsers } = ctx;
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

  if (!showAddModal) return null;

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
      // Only generate if we have a valid name and no custom employee ID was manually typed (or if we always want to auto-generate)
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
      if (fetchUsers) fetchUsers();
      setShowAddModal(false);
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
    <div onClick={() => setShowAddModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px", overflow: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#f8fafc", borderRadius: "12px", width: "560px", maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden", margin: "auto" }}>
        {/* Header */}
        <div style={{ background: "#4338ca", padding: "18px", textAlign: "center", position: "relative" }}>
          <h2 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, margin: 0 }}>Register New Employee</h2>
          <button type="button" onClick={() => setShowAddModal(false)} style={{ position: "absolute", right: "16px", top: "18px", background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex" }}>
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 30px", background: "#fff" }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", margin: 0 }}>

            <div className="grid-responsive-2" style={{ display: "grid", gap: "16px" }}>
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

            <div className="grid-responsive-2" style={{ display: "grid", gap: "16px" }}>
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
                  <input type="tel" value={form.mobile} onChange={set("mobile")} style={{ border: "none", background: "transparent", outline: "none", flex: 1, padding: "9px 12px" }} placeholder="Mobile number" />
                </div>
              </div>
            </div>

            <div className="grid-responsive-2" style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input type="date" value={form.dob} onChange={set("dob")} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input type="text" value={form.country} readOnly style={{ ...inputStyle, background: "#e2e8f0", color: "#64748b" }} />
              </div>
            </div>

            <div className="grid-responsive-2" style={{ display: "grid", gap: "16px" }}>
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
      <style>{`
        .grid-responsive-2 { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) {
          .grid-responsive-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AddMemberModal;
