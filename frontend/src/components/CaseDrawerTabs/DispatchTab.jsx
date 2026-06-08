import React, { useState, useEffect, useRef } from "react";
import { X, ArrowRight, MessageSquare, AlertTriangle, CheckCircle2, User, Phone, MapPin, Zap, FileText, ClipboardList, UserCheck, History, Package, Plus, Trash2, IndianRupee, FileCheck, AlertOctagon, Printer, Star, Clock, Navigation, Download, Edit2, Lock, RefreshCw, Microscope, Calculator, Headphones, Link as LinkIcon, Send } from "lucide-react";
import CaseTimeline from "../CaseTimeline";
import PaymentTracker from "../PaymentTracker";
import { edgeFetch, EDGE, supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { APP_CONFIG } from "../../config";

const DispatchTab = ({ ctx }) => {
  const {
    STAGES,
    TABS,
    accountsEditMode,
    accountsNotes,
    accountsSaving,
    accountsVerifyLoading,
    activeTab,
    assignLoading,
    canUpdate,
    caseData,
    caseId,
    crmNote,
    crmSaving,
    customerDocs,
    daysAtStage,
    delayLoading,
    delayReason,
    deptEmployees,
    dispatchDetails,
    dispatchItems,
    dispatchLoading,
    docStatuses,
    docs,
    downloadZipLoading,
    fData,
    feedbackList,
    feedbackLoading,
    feedbackSubmitting,
    financeEditMode,
    financeLoading,
    geoError,
    geoLoading,
    geoLocation,
    handleAccountsVerify,
    handleAddDispatchItem,
    handleCaptureLocation,
    handleDispatchItemChange,
    handleDispatchSubmit,
    handleDocStatusChange,
    handleDownloadPDF,
    handleDownloadZip,
    handleFeedbackSubmit,
    handleFinanceUpdate,
    handleMarkDelayed,
    handleQuotationVerify,
    handleRemoveDispatchItem,
    handleResendTrackingId,
    handleSubsidyUpdate,
    handleUpdateSubmit,
    hasDocError,
    hasFinanceError,
    hasQuotationError,
    history,
    inventoryList,
    isBankingStage,
    isCompleted,
    isDelayRisk,
    isFinanceApproved,
    isRegStage,
    newFeedback,
    newStage,
    normalized,
    onClose,
    onRefresh,
    ownerDept,
    ownerRole,
    pType,
    pct,
    portalGenerating,
    portalLink,
    printLoading,
    printRef,
    quotationAmountEdit,
    quotationEditMode,
    quotationVerifyLoading,
    remarks,
    resendLoading,
    role,
    selectedEmployee,
    setAccountsEditMode,
    setAccountsNotes,
    setAccountsSaving,
    setAccountsVerifyLoading,
    setActiveTab,
    setAssignLoading,
    setCrmNote,
    setCrmSaving,
    setCustomerDocs,
    setDelayLoading,
    setDelayReason,
    setDeptEmployees,
    setDispatchDetails,
    setDispatchItems,
    setDispatchLoading,
    setDocStatuses,
    setDownloadZipLoading,
    setFData,
    setFeedbackList,
    setFeedbackLoading,
    setFeedbackSubmitting,
    setFinanceEditMode,
    setFinanceLoading,
    setGeoError,
    setGeoLoading,
    setGeoLocation,
    setHistory,
    setInventoryList,
    setNewFeedback,
    setNewStage,
    setPortalGenerating,
    setPortalLink,
    setPrintLoading,
    setQuotationAmountEdit,
    setQuotationEditMode,
    setQuotationVerifyLoading,
    setRemarks,
    setResendLoading,
    setSelectedEmployee,
    setShowDelayForm,
    setSubsidyData,
    setSubsidyLoading,
    setTechnicalNotes,
    setTechnicalSaving,
    setUpdateLoading,
    showDelayForm,
    stageIdx,
    stageStartTime,
    subsidyData,
    subsidyLoading,
    technicalNotes,
    technicalSaving,
    unverifiedDocs,
    updateLoading
  } = ctx;

  return (
    <div>
              <p
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "var(--text-4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "16px",
                }}
              >
                Dispatch Materials
              </p>

              <div
                style={{
                  background: "#f0fdf4",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #bbf7d0",
                  marginBottom: "20px",
                }}
              >
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>📦 Items to Dispatch</span>
                  <button
                    onClick={handleAddDispatchItem}
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "#2563eb",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={13} /> Add Extra Item
                  </button>
                </h4>
                {dispatchItems.some((i) => i._auto) && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#16a34a",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    ✅ Auto-detected from quotation — adjust quantity if needed
                  </p>
                )}

                {dispatchItems.length === 0 ? (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontStyle: "italic",
                      textAlign: "center",
                      padding: "10px 0",
                    }}
                  >
                    No items detected. Click "+ Add Extra Item" to add manually.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 80px 32px",
                        gap: "8px",
                        padding: "4px 2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                        }}
                      >
                        Item
                      </span>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                          textAlign: "center",
                        }}
                      >
                        Qty
                      </span>
                      <span />
                    </div>
                    {dispatchItems.map((item, idx) => {
                      const invItem = inventoryList.find(
                        (i) => i.id === item.id,
                      );
                      const itemName =
                        invItem?.name || item._name || "Unknown Item";
                      const itemUnit = invItem?.unit || item._unit || "";
                      const itemStock = invItem?.stock ?? "?";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 80px 32px",
                            gap: "8px",
                            alignItems: "center",
                            background: "#fff",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {item._auto ? (
                            <div>
                              <span
                                style={{
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "#0f172a",
                                }}
                              >
                                {itemName}
                              </span>
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  color: "#64748b",
                                  marginLeft: "6px",
                                }}
                              >
                                Stock: {itemStock} {itemUnit}
                              </span>
                            </div>
                          ) : (
                            <select
                              value={item.id}
                              onChange={(e) =>
                                handleDispatchItemChange(
                                  idx,
                                  "id",
                                  e.target.value,
                                )
                              }
                              style={{
                                padding: "6px 8px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                outline: "none",
                                width: "100%",
                              }}
                            >
                              <option value="">Select Item...</option>
                              {inventoryList.map((inv) => (
                                <option
                                  key={inv.id}
                                  value={inv.id}
                                  disabled={inv.stock <= 0}
                                >
                                  {inv.name} (Stock: {inv.stock} {inv.unit})
                                </option>
                              ))}
                            </select>
                          )}
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleDispatchItemChange(
                                idx,
                                "quantity",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            style={{
                              padding: "6px 8px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              outline: "none",
                              textAlign: "center",
                              width: "100%",
                            }}
                          />
                          <button
                            onClick={() => handleRemoveDispatchItem(idx)}
                            type="button"
                            style={{
                              padding: "5px",
                              background: "#fee2e2",
                              color: "#ef4444",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleDispatchSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "6px",
                      }}
                    >
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={dispatchDetails.vehicleNumber}
                      onChange={(e) =>
                        setDispatchDetails({
                          ...dispatchDetails,
                          vehicleNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. MH 12 AB 1234"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        fontSize: "13px",
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "6px",
                      }}
                    >
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={dispatchDetails.driverName}
                      onChange={(e) =>
                        setDispatchDetails({
                          ...dispatchDetails,
                          driverName: e.target.value,
                        })
                      }
                      placeholder="Driver Name"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        fontSize: "13px",
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "6px",
                    }}
                  >
                    Dispatch Notes
                  </label>
                  <textarea
                    value={dispatchDetails.notes}
                    onChange={(e) =>
                      setDispatchDetails({
                        ...dispatchDetails,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any specific instructions for delivery?"
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button
                    type="submit"
                    disabled={dispatchLoading || dispatchItems.length === 0}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                      color: "#fff",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      cursor:
                        dispatchLoading || dispatchItems.length === 0
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        dispatchLoading || dispatchItems.length === 0 ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {dispatchLoading
                      ? "Dispatching..."
                      : "Confirm Dispatch & Deduct Inventory"}
                  </button>
                </div>
              </form>
            </div>
  );
};

export default DispatchTab;
