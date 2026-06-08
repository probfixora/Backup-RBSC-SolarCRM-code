import React from "react";
import ManualTypeDropdown from "../ManualTypeDropdown";
import { F, Ctr, S, BRANDS, KW500 } from "./createCaseConstants";

const PanelAndBrandSection = ({ ctx }) => {
  const { f, set, onBrand, onPanelUnit, onPanelCount } = ctx;

  return (
    <div style={S.card}>
      <div style={S.sh}>
        <div style={S.shNum}>3</div>
        <div>Panel &amp; Brand Details</div>
      </div>
      <div style={{ ...S.g2, marginBottom: 14 }}>
        <F label="Panel Brand" req>
          <ManualTypeDropdown
            options={BRANDS}
            value={f.panelBrand}
            onChange={(v) => onBrand(v)}
            placeholder="Select Brand"
            customLabel="Custom Brand"
            required
            style={S.sel}
          />
        </F>
        <F label="Product Name">
          <input
            style={S.ro}
            value={f.productName}
            readOnly
            placeholder="Auto-filled from brand + category"
          />
        </F>
      </div>
      <div style={S.g2}>
        <F label="Panel Unit (kW)" req>
          <ManualTypeDropdown
            options={KW500}
            value={f.panelUnit}
            onChange={(v) => onPanelUnit(v)}
            placeholder="Select Panel Unit"
            customLabel="Custom Panel Unit"
            required
            style={S.sel}
          />
        </F>
        <div>
          <F label="Number of Panels">
            <Ctr value={f.panelCount} onChange={onPanelCount} />
          </F>
          <div style={{ marginTop: 14 }}>
            <F label="Total Wattage">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  style={{ ...S.inp, flex: 1 }}
                  type="number"
                  value={f.totalWatt}
                  onChange={(e) => set("totalWatt", Number(e.target.value))}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-3)" }}>W</span>
              </div>
            </F>
          </div>
          <div style={S.info}>Total Panel Price: ₹{f.totalPrice.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default PanelAndBrandSection;
