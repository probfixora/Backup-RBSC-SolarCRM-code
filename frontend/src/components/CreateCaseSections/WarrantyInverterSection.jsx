import React from "react";
import ManualTypeDropdown from "../ManualTypeDropdown";
import { F, S, KW500, PANEL_WARR, getGTI } from "./createCaseConstants";

const WarrantyInverterSection = ({ ctx }) => {
  const { f, set, onInverterKw } = ctx;

  return (
    <div style={S.card}>
      <div style={S.sh}>
        <div style={S.shNum}>4</div>
        <div>Warranty &amp; Inverter</div>
      </div>
      <div style={S.g2}>
        <F label="Panel Warranty">
          <ManualTypeDropdown
            options={PANEL_WARR}
            value={f.panelWarranty}
            onChange={(v) => set("panelWarranty", v)}
            placeholder="Select Warranty"
            customLabel="Custom Warranty"
            style={S.sel}
          />
        </F>
        <F label="GTI Inverter" req>
          <ManualTypeDropdown
            options={getGTI(f.panelBrand)}
            value={f.gtiInverter}
            onChange={(v) => set("gtiInverter", v)}
            placeholder="Select GTI Inverter"
            customLabel="Custom GTI Inverter"
            required
            style={S.sel}
          />
        </F>
        <F label="Inverter kW" req>
          <ManualTypeDropdown
            options={KW500}
            value={f.inverterKw}
            onChange={onInverterKw}
            placeholder="Select kW"
            customLabel="Custom Inverter kW"
            required
            style={S.sel}
          />
        </F>
        <div>
          <F label="Inverter Price (₹)">
            <input
              style={S.inp}
              type="number"
              value={f.inverterPrice}
              onChange={(e) => set("inverterPrice", Number(e.target.value))}
              placeholder="Estimated Price"
            />
          </F>
          <div style={{ ...S.info, marginTop: 8 }}>
            Total Inverter Price: ₹{(f.inverterPrice || 0).toLocaleString()}
          </div>
        </div>
        <F label="Inverter Warranty (Years)">
          <input
            style={S.inp}
            type="number"
            min="0"
            value={f.inverterWarranty}
            onChange={(e) => set("inverterWarranty", e.target.value)}
            placeholder="e.g. 5"
          />
        </F>
      </div>
    </div>
  );
};

export default WarrantyInverterSection;
