import React, { useState, useEffect, useCallback } from "react";
import { supabase, edgeFetch, EDGE } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { Truck, CheckCircle, ArrowRight, Loader, PackageCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function B2CDispatchPortal({ onLogout }) {
  const [dispatchedCases, setDispatchedCases] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDispatchCases = useCallback(async () => {
    setLoading(true);
    try {
      const merged = await edgeFetch(EDGE.workflow, { action: "get_b2c_dispatches" });
      setDispatchedCases(merged);
    } catch (err) {
      toast.error("Failed to load dispatch data");
      console.error(err);
      setDispatchedCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDispatchCases();
  }, [fetchDispatchCases]);

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
          boxSizing: "border-box",
          maxWidth: "1400px",
          overflowX: "hidden",
        }}
      >
        <Header
          title="B2C Dispatch Portal"
          subtitle="Manage and dispatch items for approved residential cases"
          onLogout={onLogout}
        />

        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginBottom: 20,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 0",
                borderBottom: "2px solid #10b981",
                color: "#10b981",
                fontWeight: 600,
                fontSize: "15px"
              }}
            >
              <PackageCheck size={20} />
              Dispatch History ({dispatchedCases.length})
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div
                className="animate-spin"
                style={{
                  width: 28,
                  height: 28,
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--brand)",
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ color: "var(--text-4)", fontSize: 13 }}>
                Loading cases...
              </p>
            </div>
          ) : dispatchedCases.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "var(--surface-2)",
                  borderRadius: "8px",
                }}
              >
                <PackageCheck
                  size={32}
                  color="#64748b"
                  style={{ margin: "0 auto 12px" }}
                />
                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  No Dispatch History
                </p>
                <p style={{ color: "var(--text-4)", fontSize: 13 }}>
                  You haven't dispatched any items yet.
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Customer Name</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Dispatch Date</th>
                      <th>Vehicle/Driver</th>
                      <th style={{ textAlign: "right" }}>Dispatch Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchedCases.map((c) => (
                      <React.Fragment key={c.id}>
                        <tr>
                          <td style={{ fontFamily: "monospace", fontWeight: 600, color: "#3B82F6" }}>
                            {c.tracking_id}
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--text-1)" }}>
                            {c.customer_name}
                          </td>
                          <td style={{ fontWeight: 500, color: "var(--text-2)" }}>
                             {c.dispatched_by || c.assigned_to || "—"}
                          </td>
                          <td>
                             <span
                               style={{
                                 padding: "4px 8px",
                                 borderRadius: 12,
                                 fontSize: 11,
                                 fontWeight: 700,
                                 background: c.status === "Dispatched" ? "#dcfce7" : "#eff6ff",
                                 color: c.status === "Dispatched" ? "#16a34a" : "#1d4ed8",
                               }}
                             >
                               {c.status || c.current_stage || "Dispatched"}
                             </span>
                           </td>
                           <td style={{ fontWeight: 500, color: "var(--text-2)" }}>
                             {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                           </td>
                           <td style={{ fontSize: "13px" }}>
                             <div>{c.vehicle_number || "No Vehicle"}</div>
                             <div style={{ color: "var(--text-3)", fontSize: "12px", marginTop: "2px" }}>{c.driver_name || "No Driver"}</div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => setExpandedRowId(expandedRowId === c.id ? null : c.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: expandedRowId === c.id ? "#f1f5f9" : "#fff",
                                color: "var(--text-2)",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              {expandedRowId === c.id ? "Hide Items" : "View Items"}
                              {expandedRowId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>
                        {expandedRowId === c.id && (
                          <tr>
                            <td colSpan="7" style={{ background: "#f8fafc", padding: "16px" }}>
                              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                                <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0", color: "#334155" }}>Dispatched Items</h4>
                                {(!c.dispatched_items || c.dispatched_items.length === 0) ? (
                                  <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>No items details recorded.</p>
                                ) : (
                                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: 0 }}>
                                      <thead>
                                        <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Item Name</th>
                                          <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "#475569", width: "100px" }}>Quantity</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {c.dispatched_items.map((item, idx) => (
                                          <tr key={idx} style={{ borderBottom: idx < c.dispatched_items.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                                            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 500 }}>
                                              {item._name || "Unknown Item"}
                                            </td>
                                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#0f172a" }}>
                                              {item.quantity} {item._unit || ""}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {c.notes && (
                                   <div style={{ marginTop: "16px", padding: "10px 12px", background: "#fef9c3", borderRadius: "6px", fontSize: "13px", color: "#854d0e", border: "1px solid #fde047" }}>
                                     <strong style={{ display: "block", marginBottom: "4px" }}>Notes:</strong> {c.notes}
                                   </div>
                                 )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        <Footer />
      </main>
    </div>
  );
}
