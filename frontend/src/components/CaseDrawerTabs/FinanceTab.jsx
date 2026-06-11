/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { X, ArrowRight, MessageSquare, AlertTriangle, CheckCircle2, User, Phone, MapPin, Zap, FileText, ClipboardList, UserCheck, History, Package, Plus, Trash2, IndianRupee, FileCheck, AlertOctagon, Printer, Star, Clock, Navigation, Download, Edit2, Lock, RefreshCw, Microscope, Calculator, Headphones, Link as LinkIcon, Send, UploadCloud } from "lucide-react";
import CaseTimeline from "../CaseTimeline";
import PaymentTracker from "../PaymentTracker";
import { edgeFetch, EDGE, supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { APP_CONFIG } from "../../config";

const FinanceTab = ({ ctx }) => {
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

  const [quotationAmountEdit, setQuotationAmountEdit] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [newDocName, setNewDocName] = useState("");

  const handleFileUpload = async (e, docName) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(docName);
    try {
      const ext = file.name.split(".").pop();
      const safeDocName = docName.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${normalized.trackingId || Date.now()}_${safeDocName}_${Date.now()}.${ext}`;
      const filePath = `${normalized.trackingId || "docs"}/${fileName}`;
      const { error } = await supabase.storage.from("documents").upload(filePath, file);

      if (error && error.message?.includes("Bucket not found")) {
        const retry = await supabase.storage.from("Documents").upload(filePath, file);
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }

      let finalUrl = null;
      const { data: publicData } = supabase.storage.from("documents").getPublicUrl(filePath);
      if (publicData?.publicUrl) finalUrl = publicData.publicUrl;
      else {
        const retryUrl = supabase.storage.from("Documents").getPublicUrl(filePath);
        if (retryUrl.data?.publicUrl) finalUrl = retryUrl.data.publicUrl;
      }

      if (!finalUrl) throw new Error("Could not get public URL");

      const { error: dbError } = await supabase.from("customer_uploaded_docs").insert([
        {
          case_id: caseId,
          doc_name: docName,
          doc_url: finalUrl,
        }
      ]);
      if (dbError) throw dbError;

      toast.success(`${docName} uploaded successfully`);
      if (ctx.onRefresh) ctx.onRefresh();
    } catch (err) {
      toast.error(`Error uploading ${docName}: ${err.message}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "var(--text-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: 0,
                  }}
                >
                  Financial Details
                </p>
                {normalized.financeVerified && !financeEditMode && (
                  <button
                    onClick={() => setFinanceEditMode(true)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: "4px 8px",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Edit2
                      style={{
                        width: "13px",
                        height: "13px",
                        marginRight: "4px",
                      }}
                    />{" "}
                    Edit
                  </button>
                )}
              </div>

              {normalized.financeVerified && !financeEditMode ? (
                <div
                  style={{
                    padding: "16px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "#16a34a",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#166534",
                        fontWeight: 700,
                      }}
                    >
                      Finance Details Saved
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Total Amount
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
                        }}
                      >
                        ₹{Number(normalized.totalAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Payment Type
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
                        }}
                      >
                        {fData.paymentType || "—"}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Down Payment
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
                        }}
                      >
                        ₹{Number(fData.downPayment || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Remaining Amount
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
                        }}
                      >
                        ₹
                        {Number(
                          (normalized.totalAmount || 0) -
                            (fData.downPayment || 0) -
                            (fData.paymentType === "Loan"
                              ? fData.loanApprovedAmount || 0
                              : 0),
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#e0e7ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#3730a3",
                      }}
                    >
                      Quotation Total Price:
                    </span>

                    {quotationAmountEdit ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="number"
                          value={fData.quotation_amount || fData.quotationAmount || fData.totalAmount || normalized.totalAmount || ""}
                          onChange={(e) =>
                            setFData({
                              ...fData,
                              quotation_amount: e.target.value,
                              quotationAmount: e.target.value,
                              totalAmount: e.target.value,
                            })
                          }
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #818cf8",
                            width: "120px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#312e81"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setQuotationAmountEdit(false)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#16a34a",
                            cursor: "pointer",
                          }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: 800,
                            color: "#312e81",
                          }}
                        >
                          ₹{Number(fData.quotation_amount || fData.quotationAmount || fData.totalAmount || normalized.totalAmount || 0).toLocaleString()}
                        </span>
                        {!normalized.financeVerified && (
                          <button
                            type="button"
                            onClick={() => setQuotationAmountEdit(true)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#6366f1",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                              alignItems: "center"
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <form
                    onSubmit={handleFinanceUpdate}
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
                          Payment Type
                        </label>
                        <select
                          value={fData.paymentType}
                          onChange={(e) =>
                            setFData({ ...fData, paymentType: e.target.value })
                          }
                          className="input"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          <option value="Cash">Cash</option>
                          <option value="Loan">Loan</option>
                        </select>
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
                          Down Payment (₹)
                        </label>
                        <input
                          type="number"
                          value={fData.downPayment}
                          onChange={(e) =>
                            setFData({ ...fData, downPayment: e.target.value })
                          }
                          placeholder="0"
                          className="input"
                        />
                      </div>
                    </div>

                    {fData.paymentType === "Cash" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          padding: "14px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: "10px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#166534",
                              marginBottom: "6px",
                            }}
                          >
                            Payment Mode
                          </label>
                          <select
                            value={fData.paymentMode}
                            onChange={(e) =>
                              setFData({
                                ...fData,
                                paymentMode: e.target.value,
                              })
                            }
                            className="input"
                          >
                            <option value="">Select mode...</option>
                            <option value="Cash">Cash (Physical)</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>
                        <div
                          style={{
                            padding: "10px",
                            background: "#dcfce7",
                            borderRadius: "6px",
                            border: "1px solid #86efac",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#14532d",
                            }}
                          >
                            Remaining Cash to be Paid:
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#14532d",
                            }}
                          >
                            ₹
                            {Number(
                              (normalized.totalAmount || 0) -
                                (fData.downPayment || 0),
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {fData.paymentType === "Loan" && (
                      <>
                        {/* ── Registration Role: Info box + Document Upload only ── */}
                        {role === "registration" ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                            }}
                          >
                            {/* Info Banner */}
                            <div
                              style={{
                                padding: "14px 16px",
                                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                                border: "1px solid #f59e0b",
                                borderRadius: "10px",
                                display: "flex",
                                gap: "10px",
                                alignItems: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: "20px", lineHeight: 1 }}>🏦</span>
                              <div>
                                <p style={{ fontSize: "13px", color: "#78350f", fontWeight: 700, margin: 0, marginBottom: "4px" }}>
                                  Loan Selected — Documents Required
                                </p>
                                <p style={{ fontSize: "12px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                                  Please upload the required documents below. Once done, move the case to <strong>"Bank &amp; Finance"</strong> stage from the Update tab. These documents will be sent directly to the Banking Department.
                                </p>
                              </div>
                            </div>

                            {/* Document Upload List */}
                            <div
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                borderRadius: "10px",
                                padding: "14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              <p style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: "4px" }}>
                                📎 Required Documents for Loan
                              </p>
                              {ctx.customerDocs?.length > 0 ? (
                                ctx.customerDocs.map((d, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      padding: "10px 14px",
                                      background: "#f0fdf4",
                                      borderRadius: "8px",
                                      border: "1px solid #a7f3d0",
                                    }}
                                  >
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#065f46", display: "flex", alignItems: "center", gap: "6px" }}>
                                      ✅ {d.doc_name}
                                    </span>
                                    <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>Uploaded</span>
                                  </div>
                                ))
                              ) : (
                                <p style={{ fontSize: "12px", color: "var(--text-4)", fontStyle: "italic", margin: 0, padding: "4px 0" }}>No loan documents uploaded yet.</p>
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  marginTop: "8px",
                                  alignItems: "center"
                                }}
                              >
                                <input
                                  type="text"
                                  placeholder="Enter document name (e.g. Aadhar)"
                                  value={newDocName}
                                  onChange={(e) => setNewDocName(e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    outline: "none"
                                  }}
                                />
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    background: uploadingDoc === newDocName ? "#d97706" : (!newDocName ? "#9ca3af" : "#2563eb"),
                                    color: "#fff",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: (!newDocName || uploadingDoc === newDocName) ? "not-allowed" : "pointer",
                                    opacity: (!newDocName || uploadingDoc === newDocName) ? 0.8 : 1,
                                    transition: "all 0.2s",
                                  }}
                                >
                                  <UploadCloud size={14} />
                                  {uploadingDoc === newDocName ? "Uploading..." : "Upload"}
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                      if (newDocName) {
                                        handleFileUpload(e, newDocName);
                                        setNewDocName("");
                                      }
                                    }}
                                    disabled={!newDocName || uploadingDoc === newDocName}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // ── Banking / Admin role: Show full Loan fields ──
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                              padding: "14px",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: "10px",
                            }}
                          >
                            <div style={{ display: "flex", gap: "12px" }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e3a8a", marginBottom: "6px" }}>
                                  Loan Amount (₹)
                                </label>
                                <input type="number" value={fData.loanAmount} onChange={(e) => setFData({ ...fData, loanAmount: e.target.value })} placeholder="Amount financed" className="input" />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e3a8a", marginBottom: "6px" }}>
                                  Loan Approved Amount (₹)
                                </label>
                                <input type="number" value={fData.loanApprovedAmount} onChange={(e) => setFData({ ...fData, loanApprovedAmount: e.target.value })} placeholder="Approved amount" className="input" />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e3a8a", marginBottom: "6px" }}>
                                Approved Bank Name
                              </label>
                              <input type="text" value={fData.bankName} onChange={(e) => setFData({ ...fData, bankName: e.target.value })} placeholder="e.g. HDFC, SBI" className="input" />
                            </div>
                            <div
                              style={{
                                padding: "10px",
                                background: "#dbeafe",
                                borderRadius: "6px",
                                border: "1px solid #93c5fd",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a8a" }}>
                                Remaining Balance (After Down Payment &amp; Loan):
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a8a" }}>
                                ₹{Number(
                                  (normalized.totalAmount || 0) -
                                    (fData.downPayment || 0) -
                                    (fData.loanApprovedAmount || 0),
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px",
                      }}
                    >
                      <button
                        type="submit"
                        disabled={financeLoading}
                        className="btn btn-primary"
                      >
                        {financeLoading
                          ? "Saving..."
                          : "Save Financial Details"}
                      </button>
                    </div>
                  </form>

                  {/* Payment History Tracker (B.10) */}
                  <PaymentTracker caseId={normalized.caseId} userRole={role} />
                </>
              )}
            </div>
  );
};

export default FinanceTab;
