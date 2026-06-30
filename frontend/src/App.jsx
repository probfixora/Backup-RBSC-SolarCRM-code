import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { supabase } from "./lib/supabaseClient";

// ── Core components — always loaded immediately (on critical render path) ──
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OfflineBanner from "./components/OfflineBanner";

// ── Non-critical core — lazy loaded but shown soon after auth ──
const LowStockPopup = lazy(() => import("./components/LowStockPopup"));
const AssignedTasksPopup = lazy(() => import("./components/AssignedTasksPopup"));

// ── Feature pages — lazy loaded for code splitting ──
const Cases = lazy(() => import("./components/Cases"));
const CreateCase = lazy(() => import("./components/CreateCase"));
const Users = lazy(() => import("./components/Users"));
const Profile = lazy(() => import("./components/Profile"));
const Support = lazy(() => import("./components/Support"));
const QuotationForm = lazy(() => import("./components/QuotationForm"));
const QuotationList = lazy(() => import("./components/QuotationList"));
const ApprovedQuotations = lazy(() => import("./pages/ApprovedQuotations"));
const FinalLeads = lazy(() => import("./pages/FinalLeads"));

// ── Dashboards — lazy loaded ──
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SalesDashboard = lazy(() => import("./pages/SalesDashboard"));
const RegistrationDashboard = lazy(() => import("./pages/RegistrationDashboard"));
const BankingDashboard = lazy(() => import("./pages/BankingDashboard"));
const FinanceTracking = lazy(() => import("./pages/FinanceTracking"));
const InventoryDashboard = lazy(() => import("./pages/InventoryDashboard"));
const InstallationDashboard = lazy(() => import("./pages/InstallationDashboard"));
const ElectricalDashboard = lazy(() => import("./pages/ElectricalDashboard"));
const SubsidyDashboard = lazy(() => import("./pages/SubsidyDashboard"));

// ── Admin portal pages ──
const DepartmentPortal = lazy(() => import("./pages/DepartmentPortal"));
const EmployeeDrillDown = lazy(() => import("./pages/EmployeeDrillDown"));

// ── ERP pages ──
const ProcurementPortal = lazy(() => import("./pages/ProcurementPortal"));
const ProcurementDashboard = lazy(() => import("./pages/ProcurementDashboard"));
const B2CDispatchPortal = lazy(() => import("./pages/B2CDispatchPortal"));
const WattageSettings = lazy(() => import("./pages/WattageSettings"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const AuditLogViewer = lazy(() => import("./pages/AuditLogViewer"));
const DispatchCustomers = lazy(() => import("./pages/DispatchCustomers"));

// ── Department dashboards ──
const TechnicalDashboard = lazy(() => import("./pages/TechnicalDashboard"));
const AccountsDashboard = lazy(() => import("./pages/AccountsDashboard"));
const CustomerServiceDashboard = lazy(() => import("./pages/CustomerServiceDashboard"));
const EmployeeListPage = lazy(() => import("./pages/EmployeeListPage"));
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"));

// ── Public pages ──
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const TrackingPage = lazy(() => import("./pages/TrackingPage"));

// ── Suspense fallback — app-shell that shows the bg color instantly ──
const AppShellFallback = () => (
  <div
    style={{
      minHeight: "100vh",
      background: "var(--page-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: "28px",
        height: "28px",
        border: "3px solid var(--color-border)",
        borderTopColor: "var(--color-primary)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  </div>
);

// Helper component for role-based redirection from root
const DashboardRedirect = () => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  if (!token) return <Navigate to="/login" replace />;
  const dashboardPath =
    role === "admin"
      ? "/admin-dashboard"
      : role === "sales"
        ? "/sales-dashboard"
        : role === "registration"
          ? "/registration-dashboard"
          : role === "banking"
            ? "/banking-dashboard"
            : role === "inventory"
              ? "/inventory-dashboard"
              : role === "field_installation"
                  ? "/installation-dashboard"
                  : role === "electrical"
                    ? "/electrical-dashboard"
                    : role === "subsidy"
                      ? "/subsidy-dashboard"
                      : role === "technical"
                        ? "/technical-dashboard"
                        : role === "accounts"
                          ? "/accounts-dashboard"
                          : role === "customer_service"
                            ? "/customer-service-dashboard"
                            : "/login";
  return <Navigate to={dashboardPath} replace />;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Restore dark mode on every mount / refresh
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    const deviceId = localStorage.getItem("deviceId");
    const theme = localStorage.getItem("theme");
    localStorage.clear();
    if (deviceId) localStorage.setItem("deviceId", deviceId);
    if (theme) localStorage.setItem("theme", theme);
    window.location.href = "/login";
  };

  // ── Sync name & role from DB on every app load ───────────────────────────
  // This ensures that if a user's profile is updated in the DB,
  // ALL devices reflect the change automatically on next page load/refresh.
  useEffect(() => {
    if (!token) return;
    // Skip DB sync during simulation — don't overwrite simulated role/name
    if (localStorage.getItem("simulating") === "true") return;
    const syncProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("id", user.id)
          .single();
        if (profile) {
          if (profile.name) localStorage.setItem("name", profile.name);
          if (profile.role) localStorage.setItem("role", profile.role);
        }
      } catch {
        // Silent fail — don't disrupt the UX if this fails
      }
    };
    syncProfile();
  }, [token]); // re-runs whenever token changes (i.e., on login)

  // ── Session Heartbeat & Global Logout ─────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const deviceId = localStorage.getItem("deviceId");
    if (!deviceId) return;

    const performHeartbeat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Verify if this device is still listed in active_sessions
        const { data: activeSession, error } = await supabase
          .from("active_sessions")
          .select("device_id")
          .eq("user_id", user.id)
          .eq("device_id", deviceId)
          .maybeSingle();
        
        if (!activeSession) {
          await supabase.auth.signOut();
          const savedDeviceId = localStorage.getItem("deviceId");
          const savedTheme = localStorage.getItem("theme");
          localStorage.clear();
          if (savedDeviceId) localStorage.setItem("deviceId", savedDeviceId);
          if (savedTheme) localStorage.setItem("theme", savedTheme);
          window.location.href = "/login";
          return;
        }

        // Update last_active timestamp
        await supabase.from("active_sessions").upsert({
          user_id: user.id,
          device_id: deviceId,
          last_active: new Date().toISOString()
        }, { onConflict: 'user_id, device_id' });
        
      } catch (err) {
        // Silent fail - network issues shouldn't force logout
      }
    };

    performHeartbeat();
    const interval = setInterval(performHeartbeat, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [token]);

  // ── Inactivity & Background Timers ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const LOGOUT_TIMEOUT = 20 * 60 * 1000;
    const RELOAD_TIMEOUT = 10 * 60 * 1000;

    let lastActiveTime = Date.now();
    let hasPromptedReload = false;

    const updateActivity = () => {
      lastActiveTime = Date.now();
      hasPromptedReload = false;
    };

    const performLogout = () => {
      try {
        supabase.auth.signOut();
      } catch (_) {}
      const savedDeviceId = localStorage.getItem("deviceId");
      const savedTheme = localStorage.getItem("theme");
      localStorage.clear();
      if (savedDeviceId) localStorage.setItem("deviceId", savedDeviceId);
      if (savedTheme) localStorage.setItem("theme", savedTheme);
      window.location.href = "/login";
    };

    // Throttle the activity updater so high-frequency events (scroll, mousemove)
    // don't cause unnecessary work on the main thread.
    let throttleTimer = null;
    const throttledUpdate = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 100);
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, throttledUpdate));

    const checkIdleStatus = () => {
      const idleTime = Date.now() - lastActiveTime;

      if (idleTime >= LOGOUT_TIMEOUT) {
        performLogout();
        return;
      }

      if (idleTime >= RELOAD_TIMEOUT && !hasPromptedReload) {
        hasPromptedReload = true;
        if (
          window.confirm(
            "You've been inactive for a while. The data might be outdated. Do you want to reload the page to get the latest updates?",
          )
        ) {
          window.location.reload();
        }
      }
    };

    const interval = setInterval(checkIdleStatus, 30 * 1000);

    const handleVisibility = () => {
      if (!document.hidden) {
        checkIdleStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      if (throttleTimer) clearTimeout(throttleTimer);
      events.forEach((e) => window.removeEventListener(e, throttledUpdate));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token]);

  const isSimulating = localStorage.getItem("simulating") === "true";

  return (
    <Router>
      <div className="App">
        {/* Offline detection banner — always mounted */}
        <OfflineBanner />
        
        {token && <AssignedTasksPopup />}

        {/* Admin Simulation Banner */}
        {isSimulating && (
          <div
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              padding: "8px 16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              fontSize: "13px",
              fontWeight: 600,
              zIndex: 9999,
              position: "relative",
            }}
          >
            <span>
              You are currently simulating the {localStorage.getItem("role")}{" "}
              view.
            </span>
            <button
              onClick={() => {
                localStorage.setItem(
                  "role",
                  localStorage.getItem("realRole") || "admin",
                );
                localStorage.setItem(
                  "name",
                  localStorage.getItem("realName") || "",
                );
                localStorage.setItem(
                  "userId",
                  localStorage.getItem("realUserId") || "",
                );
                localStorage.removeItem("simulating");
                localStorage.removeItem("realRole");
                localStorage.removeItem("realName");
                localStorage.removeItem("realUserId");
                sessionStorage.removeItem("crm_simulation");
                window.location.href = "/";
              }}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: 700,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
            >
              Return to Admin
            </button>
          </div>
        )}

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            style: { fontSize: "13px", fontFamily: "Inter, sans-serif" },
          }}
          containerStyle={{ zIndex: 999999 }}
        />

        {/* Low Stock Popup — only shows for admin/inventory roles with critical stock */}
        {token && <LowStockPopup />}

        <Suspense fallback={<AppShellFallback />}>
        <Routes>
          {/* Fully Public Routes — no auth required */}
          <Route path="/track" element={<TrackingPage />} />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              !token ? <Login setToken={setToken} /> : <Navigate to="/" />
            }
          />

          {/* Role-Based Dashboards */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role="admin">
                {" "}
                <AdminDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-dashboard"
            element={
              <ProtectedRoute role="sales">
                {" "}
                <SalesDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registration-dashboard"
            element={
              <ProtectedRoute role="registration">
                {" "}
                <RegistrationDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/banking-dashboard"
            element={
              <ProtectedRoute role="banking">
                {" "}
                <BankingDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-dashboard"
            element={
              <ProtectedRoute role="inventory">
                {" "}
                <InventoryDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/installation-dashboard"
            element={
              <ProtectedRoute role="field_installation">
                {" "}
                <InstallationDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/electrical-dashboard"
            element={
              <ProtectedRoute role="electrical">
                {" "}
                <ElectricalDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subsidy-dashboard"
            element={
              <ProtectedRoute role="subsidy">
                {" "}
                <SubsidyDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technical-dashboard"
            element={
              <ProtectedRoute role="technical">
                {" "}
                <TechnicalDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts-dashboard"
            element={
              <ProtectedRoute role="accounts">
                {" "}
                <AccountsDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-service-dashboard"
            element={
              <ProtectedRoute role="customer_service">
                {" "}
                <CustomerServiceDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Routes */}
          <Route
            path="/finance-tracking"
            element={
              <ProtectedRoute role={["banking", "admin", "accounts"]}>
                <FinanceTracking onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases"
            element={
              <ProtectedRoute
                role={[
                  "admin",
                  "registration",
                  "banking",
                  "inventory",
                  "field_installation",
                  "electrical",
                  "subsidy",
                  "technical",
                  "accounts",
                  "customer_service",
                ]}
              >
                <Cases onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotation-form"
            element={
              <ProtectedRoute role={["sales"]}>
                <QuotationForm onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute role={["sales", "admin"]}>
                <QuotationList onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approved-quotations"
            element={
              <ProtectedRoute role={["sales", "admin"]}>
                <ApprovedQuotations onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/final-leads"
            element={
              <ProtectedRoute role={["sales", "admin"]}>
                <FinalLeads onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-case"
            element={
              <ProtectedRoute role={["registration"]}>
                <CreateCase onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="/my-tasks" element={<Navigate to="/cases" replace />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute role="admin">
                <Users onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-list"
            element={
              <ProtectedRoute role="admin">
                <EmployeeListPage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department-portal"
            element={
              <ProtectedRoute role="admin">
                <DepartmentPortal onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department-portal/:userId"
            element={
              <ProtectedRoute role="admin">
                <EmployeeDrillDown onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer"
            element={
              <ProtectedRoute>
                <DocumentViewer />
              </ProtectedRoute>
            }
          />

          {/* ERP Routes */}
          <Route
            path="/procurement-dashboard"
            element={
              <ProtectedRoute role={["admin", "inventory"]}>
                <ProcurementDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurement-portal"
            element={
              <ProtectedRoute role={["admin", "inventory"]}>
                <ProcurementPortal onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/b2c-dispatch"
            element={
              <ProtectedRoute role={["admin", "inventory"]}>
                <B2CDispatchPortal onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch-customers"
            element={
              <ProtectedRoute role={["admin", "inventory"]}>
                <DispatchCustomers onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wattage-settings"
            element={
              <ProtectedRoute role="admin">
                <WattageSettings onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute role="admin">
                <AuditLogViewer onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Public Routes — no auth required */}
          <Route path="/customer-portal" element={<CustomerPortal />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Default Redirects */}
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
      </div>
    </Router>
  );
}


export default App;
