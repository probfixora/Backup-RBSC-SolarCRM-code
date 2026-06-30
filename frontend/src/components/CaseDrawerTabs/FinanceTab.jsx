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
  const [stagedFiles, setStagedFiles] = useState([{ id: Date.now(), docName: "", file: null }]);
  const [financeDocsUploading, setFinanceDocsUploading] = useState(false);

  const handleStagedFileSelect = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, file } : f));
    e.target.value = null;
  };

  const handleDocNameChange = (id, value) => {
    setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, docName: value } : f));
  };

  const addDocRow = () => {
    setStagedFiles(prev => [...prev, { id: Date.now() + Math.random(), docName: "", file: null }]);
  };

  const removeStagedFile = (id) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const replaceStagedFile = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, file, docName: file.name } : f));
    e.target.value = null;
  };

  const uploadStagedFiles = async () => {
    const filesToUpload = stagedFiles.filter(f => f.file && f.docName.trim());
    if (filesToUpload.length === 0) {
      toast.error("Please enter document name and select a file to upload.");
      return;
    }
    setFinanceDocsUploading(true);
    let successCount = 0;
    
    for (const staged of filesToUpload) {
      try {
        const file = staged.file;
        const ext = file.name.split(".").pop();
        const safeDocName = staged.docName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${normalized.trackingId || Date.now()}_FINANCE_${safeDocName}_${Date.now()}.${ext}`;
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

        // Prefix with FINANCE_DOC:: to logically isolate it
        const newDoc = {
          case_id: caseId,
          doc_name: `FINANCE_DOC::${staged.docName}`,
          doc_url: finalUrl,
        };
        const { data: inserted, error: dbError } = await supabase.from("customer_uploaded_docs").insert([newDoc]).select();
        if (dbError) throw dbError;

        if (ctx.setCustomerDocs && inserted && inserted.length > 0) {
          ctx.setCustomerDocs((prev) => [...(prev || []), inserted[0]]);
        }
        successCount++;
      } catch (err) {
        console.error("Finance doc upload error:", err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} document(s)`);
      setStagedFiles([{ id: Date.now(), docName: "", file: null }]);
      
      // Auto-save the payment type and down payment as well since we hid the save button
      if (fData.paymentType === "Loan") {
        try {
          await edgeFetch(EDGE.workflow, {
            action: "update_finance",
            caseId,
            paymentType: fData.paymentType,
            downPayment: fData.downPayment ? Number(fData.downPayment) : 0,
            cashAmount: fData.cashAmount ? Number(fData.cashAmount) : 0,
            paymentMode: fData.paymentMode,
            loanAmount: fData.loanAmount ? Number(fData.loanAmount) : 0,
            loanApprovedAmount: fData.loanApprovedAmount ? Number(fData.loanApprovedAmount) : 0,
            emiAmount: fData.emiAmount ? Number(fData.emiAmount) : 0,
            bankName: fData.bankName,
          });
        } catch (e) {
          console.error("Auto save finance details failed:", e);
        }
      }
    } else {
      toast.error("Failed to upload documents");
    }
    
    setFinanceDocsUploading(false);
  };

  const deleteUploadedFinanceDoc = async (doc) => {
    const cleanName = doc.doc_name.replace("FINANCE_DOC::", "");
    if (!window.confirm(`Are you sure you want to delete ${cleanName}?`)) return;
    try {
      // Use edge function to bypass RLS
      await edgeFetch(EDGE.workflow, {
        action: "delete_finance_doc",
        docUrl: doc.doc_url,
      });

      toast.success("Document deleted");
      if (ctx.setCustomerDocs) {
        ctx.setCustomerDocs(prev => prev.filter(d => d.doc_url !== doc.doc_url));
      }
    } catch (err) {
      toast.error(`Failed to delete document: ${err.message}`);
    }
  };
  
  const financeUploadedDocs = (ctx.customerDocs || []).filter(d => d.doc_name?.startsWith("FINANCE_DOC::"));

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
                          disabled={role === "banking" && (caseData?.payment_type || "").toLowerCase() === "loan"}
                          title={role === "banking" && (caseData?.payment_type || "").toLowerCase() === "loan" ? "Banking department cannot change loan cases to cash." : ""}
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
                                  Loan Selected
                                </p>
                                <p style={{ fontSize: "12px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                                  Please upload the required finance documents in the section below. Once done, move the case to <strong>"Bank &amp; Finance"</strong> stage from the Update tab.
                                </p>
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
                                  First Installment Amount (70%)
                                </label>
                                <input type="number" value={fData.loanApprovedAmount} onChange={(e) => setFData({ ...fData, loanApprovedAmount: e.target.value })} placeholder="e.g. 133000" className="input" />
                              </div>
                            </div>

                            {stageIdx >= 8 && (
                              <div style={{ display: "flex", gap: "12px", marginTop: "12px", padding: "12px", background: "#f0fdf4", border: "1px dashed #bbf7d0", borderRadius: "8px" }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#166534", marginBottom: "6px" }}>
                                    Final Payment Amount (30%)
                                  </label>
                                  <input type="number" value={fData.finalPaymentAmount} onChange={(e) => setFData({ ...fData, finalPaymentAmount: e.target.value })} placeholder="e.g. 57000" className="input" />
                                </div>
                              </div>
                            )}

                            <div style={{ marginTop: "12px" }}>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e3a8a", marginBottom: "6px" }}>
                                Approved Bank Name
                              </label>
                              <input type="text" value={fData.bankName} onChange={(e) => setFData({ ...fData, bankName: e.target.value })} placeholder="e.g. HDFC, SBI" className="input" />
                            </div>
                            <div
                              style={{
                                marginTop: "12px",
                                padding: "10px",
                                background: "#dbeafe",
                                borderRadius: "6px",
                                border: "1px solid #93c5fd",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a8a" }}>
                                Remaining Balance (After Down Payment &amp; Installments):
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a8a" }}>
                                ₹{Number(
                                  (normalized.totalAmount || 0) -
                                    (fData.downPayment || 0) -
                                    (fData.loanApprovedAmount || 0) -
                                    (fData.finalPaymentAmount || 0),
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {fData.paymentType !== "Loan" && (
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
                    )}
                  </form>

                  {/* ── Loan Documents Upload Section ── */}
                  {fData.paymentType === "Loan" && role !== "banking" && (
                    <div
                      style={{
                        marginTop: "24px",
                        padding: "16px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                          Loan Required Documents
                        </p>
                      </div>

                      {/* Staged Files List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                        {stagedFiles.map((staged, idx) => (
                          <div
                            key={staged.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 12px",
                              background: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          >
                            <input 
                              type="text" 
                              placeholder="Document Name" 
                              value={staged.docName}
                              onChange={(e) => handleDocNameChange(staged.id, e.target.value)}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "13px",
                                outline: "none",
                              }}
                            />
                            
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "8px 16px",
                                background: staged.file ? "#f0fdf4" : "#f1f5f9",
                                border: staged.file ? "1px solid #bbf7d0" : "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: staged.file ? "#166534" : "#475569",
                                cursor: "pointer",
                                minWidth: "120px",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                overflow: "hidden"
                              }}
                            >
                              {staged.file ? staged.file.name : "Upload Document"}
                              <input
                                type="file"
                                onChange={(e) => handleStagedFileSelect(staged.id, e)}
                                style={{ display: "none" }}
                              />
                            </label>

                            {idx === stagedFiles.length - 1 ? (
                              <button
                                type="button"
                                onClick={addDocRow}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "34px",
                                  height: "34px",
                                  background: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  borderRadius: "6px",
                                  color: "#2563eb",
                                  cursor: "pointer",
                                  flexShrink: 0
                                }}
                              >
                                <Plus size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => removeStagedFile(staged.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "34px",
                                  height: "34px",
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  borderRadius: "6px",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  flexShrink: 0
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={uploadStagedFiles}
                          disabled={financeDocsUploading}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: financeDocsUploading ? "not-allowed" : "pointer",
                            opacity: financeDocsUploading ? 0.7 : 1,
                            marginTop: "8px",
                          }}
                        >
                          <CheckCircle2 size={16} />
                          {financeDocsUploading ? "Saving..." : "Save Documents"}
                        </button>
                      </div>

                      {/* Already Uploaded Files */}
                      {financeUploadedDocs.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", margin: 0, marginTop: stagedFiles.length > 0 ? "8px" : "0" }}>Uploaded Documents:</p>
                          {financeUploadedDocs.map((doc) => {
                            const cleanName = doc.doc_name.replace("FINANCE_DOC::", "");
                            return (
                              <div
                                key={doc.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 12px",
                                  background: "#fff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                }}
                              >
                                <a
                                  href={doc.doc_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: "13px", fontWeight: 500, color: "#0f172a", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                  <FileText size={14} color="#64748b" />
                                  {cleanName}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => deleteUploadedFinanceDoc(doc)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: "4px",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center"
                                  }}
                                  title="Delete Document"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        stagedFiles.length === 0 && (
                          <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                            No loan documents uploaded yet.
                          </p>
                        )
                      )}
                    </div>
                  )}


                  {/* Final Payment Collection Banner */}
                  {normalized.currentStage === "Final Payment Collection" && (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "16px",
                        background: "#fffbeb",
                        border: "1px solid #fcd34d",
                        borderRadius: "10px",
                        display: "flex",
                        gap: "12px",
                      }}
                    >
                      <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
                      <div>
                        <h4 style={{ margin: "0 0 6px 0", color: "#92400e", fontSize: "14px", fontWeight: 700 }}>
                          Final Payment Collection (30%)
                        </h4>
                        <p style={{ margin: 0, color: "#b45309", fontSize: "13px", lineHeight: 1.5 }}>
                          The Technical QA inspection is complete. Please collect the remaining final payment (30%).
                          Upload the payment proof document in the "Upload Document" tab (or above), and ensure you add the exact received amount in the <strong>Payment Tracker</strong> below before moving to the next stage.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment History Tracker (B.10) */}
                  {role !== "registration" && (
                    <PaymentTracker caseId={normalized.caseId} userRole={role} />
                  )}
                </>
              )}
            </div>
  );
};

export default FinanceTab;
