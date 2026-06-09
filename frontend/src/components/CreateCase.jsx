import React, { useState, useEffect } from "react";
import { supabase, edgeFetch, EDGE } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Send, Plus } from "lucide-react";
import Sidebar from "./Sidebar";

import {
  INIT,
  BRAND_WATT,
  BRAND_PRICE_PER_PANEL,
  S,
  getProductName,
} from "./CreateCaseSections/createCaseConstants";

import CustomerSection from "./CreateCaseSections/CustomerSection";
import TechnicalSpecsSection from "./CreateCaseSections/TechnicalSpecsSection";
import PanelAndBrandSection from "./CreateCaseSections/PanelAndBrandSection";
import WarrantyInverterSection from "./CreateCaseSections/WarrantyInverterSection";
import SystemComponentsSection from "./CreateCaseSections/SystemComponentsSection";
import PricingSection from "./CreateCaseSections/PricingSection";
import DocumentUploadSection from "./CreateCaseSections/DocumentUploadSection";

export default function CreateCase({ onLogout }) {
  const [f, setF] = useState(INIT);
  const [loading, setLoad] = useState(false);
  const [docs, setDocs] = useState({});
  const [occupation, setOccupation] = useState("Job/Service");
  const [wattMappings, setWattMappings] = useState({});
  const navigate = useNavigate();

  // ── Load admin-defined wattage mappings ───────────────────────────────────
  useEffect(() => {
    supabase
      .from("wattage_mappings")
      .select("kw_value, watt_value")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach((r) => { map[r.kw_value] = r.watt_value; });
          setWattMappings(map);
        }
      })
      .catch(() => {});
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const getSystemKw = () =>
    parseInt(String(f.electricalLoad).replace(/kW$/i, ""), 10) || 0;

  const recalc = (brand, unit) => {
    if (!brand || !unit) return {};
    const kw = parseInt(unit);
    if (!kw) return {};
    const panels = kw * 2;
    const watt = BRAND_WATT[brand] || 545;
    const totalWatt = wattMappings[kw] ? wattMappings[kw] : kw * watt;
    const price = BRAND_PRICE_PER_PANEL[brand] || 11000;
    return { panelCount: panels, totalWatt, totalPrice: panels * price };
  };

  // ── Form field handlers ───────────────────────────────────────────────────
  const onProdCat = (cat) => {
    setF((p) => ({
      ...p,
      productCategory: cat,
      productName: getProductName(p.panelBrand, cat, p.subCategory),
    }));
  };

  const onSubCat = (cat) => {
    setF((p) => ({
      ...p,
      subCategory: cat,
      productName: getProductName(p.panelBrand, p.productCategory, cat),
    }));
  };

  const onBrand = (brand) => {
    setF((p) => ({
      ...p,
      panelBrand: brand,
      productName: getProductName(brand, p.productCategory, p.subCategory),
      gtiInverter: "",
      ...recalc(brand, p.panelUnit),
    }));
  };

  const onPanelUnit = (unit) => {
    setF((p) => ({ ...p, panelUnit: unit, ...recalc(p.panelBrand, unit) }));
  };

  const onPanelCount = (n) => {
    const kw = parseInt(f.panelUnit) || 0;
    const price = BRAND_PRICE_PER_PANEL[f.panelBrand] || 11000;
    setF((p) => ({
      ...p,
      panelCount: n,
      totalWatt: kw * 1000,
      totalPrice: n * price,
    }));
  };

  const onInverterKw = (kw) => {
    const num = parseInt(String(kw).replace(/kW$/i, ""), 10) || 0;
    setF((p) => ({ ...p, inverterKw: kw, inverterPrice: num * 9000 }));
  };

  const updateBatteryVals = (bBrand, bCap, qty) => {
    const capNum = parseInt(String(bCap).replace(/Ah$/i, ""), 10) || 0;
    let price = 0;
    if (capNum === 150) price = 15000;
    else if (capNum === 200) price = 19000;
    else price = capNum * 100;
    setF((p) => ({
      ...p,
      batteryBrand: bBrand,
      batteryCapacity: bCap,
      batteryQty: qty,
      totalBatCapacity: qty * capNum,
      totalBatPrice: qty * price,
    }));
  };

  const handleFileChange = (e, key) => {
    setDocs({ ...docs, [key]: e.target.files[0] });
  };

  // ── Document rules ────────────────────────────────────────────────────────
  const BASE_DOCS_CC = [
    "Electricity Bill (Last 2 Months)",
    "Aadhar Card Copy (Electricity Bill Owner)",
    "PAN Card (Electricity Bill Owner)",
    "Bank Details (Cancelled Cheque / Account Number)",
    "Property Proof (House Tax Receipt / Registry Copy)",
    "Verification 4 Photo (Customer House GPS Pic)",
  ];

  const PROFILE_JOB_DOCS_CC = [
    "3 Months Salary Slip",
    "6 Months Bank Statement",
    "Form 16 of Last 3 Years",
    "Last 3 Year ITR",
  ];

  const PROFILE_BIZ_DOCS_CC = [
    "Last 3 Year ITR",
    "6 Months Bank Statement",
    "GST Certificate",
  ];

  const getMandatoryDocs = () => {
    const kw = getSystemKw();
    if (kw >= 4) {
      const profileDocs =
        occupation === "Business" ? PROFILE_BIZ_DOCS_CC : PROFILE_JOB_DOCS_CC;
      return [...BASE_DOCS_CC, ...profileDocs];
    }
    return BASE_DOCS_CC;
  };

  const MANDATORY_DOCS = getMandatoryDocs();
  const getOptionalDocuments = () => [];

  // ── Computed flags ─────────────────────────────────────────────────────────
  const priceOk =
    f.productPrice && f.recheckPrice && f.productPrice === f.recheckPrice;
  const showBat = f.subCategory === "Off Grid" || f.subCategory === "Hybrid";

  // ── Form submission ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.email) {
      toast.error("Customer Email ID is required!");
      return;
    }
    if (!priceOk) {
      toast.error("Prices do not match!");
      return;
    }
    for (const doc of MANDATORY_DOCS) {
      if (!docs[doc]) {
        toast.error(`Please upload "${doc}".`);
        return;
      }
    }

    setLoad(true);
    try {
      const uploadedUrls = {};
      toast.loading("Uploading documents...", { id: "upload" });

      for (const [key, file] of Object.entries(docs)) {
        if (file) {
          const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, "_");
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
          const fileName = `case_docs/${Date.now()}_${sanitizedKey}_${sanitizedFileName}`;
          const { data, error } = await supabase.storage // eslint-disable-line no-unused-vars
            .from("documents")
            .upload(fileName, file);
          if (error) {
            throw new Error(
              `Upload failed for ${key}: ${error.message} (Bucket might be missing or RLS blocked it)`
            );
          } else {
            const { data: publicUrlData } = supabase.storage
              .from("documents")
              .getPublicUrl(fileName);
            uploadedUrls[key] = publicUrlData.publicUrl;
          }
        }
      }
      toast.dismiss("upload");

      const parseKw = (val) =>
        parseInt(String(val).replace(/kW$/i, ""), 10) || 0;

      const buildWiring = () => {
        if (!f.wireSize && !f.wireMake && !f.wire_core_material && !f.wire_armouring) return "";
        const sizeStr = f.wireSize ? f.wireSize.replace(/sq mm/i, "").trim() : "";
        
        let res = sizeStr ? `${sizeStr} Square MM<br/>` : "";
        res += `(Havells/Polycap/KEI)`;
        
        let extra = f.wire_core_material || "";
        if (f.wire_armouring) extra += (extra ? " - " : "") + f.wire_armouring;
        
        if (extra) {
          res += `<br/>(${extra})`;
        }
        return res;
      };

      const systemSpecs = {
        productCategory: f.subCategory,
        productBrand: f.panelBrand,
        productName: f.productName || f.panelBrand,
        panelUnit: parseKw(f.panelUnit),
        panelCount: f.panelCount,
        totalWatt: f.totalWatt,
        productPrice: Number(f.productPrice),
        panelWarranty: f.panelWarranty,
        inverterBrand: f.gtiInverter,
        inverterKw: parseKw(f.inverterKw),
        inverterWarranty: f.inverterWarranty,
        inverterPrice: Number(f.inverterPrice) || 0,
        batteryBrand:
          f.batteryBrand && f.batteryCapacity
            ? `${f.batteryBrand} ${f.batteryCapacity}`.trim()
            : null,
        batteryCount: f.batteryQty || 0,
        batteryWarranty: f.batteryWarranty || null,
        batteryCapacity: f.totalBatCapacity || 0,
        structure: f.structureBrand
          ? `${f.structureBrand} ${f.structureSize ? (f.structureSize.toLowerCase().endsWith('mm') ? f.structureSize : f.structureSize + ' mm') : ''}`.trim()
          : "",
        bos: f.bos,
        wiring: buildWiring(),
        wireCoreM: `${f.wireMake || ""} ${f.wire_core_material || ""} ${f.wireSize || ""}`.trim(),
        wireArmouring: f.wire_armouring,
        earthing: f.earthing ? String(f.earthing) : "",
        installation: f.installation,
      };

      const payload = {
        action: "create_case",
        reference: f.reference,
        pinCode: f.pinCode,
        customerName: f.customerName,
        email: f.email,
        phone: f.mobile,
        alternatePhone: "",
        address: f.address,
        loadRequired: parseKw(f.electricalLoad),
        customerOccupation: occupation,
        systemSpecs,
        documents: uploadedUrls,
      };

      await edgeFetch(EDGE.workflow, payload);
      toast.success("✅ Case successfully registered!");
      setF(INIT);
      setDocs({});
      navigate("/cases");
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoad(false);
      toast.dismiss("upload");
    }
  };

  // ── Context object passed to all section sub-components ───────────────────
  const ctx = {
    f, set, docs, occupation, setOccupation,
    priceOk, showBat,
    onProdCat, onSubCat, onBrand,
    onPanelUnit, onPanelCount, onInverterKw,
    updateBatteryVals, handleFileChange,
    getSystemKw, MANDATORY_DOCS, getOptionalDocuments,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--page-bg)" }}>
      <Sidebar onLogout={onLogout} />

      <main style={{ flex: 1, marginLeft: "var(--main-offset)" }}>
        <div style={S.page}>
          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div style={S.hdr}>
            <div
              style={{
                width: 45, height: 45,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Plus size={24} />
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800 }}>New Case Registration</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Register a new solar installation project with technical specs and documents
              </div>
            </div>
          </div>

          {/* ── Form ────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            <CustomerSection ctx={ctx} />
            <TechnicalSpecsSection ctx={ctx} />
            <PanelAndBrandSection ctx={ctx} />
            <WarrantyInverterSection ctx={ctx} />
            <SystemComponentsSection ctx={ctx} />
            <PricingSection ctx={ctx} />
            <DocumentUploadSection ctx={ctx} />

            <button
              type="submit"
              disabled={loading || !priceOk}
              style={{ ...S.sub, opacity: loading || !priceOk ? 0.6 : 1 }}
            >
              <Send size={16} />
              {loading ? "Registering Case..." : "Submit New Case"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
