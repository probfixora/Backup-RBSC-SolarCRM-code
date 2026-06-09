import React from "react";
import ManualTypeDropdown from "../ManualTypeDropdown";
import { F, Ctr, S, BATTERY_BRANDS, BATTERY_CAPACITIES, BAT_WARR, STRUCTURE_BRANDS, STRUCTURE_SIZES, WIRE_MAKES, WIRE_SIZES, WIRE_CORE, WIRE_ARMOUR } from "./createCaseConstants";

const SystemComponentsSection = ({ ctx }) => {
  const { f, set, updateBatteryVals, showBat } = ctx;

  return (
    <div style={S.card}>
      <div style={S.sh}>
        <div style={S.shNum}>5</div>
        <div>System Components &amp; Extras</div>
      </div>

      {showBat ? (
        <div style={{ ...S.g2, marginBottom: 14 }}>
          <div>
            <F label="Battery Brand">
              <ManualTypeDropdown
                options={BATTERY_BRANDS}
                value={f.batteryBrand}
                onChange={(v) => updateBatteryVals(v, f.batteryCapacity, Math.max(1, f.batteryQty || 1))}
                placeholder="Select Battery Brand"
                customLabel="Custom Brand"
                style={S.sel}
              />
            </F>
            <div style={{ marginTop: 14 }}>
              <F label="Battery Capacity (Ah)">
                <ManualTypeDropdown
                  options={BATTERY_CAPACITIES}
                  value={f.batteryCapacity}
                  onChange={(v) => updateBatteryVals(f.batteryBrand, v, Math.max(1, f.batteryQty || 1))}
                  placeholder="Select Capacity"
                  customLabel="Custom Capacity"
                  style={S.sel}
                />
              </F>
            </div>
            {f.batteryBrand && f.batteryCapacity && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#eff6ff", borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                  Price per battery:{" "}
                  <strong style={{ color: "#1d4ed8" }}>
                    &#8377;{(f.totalBatPrice / (f.batteryQty || 1) || 0).toLocaleString()}
                  </strong>
                </div>
                <div style={S.info}>Total Capacity: {f.totalBatCapacity} Ah</div>
              </div>
            )}
          </div>
          <div>
            <F label="Number of Batteries">
              <Ctr
                value={f.batteryQty}
                onChange={(qty) => updateBatteryVals(f.batteryBrand, f.batteryCapacity, qty)}
              />
            </F>
            <div style={{ marginTop: 14 }}>
              <F label="Battery Warranty">
                <ManualTypeDropdown
                  options={BAT_WARR}
                  value={f.batteryWarranty}
                  onChange={(v) => set("batteryWarranty", v)}
                  placeholder="Select Warranty"
                  customLabel="Custom Warranty"
                  style={S.sel}
                />
              </F>
            </div>
          </div>
        </div>
      ) : (
        f.subCategory && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 8, color: "#16a34a", fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
            ✅ Battery not required for <strong>{f.subCategory}</strong> systems
          </div>
        )
      )}

      <div style={S.g3}>
        <div>
          <F label="Structure Brand">
            <ManualTypeDropdown
              options={STRUCTURE_BRANDS}
              value={f.structureBrand}
              onChange={(v) => set("structureBrand", v)}
              placeholder="Select Structure Brand"
              customLabel="Custom Brand"
              style={S.sel}
            />
          </F>
          {f.structureBrand && (
            <div style={{ marginTop: 10 }}>
              <F label="Structure Size (mm)">
                <ManualTypeDropdown
                  options={STRUCTURE_SIZES}
                  value={f.structureSize}
                  onChange={(v) => set("structureSize", v)}
                  placeholder="Select Size"
                  customLabel="Custom Size"
                  style={S.sel}
                />
              </F>
            </div>
          )}
        </div>
        <F label="BOS (Balance of System)">
          <input style={S.ro} value={f.bos} readOnly />
        </F>
        <div>
          <F label="Wire Brand">
            <ManualTypeDropdown
              options={WIRE_MAKES}
              value={f.wireMake}
              onChange={(v) => set("wireMake", v)}
              placeholder="Select Brand"
              customLabel="Custom Brand"
              style={S.sel}
            />
          </F>
          <div style={{ marginTop: 10 }}>
            <F label="Wire Size (sq mm)">
              <ManualTypeDropdown
                options={WIRE_SIZES}
                value={f.wireSize}
                onChange={(v) => set("wireSize", v)}
                placeholder="Select Size"
                customLabel="Custom Size"
                style={S.sel}
              />
            </F>
          </div>
          <div style={{ marginTop: 10 }}>
            <F label="Wire Material">
              <select
                style={S.sel}
                value={f.wire_core_material}
                onChange={(e) => set("wire_core_material", e.target.value)}
              >
                <option value="">Select Material</option>
                {WIRE_CORE.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </F>
          </div>
          <div style={{ marginTop: 10 }}>
            <F label="Armored / Unarmored">
              <select
                style={S.sel}
                value={f.wire_armouring}
                onChange={(e) => set("wire_armouring", e.target.value)}
              >
                <option value="">Select Option</option>
                {WIRE_ARMOUR.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </F>
          </div>
        </div>
      </div>

      <div style={{ ...S.g2, marginTop: 14 }}>
        <F label="Earthing">
          <input
            style={S.inp}
            type="number"
            value={f.earthing}
            onChange={(e) => set("earthing", Number(e.target.value))}
            placeholder="e.g. 2"
          />
        </F>
        <F label="Installation &amp; Net Metering">
          <input style={S.ro} value={f.installation} readOnly />
        </F>
      </div>
    </div>
  );
};

export default SystemComponentsSection;
