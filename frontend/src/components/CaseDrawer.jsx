/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { edgeFetch, EDGE, supabase } from "../lib/supabaseClient";
import { APP_CONFIG } from "../config";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  X,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Zap,
  FileText,
  ClipboardList,
  UserCheck,
  History,
  Package,
  Plus,
  Trash2,
  IndianRupee,
  FileCheck,
  AlertOctagon,
  Printer,
  Star,
  Clock,
  Navigation,
  Download,
  Edit2,
  Lock,
  RefreshCw,
  Microscope,
  Calculator,
  Headphones,
  Link as LinkIcon,
  Send,
  Copy,
  UploadCloud,
} from "lucide-react";
import CaseTimeline from "./CaseTimeline";
import PaymentTracker from "./PaymentTracker";

// Normalize Supabase snake_case row → camelCase the rest of the app expects

import UpdateTab from "./CaseDrawerTabs/UpdateTab";
import DocsTab from "./CaseDrawerTabs/DocsTab";
import HistoryTab from "./CaseDrawerTabs/HistoryTab";
import InstallationPhotosTab from "./CaseDrawerTabs/InstallationPhotosTab";
import FinanceTab from "./CaseDrawerTabs/FinanceTab";
import DispatchTab from "./CaseDrawerTabs/DispatchTab";
import SubsidyTab from "./CaseDrawerTabs/SubsidyTab";
import WorkOrderTab from "./CaseDrawerTabs/WorkOrderTab";
import FeedbackTab from "./CaseDrawerTabs/FeedbackTab";
import TechnicalQaTab from "./CaseDrawerTabs/TechnicalQaTab";
import AccountsTab from "./CaseDrawerTabs/AccountsTab";
import CustomerServiceTab from "./CaseDrawerTabs/CustomerServiceTab";
import CustomerPortalTab from "./CaseDrawerTabs/CustomerPortalTab";
import LoanApprovedDocsTab from "./CaseDrawerTabs/LoanApprovedDocsTab";
import UploadDocumentTab from "./CaseDrawerTabs/UploadDocumentTab";
import ItemDetailsTab from "./CaseDrawerTabs/ItemDetailsTab";

const normalizeCase = (c) => ({
  ...c,
  caseId: c.id ?? c.case_id ?? c.caseId,
  trackingId: c.tracking_id ?? c.trackingId,
  customerId: c.customer_id ?? c.customerId,
  customerName: c.customer_name ?? c.customerName,
  currentStage: c.current_stage ?? c.currentStage,
  assignedTeam: c.assigned_team ?? c.assignedTeam,
  assignedTo: c.assigned_to ?? c.assignedTo,
  loadRequired: c.load_required ?? c.loadRequired,
  paymentType: c.payment_type ?? c.paymentType,
  delayReason: c.delay_reason ?? c.delayReason,
  markedDelayedBy: c.marked_delayed_by ?? c.markedDelayedBy,
  markedDelayedAt: c.marked_delayed_at ?? c.markedDelayedAt,
  documents: c.documents || {},
  documentStatuses: (c.document_statuses ?? c.documentStatuses) || {},
  downPayment: c.down_payment ?? c.downPayment,
  cashAmount: c.cash_amount ?? c.cashAmount,
  paymentMode: c.payment_mode ?? c.paymentMode,
  loanAmount: c.loan_amount ?? c.loanAmount,
  loanApprovedAmount: c.loan_approved_amount ?? c.loanApprovedAmount,
  finalPaymentAmount: c.final_payment_amount ?? c.finalPaymentAmount,
  emiAmount: c.emi_amount ?? c.emiAmount,
  bankName: c.bank_name ?? c.bankName,
  subsidyRefNumber: c.subsidy_ref_number ?? c.subsidyRefNumber,
  subsidyPhase1Amount: c.subsidy_phase1_amount ?? c.subsidyPhase1Amount,
  subsidyPhase2Amount: c.subsidy_phase2_amount ?? c.subsidyPhase2Amount,
  subsidyNote: c.subsidy_note ?? c.subsidyNote,
  totalAmount:
    c.quotation_amount ??
    c.quotationAmount ??
    c.total_amount ??
    c.totalAmount ??
    c.product_price ??
    c.productPrice ??
    c.quotation_price ??
    0,
  // quotation_amount is set automatically when case is created from quotation
  quotationAmount:
    c.quotation_amount ??
    c.quotationAmount ??
    c.total_amount ??
    c.totalAmount ??
    c.product_price ??
    0,
  quotationIdRef: c.quotation_id_ref ?? c.quotationIdRef ?? "",
  quotationVerified: c.quotation_verified ?? c.quotationVerified ?? false,
  financeVerified: c.finance_verified ?? c.financeVerified ?? false,
  accountsVerified: c.accounts_verified ?? c.accountsVerified ?? false,
  isSpecialCase: c.is_special_case ?? c.isSpecialCase ?? false,
});

const STAGES = [
  "Registration Done",
  "Phone Verification Done",
  "Bank & Finance",
  "Sent to Store",
  "Installation Done",
  "Electrical Verification Done",
  "Plant Activated",
  "TQA Verified",
  "Final Payment Collection",
  "Accounts Verified",
  "Sent to Subsidy",
  "Subsidy Registration Completed",
  "Completed",
];

// Maps each stage to the department that OWNS write access at that stage
const stageToRole = {
  "Registration Done": "registration",
  "Phone Verification Done": "registration",
  "Bank & Finance": "banking",
  "Sent to Store": "inventory",
  "Installation Done": "field_installation",
  "Electrical Verification Done": "electrical",
  "Plant Activated": "field_installation",
  "TQA Verified": "technical",
  "Final Payment Collection": "banking",
  "Accounts Verified": "accounts",
  "Sent to Subsidy": "subsidy",
  "Subsidy Registration Completed": "subsidy",
  Completed: "customer_service",
};

const stageToDeptLabel = {
  registration: "Registration Department",
  banking: "Banking & Finance Department",
  inventory: "Inventory / Store Department",
  field_installation: "Installation Department",
  electrical: "Electrical Department",
  tqa: "TQA Department",
  accounts: "Accounts Department",
  subsidy: "Subsidy Department",
  customer_service: "Customer Service",
  admin: "Administration",
};

const getTabs = (role, currentStage, isSpecialCase) => {
  const tabs = [
    { id: "update", icon: Zap, label: "Update" }
  ];
  // For special cases, banking and accounts always get Finance and Doc tabs
  const isSpecialBankingOrAccounts = isSpecialCase && (role === "banking" || role === "accounts");
  if (role !== "inventory" && role !== "field_installation") {
    tabs.push({ id: "docs", icon: FileText, label: role === "banking" ? "Loan Required Documents" : "Documents" });
  }
  if (isSpecialBankingOrAccounts && !tabs.find(t => t.id === "docs")) {
    tabs.push({ id: "docs", icon: FileText, label: "Documents" });
  }
  if (role === "electrical" || role === "admin" || role === "technical") {
    tabs.push({ id: "upload_document", icon: UploadCloud, label: "Upload Document" });
  }
  if (role === "banking" || role === "admin") {
    tabs.push({ id: "loan_approved_docs", icon: FileCheck, label: "Loan Approved Document" });
  }
  if (role === "admin") {
    tabs.push({ id: "history", icon: History, label: "History" });
  }
  if (
    role === "banking" ||
    role === "admin" ||
    role === "accounts" ||
    isSpecialBankingOrAccounts ||
    (role === "registration" && currentStage === "Phone Verification Done")
  ) {
    tabs.push({ id: "finance", icon: ClipboardList, label: "Finance" });
  }
  if (role === "inventory" || role === "admin") {
    tabs.push({ id: "dispatch", icon: Package, label: "Dispatch" });
    tabs.push({ id: "item_details", icon: ClipboardList, label: "Item Details" });
  }
  if (role === "subsidy" || role === "admin") {
    tabs.push({ id: "subsidy", icon: FileCheck, label: "Subsidy" });
  }
  // Work Order / Job Sheet — field installation team + admin
  if (role === "field_installation" || role === "admin") {
    tabs.push({ id: "work_order", icon: Printer, label: "Job Sheet" });
    tabs.push({ id: "installation_photos", icon: MapPin, label: "Installation Photos" });
  }
  // Customer Feedback — admin only, shown on all cases (reads existing feedback)
  if (role === "admin") {
    tabs.push({ id: "feedback", icon: Star, label: "Feedback" });
    tabs.push({
      id: "send_to_customer",
      icon: LinkIcon,
      label: "Customer Portal",
    });
  }
  // Technical QA tab
  if (role === "technical" || role === "admin") {
    tabs.push({ id: "technical_qa", icon: Microscope, label: "Technical QA" });
  }
  // Accounts tab
  if (role === "accounts" || role === "admin") {
    tabs.push({ id: "accounts", icon: Calculator, label: "Accounts" });
  }
  // Customer Service tab
  if (role === "customer_service" || role === "admin") {
    tabs.push({ id: "customer_service", icon: Headphones, label: "CRM" });
  }
  return tabs;
};


const CaseDrawer = ({ caseData, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("update");
  const [newStage, setNewStage] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayLoading, setDelayLoading] = useState(false);
  const [docStatuses, setDocStatuses] = useState({});
  const [history, setHistory] = useState([]);

  // normalized must be declared FIRST — other derived values depend on it
  const normalized = normalizeCase(caseData || {});

  const role = localStorage.getItem("role") || "";
  const TABS = getTabs(role, normalized.currentStage, normalized.isSpecialCase);

  // Compute whether this user's role owns the current stage (write access)
  const ownerRole = stageToRole[normalized.currentStage] || "";
  const canUpdate = role === "admin" || ownerRole === role;
  const ownerDept = stageToDeptLabel[ownerRole] || "Another Department";

  const [financeLoading, setFinanceLoading] = useState(false);
  const [fData, setFData] = useState({
    paymentType: "",
    downPayment: "",
    cashAmount: "",
    paymentMode: "",
    loanAmount: "",
    loanApprovedAmount: "",
    finalPaymentAmount: "",
    emiAmount: "",
    bankName: "",
  });
  const [financeEditMode, setFinanceEditMode] = useState(false);

  const [quotationVerifyLoading, setQuotationVerifyLoading] = useState(false);
  const [quotationEditMode, setQuotationEditMode] = useState(false);
  const [quotationAmountEdit, setQuotationAmountEdit] = useState("");

  const [accountsVerifyLoading, setAccountsVerifyLoading] = useState(false);
  const [accountsEditMode, setAccountsEditMode] = useState(false);

  // ── Download All Docs ZIP state ─────────────────────────────────────────────
  const [downloadZipLoading, setDownloadZipLoading] = useState(false);

  // ── Resend Tracking ID state ────────────────────────────────────────────────
  const [resendLoading, setResendLoading] = useState(false);

  // ── Assign to Employee state (admin only) ────────────────────────────────
  const [deptEmployees, setDeptEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(
    normalized.assignedTo || "",
  );
  const [assignLoading, setAssignLoading] = useState(false);

  // Dispatch Tab State
  const [inventoryList, setInventoryList] = useState([]);
  const [dispatchItems, setDispatchItems] = useState([]);
  const [dispatchDetails, setDispatchDetails] = useState({
    vehicleNumber: "",
    driverName: "",
    notes: "",
  });
  const [dispatchLoading, setDispatchLoading] = useState(false);

  // Subsidy Tab State
  const [subsidyLoading, setSubsidyLoading] = useState(false);
  const [subsidyData, setSubsidyData] = useState({
    subsidyRefNumber: "",
    subsidyNote: "",
  });

  // ── Geo-location state (field_installation only) ────────────────────────────
  const [geoLocation, setGeoLocation] = useState(null); // { lat, lng, accuracy }
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // ── Feedback state (admin, completed cases) ─────────────────────────────────
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    feedback_text: "",
    installation_quality: 0,
    team_behavior: 0,
    timeline_satisfaction: 0,
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const printRef = useRef(null);

  // ── New ERP department tab states ───────────────────────────────────────────
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [technicalSaving, setTechnicalSaving] = useState(false);
  const [accountsNotes, setAccountsNotes] = useState("");
  const [accountsSaving, setAccountsSaving] = useState(false);
  const [crmNote, setCrmNote] = useState("");
  const [crmSaving, setCrmSaving] = useState(false);
  const [portalLink, setPortalLink] = useState("");
  const [portalGenerating, setPortalGenerating] = useState(false);

  // ── Delay risk detection ─────────────────────────────────────────────────────
  // Show amber warning if case has been at current stage > 2 days (client-side)
  const stageStartTime =
    normalized.stage_start_time || caseData?.stage_start_time;
  const daysAtStage = stageStartTime
    ? Math.floor((Date.now() - new Date(stageStartTime).getTime()) / 86400000)
    : 0;
  const isDelayRisk =
    daysAtStage >= 2 &&
    normalized.status !== "Completed" &&
    normalized.status !== "Delayed";

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!caseData) return;
    setDocStatuses(normalized.documentStatuses || {});
    setFData({
      paymentType: normalized.paymentType
        ? normalized.paymentType.toLowerCase() === "loan"
          ? "Loan"
          : "Cash"
        : "",
      downPayment: normalized.downPayment || "",
      cashAmount: normalized.cashAmount || "",
      paymentMode: normalized.paymentMode || "",
      loanAmount: normalized.loanAmount || "",
      loanApprovedAmount: normalized.loanApprovedAmount || "",
      finalPaymentAmount: normalized.finalPaymentAmount || "",
      emiAmount: normalized.emiAmount || "",
      bankName: normalized.bankName || "",
    });

    setSubsidyData({
      subsidyRefNumber: normalized.subsidyRefNumber || "",
      subsidyNote: normalized.subsidyNote || "",
    });
    // Reset geo on case change
    setGeoLocation(null);
    setGeoError("");
  }, [caseData]); // eslint-disable-line

  // Compute next stage dynamically based on the current payment type
  useEffect(() => {
    if (!caseData) return;
    const idx = STAGES.findIndex(
      (s) => s.toLowerCase() === normalized.currentStage?.toLowerCase(),
    );
    if (idx >= 0 && idx < STAGES.length - 1) {
      let nStage = STAGES[idx + 1];
      const currentPType = (fData.paymentType || normalized.paymentType || "").toLowerCase();
      if (nStage === "Bank & Finance" && currentPType === "cash") {
        nStage = "Sent to Store";
      }
      setNewStage(nStage);
    }
  }, [caseData, fData.paymentType, normalized.currentStage, normalized.paymentType]);
  // Note: STAGES is defined at module scope — stable reference, not needed in deps

  // Fetch case history for timeline tab
  useEffect(() => {
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    if (!cId) return;
    edgeFetch(EDGE.workflow, { action: "get_one", caseId: cId })
      .then((res) => setHistory(res.history || []))
      .catch(() => {});
  }, [caseData?.id, caseData?.case_id, caseData?.caseId]);

  const [customerDocs, setCustomerDocs] = useState([]);
  useEffect(() => {
    if (activeTab !== "docs" && activeTab !== "finance") return;
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    if (!cId) return;
    supabase
      .from("customer_uploaded_docs")
      .select("*")
      .eq("case_id", cId)
      .then(({ data }) => setCustomerDocs(data || []))
      .catch(console.error);
  }, [activeTab, caseData?.id, caseData?.case_id, caseData?.caseId]);

  // Fetch inventory for dispatch tab + auto-populate items from system_specs / quotations
  useEffect(() => {
    if (activeTab !== "dispatch") return;
    if (inventoryList.length > 0) return; // already loaded
    const caseId = caseData?.id || caseData?.case_id || caseData?.caseId;
    edgeFetch(EDGE.workflow, { action: "get_inventory", caseId })
      .then((res) => {
        // New response: { inventory: [...], quotationSpecs: {...} | null }
        const invList = res.inventory || res || [];
        const specs = res.quotationSpecs || null;
        setInventoryList(invList);

        if (!specs || !invList || invList.length === 0) return;

        // Safe parse if specs is still a string
        let s = specs;
        if (typeof s === "string") {
          try {
            s = JSON.parse(s);
          } catch {
            return;
          }
        }

        const autoItems = [];
        const match = (keywords, qty) => {
          if (!qty || qty <= 0) return;
          const kws = keywords
            .map((k) => String(k).toLowerCase().trim())
            .filter(Boolean);
          const found = invList.find((inv) =>
            kws.some((kw) => inv.name.toLowerCase().includes(kw)),
          );
          if (found)
            autoItems.push({
              id: found.id,
              quantity: qty,
              _name: found.name,
              _unit: found.unit,
              _auto: true,
            });
        };

        // Solar Panels — panelUnit is e.g. "5kW", panelCount is number of panels
        const panelKw = String(s.panelUnit || "").replace(/[^0-9.]/g, "");
        const panelCount = Number(s.panelCount) || 0;
        if (panelCount > 0) {
          match(
            [
              `solar panel ${panelKw}kw`,
              `solar panel`,
              String(s.productName || "")
                .split(" ")[0]
                .toLowerCase(),
            ],
            panelCount,
          );
        }

        // Inverter — inverterKw is e.g. "5kW"
        const invKw = String(s.inverterKw || "").replace(/[^0-9.]/g, "");
        if (invKw && s.inverterBrand) {
          match(
            [
              `inverter ${invKw}kw`,
              `${String(s.inverterBrand).toLowerCase()} inverter`,
              "inverter",
            ],
            1,
          );
        }

        // Battery — batteryBrand e.g. "Luminous 200Ah", batteryCount is number
        const batCount = Number(s.batteryCount) || 0;
        const batCap = Number(s.batteryCapacity) || 0;
        if (batCount > 0) {
          // batteryBrand may already include capacity e.g. "Luminous 200Ah"
          const batBrandLower = String(s.batteryBrand || "").toLowerCase();
          const batCapStr =
            batCap > 0 ? String(batCap) : batBrandLower.replace(/[^0-9]/g, "");
          match([`battery ${batCapStr}ah`, batBrandLower, "battery"], batCount);
        }

        // Structure — e.g. "Apollo 80mm"
        if (s.structure && String(s.structure).trim()) {
          const structStr = String(s.structure).toLowerCase();
          const mm = structStr.replace(/[^0-9]/g, "") || "";
          match([`structure ${mm}mm`, "apollo structure", "structure"], 1);
        }

        // Wiring / Cable
        if (s.wiring && String(s.wiring).trim()) {
          const wireSize = String(s.wiring).replace(/[^0-9]/g, "");
          match(
            [`wiring ${wireSize}`, `cable ${wireSize}`, "ac wiring", "wiring"],
            1,
          );
        }

        // Earthing
        if (s.earthing && String(s.earthing).trim()) {
          match(["earthing", "earth"], 1);
        }

        // BOS
        if (s.bos && String(s.bos).trim()) {
          match(["bos", "balance of system"], 1);
        }

        // Net Metering
        if (
          s.installation &&
          String(s.installation).trim() &&
          String(s.installation).toLowerCase() !== "none"
        ) {
          match(["net metering", "metering"], 1);
        }

        if (autoItems.length > 0) setDispatchItems(autoItems);
      })
      .catch((err) => console.error("Failed to fetch inventory", err));
  }, [activeTab]); // eslint-disable-line

  // Fetch feedback when feedback tab is opened (admin only)
  useEffect(() => {
    if (activeTab !== "feedback") return;
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    if (!cId) return;
    setFeedbackLoading(true);
    edgeFetch(EDGE.workflow, { action: "get_feedback", caseId: cId })
      .then((res) => setFeedbackList(res || []))
      .catch(() => setFeedbackList([]))
      .finally(() => setFeedbackLoading(false));
  }, [activeTab]); // eslint-disable-line

  // ── Geo-location capture handler ─────────────────────────────────────────────
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocation({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGeoLoading(false);
        toast.success("Location captured successfully!");
      },
      (err) => {
        setGeoError(
          "Could not access location. Please allow location permission or skip.",
        );
        setGeoLoading(false);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true },
    );
  };

  // ── Admin feedback submission ────────────────────────────────────────────────
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (newFeedback.rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    setFeedbackSubmitting(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "submit_feedback",
        caseId: cId,
        customerName: normalized.customerName,
        rating: newFeedback.rating,
        feedback_text: newFeedback.feedback_text,
        installation_quality:
          newFeedback.installation_quality || newFeedback.rating,
        team_behavior: newFeedback.team_behavior || newFeedback.rating,
        timeline_satisfaction:
          newFeedback.timeline_satisfaction || newFeedback.rating,
        submitted_by: "admin",
      });
      toast.success("Feedback recorded!");
      setNewFeedback({
        rating: 0,
        feedback_text: "",
        installation_quality: 0,
        team_behavior: 0,
        timeline_satisfaction: 0,
      });
      // Refresh feedback list
      const res = await edgeFetch(EDGE.workflow, {
        action: "get_feedback",
        caseId: cId,
      });
      setFeedbackList(res || []);
    } catch (err) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const stageIdx = STAGES.findIndex(
    (s) => s.toLowerCase() === normalized.currentStage?.toLowerCase(),
  );
  const pct =
    stageIdx >= 0 ? Math.round(((stageIdx + 1) / STAGES.length) * 100) : 0;
  const caseId = caseData?.id || caseData?.case_id || caseData?.caseId;

  const isRegStage = normalized.currentStage === "Registration Done";
  const isPhoneVerificationStage = normalized.currentStage === "Phone Verification Done";
  const isBankingStage = normalized.currentStage === "Bank & Finance";

  // Use fData (current form state) first, fallback to normalized (DB) — so UI changes are respected immediately
  const pType = ((fData.paymentType || normalized.paymentType || "")).toLowerCase();

  const docs = normalized.documents || {};
  const allDocsObj = { ...docs };
  (customerDocs || []).forEach((d) => {
    allDocsObj[d.doc_name] = d.doc_url;
  });

  const hasDocsTab = TABS.some(t => t.id === "docs");

  const unverifiedDocs = Object.keys(allDocsObj).filter((docName) => {
    if (role === "admin") return false;
    if (!hasDocsTab) return false;

    let isVisible = false;
    if (role === "banking") {
      if (pType === "loan") isVisible = docName.startsWith("FINANCE_DOC::");
      else isVisible = false;
    } else if (docName.startsWith("FINANCE_DOC::")) {
      isVisible = false;
    } else if (role === "registration") {
      if (docName.includes("Loan Approved Document")) isVisible = false;
      else isVisible = true;
    } else {
      const name = docName.toLowerCase();
      if (role === "field_installation") {
        isVisible = name.includes("photo") || name.includes("gps") || name.includes("site") || name.includes("layout") || name.includes("structure") || name.includes("electricity") || name.includes("bill");
      } else if (role === "subsidy") {
        isVisible = name.includes("pan") || name.includes("aadhar") || name.includes("electricity") || name.includes("subsidy") || name.includes("photo") || name.includes("gps") || name.includes("bill") || name.includes("bank") || name.includes("cheque");
      } else if (role === "inventory") {
        isVisible = name.includes("dispatch") || name.includes("challan") || name.includes("invoice") || name.includes("po") || name.includes("bill");
      } else if (role === "electrical") {
        isVisible = !name.startsWith("electrical_doc::") && (name.includes("pan") || name.includes("aadhar") || name.includes("electricity") || name.includes("bill") || name.includes("electrical") || name.includes("photo") || name.includes("gps") || name.includes("site") || name.includes("layout") || name.includes("structure"));
      } else if (role === "technical") {
        isVisible = name.startsWith("installation_photo::");
      }
    }

    if (isVisible) {
      return (docStatuses[docName] || "Yellow") !== "Green";
    }
    return false;
  });

  const hasDocError = unverifiedDocs.length > 0;

  const hasInstallationPhotosTab = TABS.some(t => t.id === "installation_photos");
  const installationPhotosCount = Object.keys(allDocsObj).filter(k => k.startsWith("INSTALLATION_PHOTO::")).length;
  const hasInstallationPhotoError = hasInstallationPhotosTab && installationPhotosCount === 0;
  
  // Quotation must be verified before proceeding from registration stages
  const hasQuotationError = (isRegStage || isPhoneVerificationStage) && !normalized.quotationVerified;
  
  const hasPaymentModeError = isPhoneVerificationStage && (
    // Payment type must always be selected
    !pType ||
    // For Cash: paymentMode is also required
    // For Loan: paymentMode is NOT required (banking team handles it)
    (pType === "cash" && (!normalized.paymentMode || normalized.paymentMode.trim() === "") && (!fData.paymentMode || fData.paymentMode.trim() === ""))
  );

  const hasLoanApprovedDoc = Array.isArray(normalized.documents)
    ? normalized.documents.some((d) => d?.name?.includes("Loan Approved Document"))
    : Object.keys(normalized.documents || {}).some((k) => k.includes("Loan Approved Document"));

  const hasFinanceDetails = pType === "cash"
    ? Boolean(normalized.paymentMode?.trim() || fData.paymentMode?.trim())
    : Boolean(
        String(normalized.loan_amount || fData.loanAmount || "").trim() !== "" &&
        String(normalized.loan_approved_amount || fData.loanApprovedAmount || "").trim() !== "" &&
        String(normalized.bank_name || fData.bankName || "").trim() !== ""
      );

  const isFinanceApproved =
    pType === "loan"
      ? normalized.finance_form_status === "Loan Approved" ||
        normalized.finance_form_status === "Approved" ||
        normalized.finance_final_status === "Approved"
      : true;
        
  const hasFinanceError = isBankingStage && (
    (pType === "loan" && (!hasLoanApprovedDoc || !isFinanceApproved)) ||
    !hasFinanceDetails
  );

  /* ✨ Handlers ✨ */
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error("Please add a handoff note.");
      return;
    }

    // 🚧 Client-side Gates 🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧
    if (hasDocError) {
      if (isBankingStage) {
        toast.error("Please ensure all Loan Required Documents are verified before proceeding.");
      } else {
        toast.error("Please ensure all documents are verified before proceeding.");
      }
      return;
    }
    if (hasInstallationPhotoError) {
      toast.error("Please upload at least one installation photo before proceeding.");
      return;
    }
    if (hasQuotationError) {
      toast.error("Please verify the quotation amount before proceeding.");
      return;
    }
    if (hasPaymentModeError) {
      if (!normalized.paymentType) {
        toast.error("Please select a Payment Type (Cash or Loan) in the Finance tab before proceeding.");
      } else if (pType === "cash") {
        toast.error("Please select a Payment Mode (UPI/Cash/Cheque etc.) in the Finance tab before proceeding.");
      }
      return;
    }
    if (hasFinanceError) {
      if (pType === "loan" && !hasLoanApprovedDoc) {
        toast.error("Please upload the Loan Approved Document in its tab.");
      } else if (pType === "loan" && !hasFinanceDetails) {
        toast.error("Please fill in Loan Amount, Approved Amount, and Bank Name in Finance tab.");
      } else if (pType === "loan" && !isFinanceApproved) {
        toast.error("Please ensure the loan is marked as Approved.");
      } else {
        toast.error("Please ensure payment details are complete before proceeding.");
      }
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    setUpdateLoading(true);
    try {
      if (normalized.currentStage === "Sent to Store") {
        if (dispatchItems.length === 0) {
          toast.error("Please add dispatch items in the Dispatch tab before proceeding.");
          setUpdateLoading(false);
          return;
        }
        for (const item of dispatchItems) {
          if (!item.id || item.quantity <= 0) {
            toast.error("Ensure all selected dispatch items have a valid quantity.");
            setUpdateLoading(false);
            return;
          }
        }
        await edgeFetch(EDGE.workflow, {
          action: "dispatch_materials",
          caseId,
          items: dispatchItems,
          vehicleNumber: dispatchDetails.vehicleNumber,
          driverName: dispatchDetails.driverName,
          notes: dispatchDetails.notes,
        });
        toast.success("Materials dispatched and inventory deducted!");
      }

      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage,
        remarks,
      });
      toast.success("Stage updated!");
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleMarkDelayed = async (unmark = false) => {
    if (!unmark && !delayReason.trim()) {
      toast.error("Enter a delay reason.");
      return;
    }
    setDelayLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "mark_delayed",
        caseId,
        reason: delayReason,
        unmark,
      });
      toast.success(unmark ? "Delay removed." : "Case marked delayed.");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed.");
    } finally {
      setDelayLoading(false);
    }
  };

  const handleDocStatusChange = async (docName, status) => {
    const newStatuses = { ...docStatuses, [docName]: status };
    setDocStatuses(newStatuses);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        documentStatuses: newStatuses,
      });
      const statusLabel = status === "Green" ? "Verified" : status === "Red" ? "Rejected" : "Pending";
      toast.success(`Document marked as ${statusLabel}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleSubsidyUpdate = async (e) => {
    e.preventDefault();
    setSubsidyLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        ...subsidyData,
      });
      toast.success("Subsidy details updated!");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setSubsidyLoading(false);
    }
  };

  const handleFinanceUpdate = async (e) => {
    e.preventDefault();
    setFinanceLoading(true);
    try {
      // Sanitize: convert empty strings to null for numeric DB columns
      const numericFields = [
        "downPayment", "loanAmount", "loanApprovedAmount", "finalPaymentAmount",
        "cashAmount", "quotation_amount", "quotationAmount", "totalAmount"
      ];
      const sanitized = { ...fData };
      numericFields.forEach((key) => {
        if (sanitized[key] === "" || sanitized[key] === undefined) {
          sanitized[key] = null;
        } else if (sanitized[key] !== null) {
          sanitized[key] = Number(sanitized[key]);
        }
      });

      // Only mark finance as verified if the user is banking or accounts (not registration)
      const shouldVerify = role === "banking" || role === "accounts";

      await edgeFetch(EDGE.workflow, {
        action: "update_finance",
        caseId,
        ...sanitized,
        financeVerified: shouldVerify,
      });
      
      const detailsPayload = {
        action: "update_details",
        caseId,
        financeVerified: shouldVerify,
      };

      // If they changed the quotation amount, make sure we save it
      if (sanitized.quotation_amount !== undefined && sanitized.quotation_amount !== null) {
        detailsPayload.quotationAmount = sanitized.quotation_amount;
      } else if (sanitized.quotationAmount !== undefined && sanitized.quotationAmount !== null) {
        detailsPayload.quotationAmount = sanitized.quotationAmount;
      } else if (sanitized.totalAmount !== undefined && sanitized.totalAmount !== null) {
        detailsPayload.quotationAmount = sanitized.totalAmount;
      }

      await edgeFetch(EDGE.workflow, detailsPayload);
      toast.success("Finance details updated!");
      setFinanceEditMode(false);
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setFinanceLoading(false);
    }
  };


  const handleQuotationVerify = async (editedAmount) => {
    setQuotationVerifyLoading(true);
    try {
      const amount =
        editedAmount !== undefined
          ? Number(editedAmount)
          : Number(normalized.quotationAmount);
      if (!amount || amount <= 0) {
        toast.error("Please enter a valid quotation amount.");
        return;
      }
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        quotationVerified: true,
        quotationAmount: amount,
      });
      // Toast notification — non-intrusive corner notification (no popup/page-close)
      toast.success("✓ Quotation verified successfully!");
      setQuotationEditMode(false);
      setQuotationAmountEdit("");
      onRefresh(); // refresh data in-place, drawer stays open
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setQuotationVerifyLoading(false);
    }
  };

  // ── Download All Documents as ZIP ──────────────────────────────────────────
  const handleDownloadZip = async (visibleDocs) => {
    if (!visibleDocs || visibleDocs.length === 0) return;
    setDownloadZipLoading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("documents");
      let successCount = 0;

      await Promise.all(
        visibleDocs.map(async ([docName, docUrl]) => {
          try {
            const response = await fetch(docUrl, { mode: "cors" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            // Derive extension from Content-Type or URL
            const ct = response.headers.get("content-type") || "";
            const extMap = {
              "application/pdf": ".pdf",
              "image/jpeg": ".jpg",
              "image/jpg": ".jpg",
              "image/png": ".png",
              "image/webp": ".webp",
            };
            const ext =
              extMap[ct.split(";")[0].trim()] ||
              (docUrl.match(/\.([a-z0-9]{2,5})(\?|$)/i)?.[1]
                ? "." + docUrl.match(/\.([a-z0-9]{2,5})(\?|$)/i)[1]
                : "");
            const safeDocName = docName.replace(/[^a-zA-Z0-9_\- ]/g, "_");
            folder.file(`${safeDocName}${ext}`, blob);
            successCount++;
          } catch (fileErr) {
            console.warn(
              `[downloadZip] Skipped "${docName}":`,
              fileErr.message,
            );
          }
        }),
      );

      if (successCount === 0) {
        toast.error(
          "Could not download any documents. Files may be inaccessible.",
        );
        return;
      }

      // Systematic filename: Documents_[CustomerID]_[CustomerName].zip
      const custId = (normalized.customerId || "UNKNOWN").replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      const custName = (normalized.customerName || "Customer")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const zipName = `Documents_${custId}_${custName}.zip`;

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, zipName);
      toast.success(
        `Downloaded ${successCount} document${successCount !== 1 ? "s" : ""} as ${zipName}`,
      );
    } catch (err) {
      toast.error("ZIP download failed. Please try again.");
      console.error("[downloadZip]", err);
    } finally {
      setDownloadZipLoading(false);
    }
  };

  // ── Resend Tracking ID ─────────────────────────────────────────────────────
  const handleResendTrackingId = async () => {
    setResendLoading(true);
    try {
      const res = await edgeFetch(EDGE.workflow, {
        action: "resend_tracking_id",
        caseId,
      });
      toast.success(res.message || "Tracking ID resent to customer!");
    } catch (err) {
      toast.error(err.message || "Resend failed.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleAccountsVerify = async () => {
    setAccountsVerifyLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        accountsVerified: true,
      });
      toast.success("Payment received and verified!");
      setAccountsEditMode(false);
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setAccountsVerifyLoading(false);
    }
  };

  const handleAddDispatchItem = () => {
    setDispatchItems([...dispatchItems, { id: "", quantity: 1 }]);
  };

  const handleDispatchItemChange = (index, field, value) => {
    const newItems = [...dispatchItems];
    newItems[index][field] = value;
    setDispatchItems(newItems);
  };

  const handleRemoveDispatchItem = (index) => {
    setDispatchItems(dispatchItems.filter((_, i) => i !== index));
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (dispatchItems.length === 0) {
      toast.error("Add at least one item to dispatch.");
      return;
    }
    // Validate
    for (const item of dispatchItems) {
      if (!item.id || item.quantity <= 0) {
        toast.error("Ensure all selected items have a valid quantity.");
        return;
      }
    }

    toast.success("Dispatch details saved! Please go to the 'Update' tab to confirm and deduct inventory.");
  };

  // ── PDF Download ─────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setPrintLoading(true);

    const trackId =
      normalized.trackingId || normalized.id || normalized.caseId || "—";
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const deptLabel =
      role === "admin"
        ? "Admin"
        : role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ");
    const fmt = (v) =>
      v && !isNaN(v) ? `₹${Number(v).toLocaleString("en-IN")}` : v || "—";
    const hasVal = (v) =>
      v !== null && v !== undefined && String(v).trim() !== "";

    const secHdr = (t) =>
      `<tr><td colspan="4" style="background:#0f1724;color:#fff;padding:10px 14px;font-size:14px;font-weight:700;letter-spacing:0.07em;border:none">${t}</td></tr>`;

    const row2 = (l1, v1, l2 = "", v2 = "") =>
      `<tr>
        <td style="padding:10px 14px;font-weight:700;color:#334155;font-size:13px;width:18%;background:#f8fafc;border:1px solid #cbd5e1">${l1}</td>
        <td style="padding:10px 14px;color:#000;font-size:14px;font-weight:500;width:32%;border:1px solid #cbd5e1">${hasVal(v1) ? v1 : "—"}</td>
        <td style="padding:10px 14px;font-weight:700;color:#334155;font-size:13px;width:18%;background:#f8fafc;border:1px solid #cbd5e1">${l2}</td>
        <td style="padding:10px 14px;color:#000;font-size:14px;font-weight:500;width:32%;border:1px solid #cbd5e1">${hasVal(v2) ? v2 : l2 ? "—" : ""}</td>
      </tr>`;

    const isAdmin = role === "admin";
    const isBank = ["admin", "banking"].includes(role);
    const isReg = ["admin", "registration", "banking", "sales"].includes(role);
    const isInst = ["admin", "field_installation"].includes(role);
    const isInv = ["admin", "inventory"].includes(role);
    const isSub = ["admin", "subsidy"].includes(role);

    // Customer section
    const customerSection = `
      ${secHdr("CUSTOMER INFORMATION")}
      ${row2("Tracking ID", `<strong>${trackId}</strong>`, "Customer ID", normalized.customerId)}
      ${row2("Customer Name", `<strong>${normalized.customerName}</strong>`, "Status", normalized.status)}
      ${row2("Current Stage", normalized.currentStage, "Assigned Team", normalized.assignedTeam || "—")}
      ${isReg || isInst ? row2("Phone", normalized.phone, "Alternate Phone", normalized.alternatePhone || "—") : ""}
      ${isReg || isInst ? row2("Address", normalized.address, "Load Required", normalized.loadRequired ? normalized.loadRequired + " kW" : "—") : ""}
      ${isReg ? row2("Payment Type", normalized.paymentType, "Consumer ID", normalized.consumerId || "—") : ""}
      ${isReg ? row2("Company", normalized.companyName || "—", "Project Type", normalized.projectType || "—") : ""}
      ${isReg ? row2("Sales Person", normalized.salesPerson || "—", "GSTIN", normalized.gstin || "N/A") : ""}
    `;

    // Finance section
    const financeSection = isBank
      ? `
      ${secHdr("FINANCIAL DETAILS")}
      ${row2("Payment Type", normalized.paymentType, "Down Payment", fmt(normalized.downPayment))}
      ${row2("Loan Amount", fmt(normalized.loanAmount), "Monthly EMI", fmt(normalized.emiAmount))}
      ${row2("Approved Bank", normalized.bankName || "—", "Cash Amount", fmt(normalized.cashAmount))}
    `
      : "";

    // Installation section
    const installSection = isInst
      ? `
      ${secHdr("INSTALLATION DETAILS")}
      ${row2("Site Visit Date", normalized.siteVisitDate || "—", "Load Required", normalized.loadRequired ? normalized.loadRequired + " kW" : "—")}
      ${row2("Installation Note", normalized.installationNote || "—", "", "")}
    `
      : "";

    // Dispatch section with items table
    let dispatchSection = "";
    if (isInv) {
      const items = normalized.dispatchedItems;
      let itemsBody = "";
      if (Array.isArray(items) && items.length > 0) {
        itemsBody = items
          .map(
            (it, i) =>
              `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px;text-align:center">${i + 1}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px">${it.name || it.item || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px;text-align:center">${it.quantity ?? "—"}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px">${it.unit || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px">${it.notes || "—"}</td>
          </tr>`,
          )
          .join("");
      } else {
        itemsBody = `<tr><td colspan="5" style="padding:12px;color:#64748b;font-size:13px;border:1px solid #cbd5e1;text-align:center">No dispatch items recorded.</td></tr>`;
      }
      dispatchSection = `
        ${secHdr("DISPATCH DETAILS")}
        ${row2("Dispatch Date", normalized.dispatchDate || "—", "Vehicle Number", normalized.dispatchVehicle || "—")}
        ${row2("Driver Name", normalized.dispatchDriver || "—", "", "")}
        ${secHdr("DISPATCH MATERIALS")}
        <tr><td colspan="4" style="padding:0;border:none">
          <table style="width:100%;border-collapse:collapse">
            <tr style="background:#1e293b;color:#fff">
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px;width:5%">Sr.</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px">Item Description</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px;text-align:center">Qty</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px">Unit</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px">Notes</th>
            </tr>
            ${itemsBody}
          </table>
        </td></tr>
      `;
    }

    // Subsidy section
    const subsidySection = isSub
      ? `
      ${secHdr("SUBSIDY DETAILS")}
      ${row2("Consumer ID", normalized.consumerId || "—", "Subsidy Ref. No.", normalized.subsidyRefNumber || "—")}
      ${row2("Subsidy Note", normalized.subsidyNote || "—", "", "")}
    `
      : "";

    const statusColor =
      normalized.status === "Completed"
        ? "#065f46"
        : normalized.status === "Delayed"
          ? "#991b1b"
          : "#3730a3";
    const statusBg =
      normalized.status === "Completed"
        ? "#d1fae5"
        : normalized.status === "Delayed"
          ? "#fee2e2"
          : "#e0e7ff";

    const printHTML = `<!DOCTYPE html><html><head>
      <title>${APP_CONFIG.companyName} — ${trackId}</title>
      <meta charset="UTF-8"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff}
        .page{max-width:850px;margin:auto;padding:20px}
        .hdr{background:linear-gradient(135deg,#0f1724 0%,#0f2a1a 100%);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-radius:6px}
        .hdr-left h1{font-size:26px;font-weight:800;letter-spacing:-0.01em}
        .hdr-left p{font-size:14px;color:rgba(255,255,255,0.7);margin-top:4px}
        .hdr-right{text-align:right}
        .hdr-right .tid{font-family:monospace;font-size:18px;font-weight:700;color:#93c5fd}
        .hdr-right .dt{font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px}
        .badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;background:${statusBg};color:${statusColor};margin-top:8px}
        .dept{display:inline-block;padding:6px 16px;background:#ede9fe;color:#5b21b6;border-radius:6px;font-size:13px;font-weight:700;letter-spacing:0.05em;margin-bottom:18px}
        table.info{width:100%;border-collapse:collapse;margin-bottom:0}
        .footer{font-size:11px;color:#64748b;border-top:1px solid #cbd5e1;padding-top:14px;margin-top:24px;display:flex;justify-content:space-between}
        @media print{body{padding:0}.page{padding:12px}}
      </style></head>
      <body><div class="page">
        <div class="hdr">
          <div class="hdr-left">
            <h1>&#9728; ${APP_CONFIG.companyName} CRM</h1>
            <p>Official Case Document</p>
          </div>
          <div class="hdr-right">
            <div class="tid">${trackId}</div>
            <div class="dt">Generated: ${today}</div>
            <div class="badge">${normalized.status || "In Progress"}</div>
          </div>
        </div>
        <div class="dept">&#128203; Downloaded by: ${deptLabel}</div>
        <table class="info">
          ${customerSection}
          ${financeSection}
          ${installSection}
          ${dispatchSection}
          ${subsidySection}
        </table>
        <div class="footer">
          <span>&#9888; Confidential — Authorized for ${deptLabel} only. Do not share.</span>
          <span>${APP_CONFIG.companyName} CRM &nbsp;&middot;&nbsp; ${today}</span>
        </div>
      </div></body></html>`;

    const win = window.open("", "_blank", "width=920,height=750");
    if (win) {
      win.document.write(printHTML);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 400);
    } else {
      toast.error("Popup blocked — allow popups for this site and try again.");
    }
    setPrintLoading(false);
    toast.success("PDF ready — use Ctrl+P → Save as PDF");
  };

  const isCompleted = caseData?.currentStage === "Completed";

  /* ── Render ── */

  const ctx = {
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
    hasFinanceDetails,
    hasLoanApprovedDoc,
    hasQuotationError,
    hasInstallationPhotoError,
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
  };

  return (
    <div className="drawer-modal-container" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", padding: "16px" }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
      <div
        className="drawer-modal"
        style={{ width: "100%", maxWidth: "800px", maxHeight: "95vh", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div className="no-print" style={{ backgroundColor: "#0f172a", padding: "12px 16px", color: "#ffffff", display: "flex", flexDirection: "column", gap: "8px", position: "relative", flexShrink: 0 }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0", color: "#f8fafc" }}>
                {normalized.customerName}
              </h2>
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "13px", letterSpacing: "0.02em" }}>
                {normalized.trackingId}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(normalized.trackingId);
                    alert("Tracking ID copied!");
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0 4px", marginLeft: "4px" }}
                  title="Copy Tracking ID"
                >
                  <Copy size={12} />
                </button>
              </span>
              <span style={{ color: "#a855f7", fontWeight: 600, fontSize: "12px" }}>
                Customer ID: {normalized.customerId || "N/A"} {caseData?.sales_person || caseData?.salesPerson ? `(${caseData.sales_person || caseData.salesPerson})` : ""}
              </span>
            </div>
            
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }} onClick={handleDownloadPDF}>
                <Download size={14} /> PDF
              </button>
              <button onClick={onClose} style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "#ffffff", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyItems: "center" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", color: "#94a3b8", fontSize: "12px", fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={14} style={{ color: "#64748b" }} /> {caseData.phone || "N/A"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} style={{ color: "#64748b" }} /> {[caseData.city, caseData.district, caseData.state].filter(Boolean).join(", ") || caseData.address || caseData.pinCode || "N/A"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Zap size={14} style={{ color: "#64748b" }} /> {caseData.plant_capacity || caseData.system_size_kw || caseData.kw_capacity || caseData.load_required || caseData.loadRequired || caseData.system_capacity || caseData.system_specs?.inverterKw || caseData.system_specs?.systemCapacity || "0"} kW</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <span style={{ backgroundColor: "#064e3b", color: "#34d399", padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>
              {normalized.status === "Completed" ? "Completed" : normalized.currentStage || "In Progress"}
            </span>
            {normalized.assignedTo && normalized.assignedTo === localStorage.getItem("name") && (
              <span style={{ backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <UserCheck size={12} /> Assigned to You
              </span>
            )}
            {normalized.isSpecialCase && (
              <span style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#e879f9", border: "1px solid rgba(217, 70, 239, 0.4)", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                ⭐ Special Case
              </span>
            )}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "4px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${(Math.max(0, STAGES.indexOf(normalized.currentStage)) + 1) / STAGES.length * 100}%`, height: "100%", backgroundColor: "#f59e0b", position: "absolute", left: 0, top: 0, borderRadius: "2px" }} />
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                Stage {Math.max(0, STAGES.indexOf(normalized.currentStage)) + 1} of {STAGES.length}
              </span>
            </div>
          </div>
        </div>

        <div className="no-print" style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "0 16px", flexShrink: 0 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isTabDisabled = !canUpdate && tab.id !== "update";
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isTabDisabled) return;
                  setActiveTab(tab.id);
                }}
                disabled={isTabDisabled}
                title={isTabDisabled ? "View-Only Access: Tab disabled" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  borderBottom: isActive ? "3px solid #f59e0b" : "3px solid transparent",
                  backgroundColor: "transparent",
                  color: isActive ? "#f59e0b" : (isTabDisabled ? "#cbd5e1" : "#64748b"),
                  cursor: isTabDisabled ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  outline: "none",
                  transition: "all 0.2s",
                  opacity: isTabDisabled ? 0.6 : 1
                }}
              >
                <tab.icon
                  size={16}
                  style={{ color: isActive ? "#f59e0b" : (isTabDisabled ? "#cbd5e1" : "#cbd5e1") }}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="print-visible-content" style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {activeTab === "update" && <UpdateTab ctx={ctx} />}
          {activeTab === "docs" && <DocsTab ctx={ctx} />}
          {activeTab === "upload_document" && <UploadDocumentTab ctx={ctx} />}
          {activeTab === "installation_photos" && <InstallationPhotosTab ctx={ctx} />}
          {activeTab === "loan_approved_docs" && <LoanApprovedDocsTab ctx={ctx} />}
          {activeTab === "history" && <HistoryTab ctx={ctx} />}
          {activeTab === "finance" && <FinanceTab ctx={ctx} />}
          {activeTab === "dispatch" && <DispatchTab ctx={ctx} />}
          {activeTab === "item_details" && <ItemDetailsTab ctx={ctx} />}
          {activeTab === "subsidy" && <SubsidyTab ctx={ctx} />}
          {activeTab === "work_order" && <WorkOrderTab ctx={ctx} />}
          {activeTab === "feedback" && <FeedbackTab ctx={ctx} />}
          {activeTab === "technical_qa" && <TechnicalQaTab ctx={ctx} />}
          {activeTab === "accounts" && <AccountsTab ctx={ctx} />}
          {activeTab === "customer_service" && <CustomerServiceTab ctx={ctx} />}
          {activeTab === "send_to_customer" && <CustomerPortalTab ctx={ctx} />}
        </div>
      </div>
    </div>
  );
};

export default CaseDrawer;
