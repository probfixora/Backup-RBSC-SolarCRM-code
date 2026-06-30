import React, { useState, useEffect } from "react";
import { supabase, edgeFetch, EDGE } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { State, City } from "country-state-city";
import {
  User,
  CreditCard,
  Camera,
  X,
  Lock,
  LogOut,
  ChevronUp,
  ChevronDown,
  Key,
  Save,
  ArrowLeft,
  MonitorSmartphone
} from "lucide-react";
import { SkeletonProfilePage } from "./SkeletonComponents";

const AVATAR_COLORS = ["#D97706", "#2563EB", "#7C3AED", "#059669", "#DC2626", "#0891B2", "#DB2777", "#9333ea"];
const avatarColor = (name = "") => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role") || "user";

  const [activeTab, setActiveTab] = useState("profile");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [user, setUser] = useState({});
  const [activeSessionsList, setActiveSessionsList] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    name: "",
    mobile: "",
    dob: "",
    gender: "",
    state: "",
    city: "",
    emergencyName: "",
    emergencyPhone: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ifscCode: "",
    profilePhotoUrl: "",
  });

  const indianStates = State.getStatesOfCountry("IN");
  const currentIsoCode = indianStates.find(s => s.name === form.state)?.isoCode;
  const citiesOfState = currentIsoCode ? City.getCitiesOfState("IN", currentIsoCode) : [];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUser) throw authErr || new Error("User not found");

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileErr) throw profileErr;

      setUser({ ...authUser, ...profile });
      setForm({
        employeeId: profile.employee_id || "",
        email: authUser.email || "",
        name: profile.name || "",
        mobile: profile.mobile ? profile.mobile.replace(/^\+91\s*/, "") : "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        state: profile.state || "",
        city: profile.city || "",
        emergencyName: profile.emergency_name || "",
        emergencyPhone: profile.emergency_phone || "",
        bankName: profile.bank_name || "",
        branchName: profile.branch_name || "",
        accountNumber: profile.account_number || "",
        ifscCode: profile.ifsc_code || "",
        profilePhotoUrl: profile.profile_photo_url || "",
      });

      // Fetch active sessions
      const { data: sessions, error: sessionsErr } = await supabase
        .from("active_sessions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("last_active", { ascending: false });
      
      if (!sessionsErr && sessions) {
        setActiveSessionsList(sessions);
      }
      
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      await edgeFetch(EDGE.admin, {
        action: "update_own_profile",
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        state: form.state,
        city: form.city.trim(),
        emergencyName: form.emergencyName.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
        bankName: form.bankName.trim(),
        branchName: form.branchName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim(),
        profilePhotoUrl: form.profilePhotoUrl,
      });
      toast.success("Profile updated successfully!");
      localStorage.setItem("name", form.name.trim());
      window.dispatchEvent(new StorageEvent("storage", { key: "name", newValue: form.name.trim() }));
      setUser((prev) => ({ ...prev, name: form.name.trim() }));
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (authError) throw new Error("Current password is incorrect");

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;

      // ── GLOBAL SIGNOUT ──
      // Instantly delete all other active sessions for this user.
      // This forces the heartbeat in App.jsx on their other devices to log them out.
      const deviceId = localStorage.getItem("deviceId");
      if (deviceId) {
        await supabase
          .from("active_sessions")
          .delete()
          .eq("user_id", user.id)
          .neq("device_id", deviceId);
      }

      toast.success("Password changed successfully. Other devices have been logged out.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image must be smaller than 2MB");
    }

    const toastId = toast.loading("Uploading photo...");
    try {
      // Use base64 encoding to store in database since explicit storage isn't specified
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setForm((prev) => ({ ...prev, profilePhotoUrl: base64String }));
        try {
          localStorage.setItem("profilePhotoUrl", base64String);
        } catch(e) {} // Ignore quota errors
        window.dispatchEvent(new CustomEvent("profilePhotoChanged", { detail: base64String }));

        await edgeFetch(EDGE.admin, {
          action: "update_own_profile",
          profilePhotoUrl: base64String,
        });
        
        toast.success("Profile photo updated!", { id: toastId });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to upload photo", { id: toastId });
    }
  };

  const handleRemovePhoto = async () => {
    const toastId = toast.loading("Removing photo...");
    try {
      setForm((prev) => ({ ...prev, profilePhotoUrl: "" }));
      localStorage.removeItem("profilePhotoUrl");
      window.dispatchEvent(new CustomEvent("profilePhotoChanged", { detail: "" }));
      
      await edgeFetch(EDGE.admin, {
        action: "update_own_profile",
        profilePhotoUrl: "",
      });
      
      toast.success("Profile photo removed", { id: toastId });
    } catch (err) {
      toast.error("Failed to remove photo", { id: toastId });
    }
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "13.5px", color: "#1f2937",
    outline: "none", background: "#fff", boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: "12.5px", fontWeight: 600, color: "#374151", marginBottom: "5px" };
  
  const navItem = (tab, Icon, label) => (
    <div
      onClick={() => setActiveTab(tab)}
      style={{
        display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px",
        borderRadius: "6px", cursor: "pointer", fontSize: "13px",
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

  if (loadingProfile) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
        <Sidebar onLogout={onLogout} />
        <main
          style={{
            flex: 1,
            marginLeft: "var(--main-offset)",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          {/* Gradient header placeholder — same height as real header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1d3a6e 0%, #2563EB 100%)",
              padding: "16px 32px",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              gap: "16px",
              height: "68px",
            }}
          />
          <SkeletonProfilePage />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <Sidebar onLogout={onLogout} />

      <main style={{ flex: 1, marginLeft: "var(--main-offset)", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #1d3a6e 0%, #2563EB 100%)",
          padding: "16px 32px", display: "flex", alignItems: "center", flexShrink: 0, gap: "16px"
        }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", borderRadius: "6px", width: "36px", height: "36px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Go Back"
          >
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </button>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "18px", margin: 0 }}>Employee Details</p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: "2px 0 0" }}>{user.name}</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="profile-layout" style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          {/* Left sidebar */}
          <div className="profile-sidebar" style={{
            width: "260px", flexShrink: 0, borderRight: "1px solid #e5e7eb", background: "#fff",
            padding: "32px 20px", display: "flex", flexDirection: "column", overflowY: "auto"
          }}>
            {/* Avatar Section */}
            <div style={{ textAlign: "center", marginBottom: "20px", position: "relative" }}>
              <div style={{ position: "relative", width: "80px", margin: "0 auto 10px" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: form.profilePhotoUrl ? `url(${form.profilePhotoUrl}) center/cover` : avatarColor(user.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px", fontWeight: 700, color: "#fff",
                  position: "relative", overflow: "hidden", border: "2px solid #e5e7eb"
                }}>
                  {!form.profilePhotoUrl && (user.name?.charAt(0)?.toUpperCase() || "?")}
                  
                  {/* Upload Overlay */}
                  <label style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)",
                    padding: "4px 0", cursor: "pointer", display: "flex", justifyContent: "center"
                  }}>
                    <Camera style={{ width: "14px", height: "14px", color: "#fff" }} />
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                  </label>
                </div>
                {form.profilePhotoUrl && (
                  <button
                    onClick={handleRemovePhoto}
                    style={{
                      position: "absolute", top: 0, right: 0, background: "#ef4444", color: "#fff",
                      border: "none", borderRadius: "50%", width: "22px", height: "22px",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }}
                    title="Remove Photo"
                  >
                    <X style={{ width: "12px", height: "12px" }} />
                  </button>
                )}
              </div>
              <p style={{ fontWeight: 700, fontSize: "15px", color: "#111827", margin: "0 0 2px" }}>{user.name}</p>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", wordBreak: "break-all" }}>{user.email}</p>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563EB", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>
                {form.employeeId || "N/A"}
              </span>
            </div>

            {/* Nav */}
            <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", padding: "0 4px", marginBottom: "6px" }}>
              Menu
            </p>
            {navItem("profile", User, "Edit Profile")}
            {navItem("bank", CreditCard, "Bank Information")}
            {navItem("sessions", MonitorSmartphone, "Active Sessions")}
            
            <div style={{ flex: 1 }} />
            
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px", marginTop: "16px" }}>
              {navItem("password", Lock, "Change Password")}
              <div
                onClick={() => onLogout && onLogout()}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px",
                  borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  color: "#be123c", background: "#fff1f2", marginTop: "8px"
                }}
              >
                <LogOut style={{ width: "15px", height: "15px" }} />
                Log Out
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="profile-content" style={{ flex: 1, overflowY: "auto", padding: "40px", background: "#f9fafb", minWidth: 0, height: "100%" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto", background: "#fff", padding: "32px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
              
              {activeTab === "profile" && (
                <form onSubmit={handleSave}>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 20px", textAlign: "center" }}>
                    Employee Details
                  </h3>

                  <div className="grid-responsive-2" style={{ display: "grid", gap: "16px" }}>
                    <div>
                      <label style={labelStyle}>Employee ID</label>
                      <input type="text" value={form.employeeId} readOnly style={{ ...inputStyle, background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input type="text" value={form.name} onChange={set("name")} style={inputStyle} placeholder="Full name" required />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input type="email" value={form.email} readOnly style={{ ...inputStyle, background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Mobile Number</label>
                      <div style={{ display: "flex", alignItems: "center", ...inputStyle, padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "9px 12px", background: "#f3f4f6", color: "#6b7280", borderRight: "1px solid #d1d5db", fontWeight: 500 }}>+91</div>
                        <input type="tel" value={form.mobile} onChange={set("mobile")} style={{ border: "none", outline: "none", flex: 1, padding: "9px 12px", fontSize: "13.5px", color: "#1f2937" }} maxLength={10} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Date of Birth</label>
                      <input type="date" value={form.dob} readOnly style={{ ...inputStyle, background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <input type="text" value={form.gender || "Not Specified"} readOnly style={{ ...inputStyle, background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>State</label>
                      <select value={form.state} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value, city: "" }))} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="">Select State</option>
                        {indianStates.map((s) => (
                          <option key={s.isoCode} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>City</label>
                      <select value={form.city} onChange={set("city")} style={{ ...inputStyle, cursor: "pointer" }} disabled={!form.state}>
                        <option value="">Select City</option>
                        {citiesOfState.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Emergency Contact Name</label>
                      <input type="text" value={form.emergencyName} onChange={set("emergencyName")} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Emergency Contact Phone</label>
                      <input type="tel" value={form.emergencyPhone} onChange={set("emergencyPhone")} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginTop: "30px", textAlign: "right" }}>
                    <button type="submit" disabled={saving} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "6px", padding: "11px 28px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
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
                  <div className="grid-responsive-2" style={{ display: "grid", gap: "16px" }}>
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
                  <div style={{ marginTop: "30px", textAlign: "center" }}>
                    <button type="submit" disabled={saving} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", padding: "11px 28px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                      {saving ? "Saving…" : "Update Details"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "password" && (
                <form onSubmit={handleChangePassword}>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 20px", textAlign: "center" }}>
                    Change Password
                  </h3>
                  
                  <div style={{ display: "flex", gap: "10px", padding: "14px 18px", borderRadius: "8px", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "24px" }}>
                    <Key style={{ width: "16px", height: "16px", color: "#b45309", flexShrink: 0, marginTop: "2px" }} />
                    <p style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.5, margin: 0 }}>
                      For security, changing your password will sign you out of all devices.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                    <div>
                      <label style={labelStyle}>Current Password</label>
                      <div style={{ position: "relative" }}>
                        <Lock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af" }} />
                        <input type="password" required style={{ ...inputStyle, paddingLeft: "40px", paddingRight: "16px", height: "42px" }} placeholder="Enter current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="grid-responsive-2" style={{ display: "grid", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>New Password</label>
                        <div style={{ position: "relative" }}>
                          <Key style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af" }} />
                          <input type="password" required style={{ ...inputStyle, paddingLeft: "40px", paddingRight: "16px", height: "42px" }} placeholder="Enter new password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Confirm New Password</label>
                        <div style={{ position: "relative" }}>
                          <Key style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af" }} />
                          <input type="password" required style={{ ...inputStyle, paddingLeft: "40px", paddingRight: "16px", height: "42px" }} placeholder="Re-enter new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "30px", textAlign: "right" }}>
                    <button type="submit" disabled={passwordSaving} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "6px", padding: "11px 28px", fontSize: "14px", fontWeight: 700, cursor: passwordSaving ? "not-allowed" : "pointer", opacity: passwordSaving ? 0.7 : 1, display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                      {passwordSaving ? "Saving..." : <><Save size={16} /> Update Password</>}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "sessions" && (
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 20px", textAlign: "center" }}>
                    Active Sessions
                  </h3>
                  
                  <div style={{ display: "flex", gap: "10px", padding: "14px 18px", borderRadius: "8px", background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: "24px" }}>
                    <MonitorSmartphone style={{ width: "16px", height: "16px", color: "#0369a1", flexShrink: 0, marginTop: "2px" }} />
                    <p style={{ fontSize: "13px", color: "#075985", lineHeight: 1.5, margin: 0 }}>
                      This shows the devices currently logged into your account. You can log out of any unrecognized devices.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {activeSessionsList.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center" }}>No active sessions found.</p>
                    ) : (
                      activeSessionsList.map((session, index) => {
                        const isCurrentDevice = session.device_id === localStorage.getItem("deviceId");
                        return (
                          <div key={session.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: "8px", border: isCurrentDevice ? "2px solid #2563eb" : "1px solid #e5e7eb", background: isCurrentDevice ? "#eff6ff" : "#fff" }}>
                            <div>
                              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                                Device {index + 1}
                                {isCurrentDevice && <span style={{ fontSize: "11px", background: "#2563eb", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>Current</span>}
                              </p>
                              <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                                Last active: {new Date(session.last_active).toLocaleString()}
                              </p>
                            </div>
                            {!isCurrentDevice && (
                              <button
                                onClick={async () => {
                                  if (window.confirm("Log out this device?")) {
                                    try {
                                      await supabase.from("active_sessions").delete().eq("id", session.id);
                                      setActiveSessionsList(prev => prev.filter(s => s.id !== session.id));
                                      toast.success("Device logged out successfully");
                                    } catch(err) {
                                      toast.error("Failed to log out device");
                                    }
                                  }
                                }}
                                style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                              >
                                Log out
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <style>{`
        .grid-responsive-2 { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) {
          .profile-layout { flex-direction: column !important; overflow-y: auto !important; }
          .profile-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid #e5e7eb !important; }
          .profile-content { padding: 20px !important; overflow: visible !important; }
          .grid-responsive-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
