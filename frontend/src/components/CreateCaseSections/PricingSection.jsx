import React from "react";
import { F, S } from "./createCaseConstants";

const PricingSection = ({ ctx }) => {
  const { f, set, priceOk } = ctx;

  return (
    <div style={S.card}>
      <div style={S.sh}>
        <div style={S.shNum}>6</div>
        <div>Pricing</div>
      </div>
      <div style={{ ...S.g2, marginBottom: 14 }}>
        <F label="Final Price Quote (₹)" req>
          <input
            style={{ ...S.inp, fontSize: 17, fontWeight: 700, color: "#16a34a" }}
            type="number"
            min="0"
            placeholder="Enter final price"
            value={f.productPrice}
            onChange={(e) => set("productPrice", e.target.value)}
            required
          />
        </F>
        <F label="Re-check Price (₹)" req>
          <input
            style={{
              ...S.inp,
              fontSize: 17,
              fontWeight: 700,
              borderColor: f.recheckPrice
                ? priceOk ? "#16a34a" : "#ef4444"
                : "#d1d5db",
              color: f.recheckPrice
                ? priceOk ? "#16a34a" : "#ef4444"
                : "#111",
            }}
            type="number"
            min="0"
            placeholder="Re-enter to verify"
            value={f.recheckPrice}
            onChange={(e) => set("recheckPrice", e.target.value)}
            required
          />
          {f.recheckPrice && (
            <p style={{ fontSize: 12, marginTop: 3, color: priceOk ? "#16a34a" : "#ef4444" }}>
              {priceOk ? "✓ Match" : "⚠ No match"}
            </p>
          )}
        </F>
      </div>
    </div>
  );
};

export default PricingSection;
