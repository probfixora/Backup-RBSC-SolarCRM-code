import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { APP_CONFIG } from "../config";
import { supabase } from "../lib/supabaseClient";

const stats = [
  { label: "Projects Delivered", value: "500+" },
  { label: "Expert Specialists", value: "50+" },
  { label: "Client Satisfaction", value: "4.9★" },
];

const features = [
  { icon: BarChart3, text: "Real-time multi-tier pipeline analytics" },
  { icon: Users, text: "Granular department role routing" },
  { icon: Zap, text: "Instant reactive stage task assignments" },
];

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // lockoutTimer is populated by the server's response — not localStorage.
  // It counts down locally only for display purposes after a backend rejection.
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const lockoutIntervalRef = useRef(null);
  const navigate = useNavigate();

  // Start a client-side countdown when the server tells us we're locked out.
  // This is purely cosmetic — the backend enforces the actual lockout.
  const startLockoutCountdown = (seconds) => {
    setLockoutTimer(seconds);
    if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
    lockoutIntervalRef.current = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(lockoutIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) {
      return toast.error(`Account locked. Please wait ${lockoutTimer} seconds.`);
    }
    if (!email || !password)
      return toast.error("Please enter your email and password");
    setLoading(true);

    try {
      // Ensure a stable device ID exists before calling the backend
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
      }

      // ── Call the secure backend Edge Function ──
      // All rate limiting, profile checks, and device tracking happen here.
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "secure-login",
        {
          body: {
            email: email.toLowerCase().trim(),
            password,
            deviceId,
          },
        }
      );

      if (fnError) {
        // FunctionsHttpError carries a response we can inspect
        const errBody = await fnError.context?.json().catch(() => null);
        const msg = errBody?.message || fnError.message || "Login failed. Please try again.";

        // If the server sent lockout info, start the client-side countdown
        if (errBody?.locked && errBody?.remainingSeconds > 0) {
          startLockoutCountdown(errBody.remainingSeconds);
        }

        toast.error(msg);
        return;
      }

      if (!fnData?.accessToken) {
        toast.error("Login failed. Please try again.");
        return;
      }

      const { accessToken, refreshToken, user } = fnData;

      // Set the session on the Supabase client so it works normally everywhere
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      localStorage.setItem("token", accessToken);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("employeeId", user.employeeId || "N/A");
      setToken(accessToken);

      toast.success(`Welcome back, ${user.name}!`);

      const routes = {
        admin: "/admin-dashboard",
        sales: "/sales-dashboard",
        registration: "/registration-dashboard",
        banking: "/banking-dashboard",
        inventory: "/inventory-dashboard",
        field_installation: "/installation-dashboard",
        electrical: "/electrical-dashboard",
        subsidy: "/subsidy-dashboard",
        technical: "/technical-dashboard",
        accounts: "/accounts-dashboard",
        customer_service: "/customer-service-dashboard",
      };
      navigate(routes[user.role] || "/admin-dashboard");
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container animate-fade-in"
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--page-bg)",
      }}
    >
      {/* ── Immersive Left Value-Prop Presentation ── */}
      <div
        className="login-left"
        style={{
          width: "54%",
          background:
            "linear-gradient(145deg, #1E3A5F 0%, #2563EB 50%, #7C3AED 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset -10px 0 30px hsla(0, 0%, 0%, 0.15)",
        }}
      >
        {/* Subtle high-fidelity spatial mesh layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Dynamic mesh gradient backdrops */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)",
            animation: "meshGlow 12s ease-in-out infinite alternate",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-15%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
            animation: "meshGlow 10s ease-in-out infinite alternate-reverse",
            pointerEvents: "none",
          }}
        />

        {/* Brand Core */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={APP_CONFIG.logoPath}
            alt={APP_CONFIG.companyName}
            style={{
              height: "44px",
              width: "auto",
              filter: "drop-shadow(0 4px 12px hsla(0, 0%, 0%, 0.2))",
            }}
          />
        </div>

        {/* Center Main Statement */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <div
            className="animate-fade-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              marginBottom: "32px",
              background: "hsla(0, 0%, 100%, 0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid hsla(0, 0%, 100%, 0.25)",
              width: "fit-content",
              boxShadow: "0 4px 16px hsla(0, 0%, 0%, 0.1)",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#60A5FA",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Enterprise Resource Platform
            </span>
          </div>

          <h1
            className="animate-fade-up"
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              marginBottom: "24px",
              animationDelay: "0.1s",
            }}
          >
            Accelerate every
            <br />
            <span style={{ color: "#66D9A5" }}>solar infrastructure</span>
            <br />
            delivery stage.
          </h1>

          <p
            className="hide-on-mobile animate-fade-up"
            style={{
              fontSize: "15.5px",
              color: "hsla(0, 0%, 100%, 0.75)",
              lineHeight: 1.65,
              maxWidth: "420px",
              marginBottom: "44px",
              animationDelay: "0.2s",
              fontWeight: 400,
            }}
          >
            Coordinate real-time site installations, bank financial approvals,
            and core regulatory subsidies in complete synchronization.
          </p>

          <div
            className="hide-on-mobile animate-fade-up"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "48px",
              animationDelay: "0.3s",
            }}
          >
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--radius-sm)",
                    background: "hsla(0, 0%, 100%, 0.1)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid hsla(0, 0%, 100%, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    style={{ width: "15px", height: "15px", color: "#fff" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "hsla(0, 0%, 100%, 0.9)",
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Premium Ambient Stats Container */}
          <div
            className="hide-on-mobile animate-fade-up"
            style={{
              display: "flex",
              gap: "32px",
              borderTop: "1px solid hsla(0, 0%, 100%, 0.15)",
              paddingTop: "36px",
              animationDelay: "0.4s",
            }}
          >
            {stats.map((s, i) => (
              <div key={s.label} style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "hsla(0, 0%, 100%, 0.6)",
                    marginTop: "6px",
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Guarantee watermark */}
        <div
          className="hide-on-mobile"
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "hsla(0, 0%, 100%, 0.4)",
            fontSize: "12px",
          }}
        >
          <span>
            © {APP_CONFIG.year} {APP_CONFIG.companyName} Technologies
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} />
            <span>Secure TLS Encryption</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel Workspace Authentication ── */}
      <div
        className="login-right"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 48px",
          background: "var(--page-bg)",
          position: "relative",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "40px 36px",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-elevation)",
            background: "var(--surface)",
          }}
        >
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "var(--text-1)",
                letterSpacing: "-0.03em",
                marginBottom: "6px",
              }}
            >
              Portal Access
            </h2>
            <p style={{ fontSize: "13.5px", color: "var(--text-3)" }}>
              Secure credentials portal for staff operational tracking
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--text-2)",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                Corporate Email
              </label>
              <div className="input-group">
                <Mail className="icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder={`name@${APP_CONFIG.supportEmail.split("@")[1] || "example.com"}`}
                  style={{
                    borderRadius: "var(--radius-md)",
                    padding: "13px 16px 13px 40px",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--text-2)",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                Secure Password
              </label>
              <div className="input-group" style={{ position: "relative" }}>
                <Lock className="icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="••••••••••••"
                  style={{
                    borderRadius: "var(--radius-md)",
                    padding: "13px 40px 13px 40px",
                    letterSpacing: showPassword ? "normal" : "0.1em",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-4)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutTimer > 0}
              className="btn btn-primary btn-lg"
              style={{
                width: "100%",
                padding: "15px 24px",
                borderRadius: "var(--radius-md)",
                opacity: (loading || lockoutTimer > 0) ? 0.7 : 1,
                cursor: (loading || lockoutTimer > 0) ? "not-allowed" : "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {loading ? (
                <div
                  className="animate-spin"
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid hsla(0, 0%, 100%, 0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                  }}
                />
              ) : lockoutTimer > 0 ? (
                <>
                  <Lock style={{ width: "16px", height: "16px" }} />
                  <span style={{ fontSize: "14.5px", fontWeight: 700, letterSpacing: "0.01em" }}>
                    Locked for {lockoutTimer}s
                  </span>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 700,
                      letterSpacing: "0.01em",
                    }}
                  >
                    Authenticate Session
                  </span>
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </>
              )}
            </button>
          </form>

          {/* Trust Banner Notification Wrapper */}
          <div
            style={{
              marginTop: "28px",
              padding: "14px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-2)",
              border: "1px solid var(--border-2)",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--success)",
                  flexShrink: 0,
                  boxShadow: "0 0 0 2px hsla(160, 84%, 39%, 0.2)",
                }}
              />
              <p
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-3)",
                  lineHeight: 1.4,
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Protected system resources intended exclusively for cleared{" "}
                {APP_CONFIG.companyName} associates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
