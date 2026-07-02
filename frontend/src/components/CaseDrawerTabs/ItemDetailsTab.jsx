/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Package } from "lucide-react";

/**
 * ItemDetailsTab
 * Shown inside the Inventory case drawer as a 3rd tab ("Item Details").
 * Fetches the quotation for the case and displays the system components in a table.
 */
const ItemDetailsTab = ({ ctx }) => {
  const { caseData, normalized } = ctx;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError("");
      setItems([]);

      try {
        // First try system_specs from the case row itself
        const systemSpecs = caseData?.system_specs || caseData?.systemSpecs;

        if (systemSpecs && typeof systemSpecs === "object" && Object.keys(systemSpecs).length > 0) {
          const built = buildItemsFromSpecs(systemSpecs);
          if (built.length > 0) {
            setItems(built);
            setLoading(false);
            return;
          }
        }

        // Fall back: look up the quotation by quotation_id_ref or customer_name
        const quotIdRef = normalized?.quotationIdRef || caseData?.quotation_id_ref;
        let quotRow = null;

        if (quotIdRef) {
          const { data } = await supabase
            .from("quotations")
            .select("*")
            .eq("id", quotIdRef)
            .maybeSingle();
          quotRow = data;
        }

        if (!quotRow && normalized?.customerName) {
          const { data } = await supabase
            .from("quotations")
            .select("*")
            .ilike("customer_name", normalized.customerName)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          quotRow = data;
        }

        if (quotRow) {
          setItems(buildItemsFromQuotation(quotRow));
        } else {
          setError("No quotation found for this case.");
        }
      } catch (err) {
        console.error("[ItemDetailsTab]", err);
        setError("Failed to load item details.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []); // eslint-disable-line

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
        System Components (from Quotation)
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              width: 28,
              height: 28,
              border: "2px solid #e2e8f0",
              borderTopColor: "#f59e0b",
              borderRadius: "50%",
              margin: "0 auto 12px",
              animation: "itemDetailsTabSpin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "13px", color: "var(--text-4)" }}>Loading item details...</p>
        </div>
      ) : error ? (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            color: "#b91c1c",
            fontSize: "13px",
          }}
        >
          <Package size={24} style={{ margin: "0 auto 8px", opacity: 0.5, display: "block" }} />
          <p style={{ fontWeight: 600 }}>{error}</p>
          <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
            This case may not have a linked quotation yet.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <Package size={28} color="#94a3b8" style={{ margin: "0 auto 10px", display: "block" }} />
          <p style={{ color: "var(--text-3)", fontSize: "13px", fontWeight: 600 }}>
            No items found in quotation
          </p>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ background: "#0f172a", color: "#fff" }}>
                <th style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, fontSize: "12px", letterSpacing: "0.04em", width: "48px" }}>
                  S.No
                </th>
                <th style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, fontSize: "12px", letterSpacing: "0.04em" }}>
                  Item Description
                </th>
                <th style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, fontSize: "12px", letterSpacing: "0.04em", width: "100px" }}>
                  Capacity
                </th>
                <th style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, fontSize: "12px", letterSpacing: "0.04em", width: "70px" }}>
                  Qty
                </th>
                <th style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, fontSize: "12px", letterSpacing: "0.04em", width: "110px" }}>
                  Warranty
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: "12px" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>
                    {item.description}
                    {item.brand && (
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 400, marginLeft: "6px" }}>
                        ({item.brand})
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: "#2563eb", fontSize: "12.5px" }}>
                    {item.capacity || "-"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                    {item.quantity ?? "-"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center", fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                    {item.warranty || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes itemDetailsTabSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// --- Helpers ------------------------------------------------------------------

function buildItemsFromSpecs(specs) {
  const rows = [];
  const s = typeof specs === "string" ? JSON.parse(specs) : specs;

  if (Number(s.panelCount) > 0) {
    rows.push({
      description: s.productName || "Solar Panel",
      brand: s.productBrand || "",
      capacity: s.panelUnit || (s.totalWatt ? `${s.totalWatt} W` : "-"),
      quantity: s.panelCount,
      warranty: s.panelWarranty || "-",
    });
  }

  if (s.inverterBrand || s.inverterKw) {
    rows.push({
      description: `${s.inverterBrand || "GTI"} Inverter`,
      brand: "",
      capacity: s.inverterKw || "-",
      quantity: 1,
      warranty: s.inverterWarranty ? `${s.inverterWarranty} Yrs` : "-",
    });
  }

  if (Number(s.batteryCount) > 0) {
    rows.push({
      description: s.batteryBrand ? `Battery: ${s.batteryBrand}` : "Battery",
      brand: "",
      capacity: s.batteryCapacity ? `${s.batteryCapacity} Ah` : "-",
      quantity: s.batteryCount,
      warranty: s.batteryWarranty || "-",
    });
  }

  if (s.structure && String(s.structure).trim()) {
    rows.push({
      description: "Structure",
      brand: s.structure,
      capacity: "-",
      quantity: 1,
      warranty: "-",
    });
  }

  return rows;
}

function buildItemsFromQuotation(q) {
  const rows = [];

  if (Number(q.panel_count) > 0) {
    rows.push({
      description: q.product_name || "Solar Panel",
      brand: q.product_brand || "",
      capacity: q.panel_unit || (q.total_watt ? `${q.total_watt} W` : "-"),
      quantity: q.panel_count,
      warranty: q.panel_warranty || "-",
    });
  }

  if (q.inverter_brand || q.inverter_kw) {
    rows.push({
      description: `${q.inverter_brand || "GTI"} Inverter`,
      brand: "",
      capacity: q.inverter_kw || "-",
      quantity: 1,
      warranty: q.inverter_warranty ? `${q.inverter_warranty} Yrs` : "-",
    });
  }

  if (Number(q.battery_count) > 0) {
    rows.push({
      description: q.battery_brand ? `Battery: ${q.battery_brand}` : "Battery",
      brand: "",
      capacity: q.battery_capacity ? `${q.battery_capacity} Ah` : "-",
      quantity: q.battery_count,
      warranty: q.battery_warranty || "-",
    });
  }

  if (q.structure && String(q.structure).trim()) {
    rows.push({
      description: "Structure",
      brand: q.structure,
      capacity: "-",
      quantity: 1,
      warranty: "-",
    });
  }

  return rows;
}

export default ItemDetailsTab;
