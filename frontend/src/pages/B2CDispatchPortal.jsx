import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { Truck, CheckCircle, ArrowRight, Loader, PackageCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function B2CDispatchPortal({ onLogout }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingCases, setPendingCases] = useState([]);
  const [dispatchedCases, setDispatchedCases] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchDispatchCases = useCallback(async () => {
    setLoading(true);
    try {
      // Pending Dispatches
      const { data: pendingData, error: pendingError } = await supabase
        .from("cases")
        .select("*")
        .eq("current_stage", "Sent to Store")
        .order("created_at", { ascending: true });

      if (pendingError) throw pendingError;
      
      // Dispatched History
      const { data: dispatchedData, error: dispatchedError } = await supabase
        .from("cases")
        .select("*")
        .not("dispatched_items", "is", null)
        .order("dispatch_date", { ascending: false, nullsFirst: false });

      if (dispatchedError) throw dispatchedError;

      setPendingCases(pendingData || []);
      setDispatchedCases(dispatchedData || []);
    } catch (err) {
      toast.error("Failed to load dispatch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDispatchCases();
  }, [fetchDispatchCases]);

  const handleDispatch = async (caseId, customerName, capacity) => {
    setProcessingId(caseId);
    try {
      // Update the stage to "Installation" and log a note.
      const { error } = await supabase.functions.invoke("workflow", {
        body: {
          action: "update_stage",
          caseId: caseId,
          newStage: "Installation",
          note: "Auto-dispatched items to installation site.",
        },
      });

      if (error) throw error;

      toast.success(`Items dispatched successfully for ${customerName}`);
      fetchDispatchCases(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error("Dispatch failed: " + err.message);
    } finally {
      setProcessingId(null);
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
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === "pending" ? "2px solid #8b5cf6" : "2px solid transparent",
                color: activeTab === "pending" ? "#8b5cf6" : "var(--text-2)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "15px"
              }}
            >
              <Truck size={20} />
              Pending Dispatches ({pendingCases.length})
            </button>
            <button
              onClick={() => setActiveTab("dispatched")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === "dispatched" ? "2px solid #10b981" : "2px solid transparent",
                color: activeTab === "dispatched" ? "#10b981" : "var(--text-2)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "15px"
              }}
            >
              <PackageCheck size={20} />
              Dispatched History ({dispatchedCases.length})
            </button>
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
          ) : activeTab === "pending" ? (
            pendingCases.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "var(--surface-2)",
                  borderRadius: "8px",
                }}
              >
                <CheckCircle
                  size={32}
                  color="#10b981"
                  style={{ margin: "0 auto 12px" }}
                />
                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  All Caught Up!
                </p>
                <p style={{ color: "var(--text-4)", fontSize: 13 }}>
                  There are no approved cases waiting for dispatch.
                </p>
              </div>
            ) : (
              <>
                <div className="table-wrap hide-on-mobile">
                  <table>
                    <thead>
                      <tr>
                        <th>Tracking ID</th>
                        <th>Customer Name</th>
                        <th>Required Capacity</th>
                        <th>Current Status</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCases.map((c) => (
                        <tr key={c.id}>
                          <td
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              color: "#3B82F6",
                            }}
                          >
                            {c.tracking_id}
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--text-1)" }}>
                            {c.customer_name}
                          </td>
                          <td style={{ fontWeight: 500, color: "var(--text-2)" }}>
                            {c.load_required || c.capacity || "Not specified"}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: "#fef3c7",
                                color: "#b45309",
                              }}
                            >
                              Waiting for Dispatch
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() =>
                                handleDispatch(
                                  c.id,
                                  c.customer_name,
                                  c.load_required,
                                )
                              }
                              disabled={processingId === c.id}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "none",
                                background:
                                  processingId === c.id ? "#9CA3AF" : "#8b5cf6",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor:
                                  processingId === c.id ? "wait" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "background-color 0.2s",
                              }}
                            >
                              {processingId === c.id ? (
                                <>
                                  <Loader size={16} className="animate-spin" />{" "}
                                  Processing...
                                </>
                              ) : (
                                <>
                                  Send to Installation <ArrowRight size={16} />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
  
                <div
                  className="mobile-only"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {pendingCases.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: "var(--surface-2)",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "var(--text-1)",
                            fontSize: "15px",
                          }}
                        >
                          {c.customer_name}
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: "#fef3c7",
                            color: "#b45309",
                          }}
                        >
                          Waiting
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          background: "var(--surface)",
                          padding: "12px",
                          borderRadius: "8px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-4)",
                              textTransform: "uppercase",
                              fontWeight: 600,
                            }}
                          >
                            Tracking ID
                          </div>
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              color: "#3B82F6",
                              marginTop: "4px",
                            }}
                          >
                            {c.tracking_id}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-4)",
                              textTransform: "uppercase",
                              fontWeight: 600,
                            }}
                          >
                            Capacity
                          </div>
                          <div
                            style={{
                              fontWeight: 500,
                              color: "var(--text-2)",
                              marginTop: "4px",
                            }}
                          >
                            {c.load_required || c.capacity || "N/A"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleDispatch(c.id, c.customer_name, c.load_required)
                        }
                        disabled={processingId === c.id}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          border: "none",
                          background:
                            processingId === c.id ? "#9CA3AF" : "#8b5cf6",
                          color: "#fff",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: processingId === c.id ? "wait" : "pointer",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "8px",
                          transition: "background-color 0.2s",
                          width: "100%",
                          marginTop: "4px",
                        }}
                      >
                        {processingId === c.id ? (
                          <>
                            <Loader size={18} className="animate-spin" />{" "}
                            Processing...
                          </>
                        ) : (
                          <>
                            Send to Installation <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            dispatchedCases.length === 0 ? (
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
                            {c.dispatch_date ? new Date(c.dispatch_date).toLocaleDateString() : "N/A"}
                          </td>
                          <td style={{ fontSize: "13px" }}>
                            <div>{c.dispatch_vehicle || "No Vehicle"}</div>
                            <div style={{ color: "var(--text-3)", fontSize: "12px", marginTop: "2px" }}>{c.dispatch_driver || "No Driver"}</div>
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
                            <td colSpan="5" style={{ background: "#f8fafc", padding: "16px" }}>
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
                                {c.dispatch_notes && (
                                  <div style={{ marginTop: "16px", padding: "10px 12px", background: "#fef9c3", borderRadius: "6px", fontSize: "13px", color: "#854d0e", border: "1px solid #fde047" }}>
                                    <strong style={{ display: "block", marginBottom: "4px" }}>Notes:</strong> {c.dispatch_notes}
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
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
