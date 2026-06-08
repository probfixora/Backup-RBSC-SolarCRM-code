import React from "react";
import ManualTypeDropdown from "../ManualTypeDropdown";
import { F, S, KW500, PRODUCT_CATEGORIES, SUB_CATEGORIES } from "./createCaseConstants";

const TechnicalSpecsSection = ({ ctx }) => {
  const { f, set, onProdCat, onSubCat } = ctx;

  return (
    <div style={S.card}>
      <div style={S.sh}>
        <div style={S.shNum}>2</div>
        <div>Technical Specifications</div>
      </div>
      <div style={S.g2}>
        <F label="Electrical Load" req>
          <ManualTypeDropdown
            options={KW500}
            value={f.electricalLoad}
            onChange={(v) => set("electricalLoad", v)}
            placeholder="Select Load"
            customLabel="Custom Load"
            required
            style={S.sel}
          />
        </F>
        <F label="Product Category" req>
          <select
            style={S.sel}
            value={f.productCategory}
            onChange={(e) => onProdCat(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </F>
        <F label="Sub Category" req>
          <select
            style={S.sel}
            value={f.subCategory}
            onChange={(e) => onSubCat(e.target.value)}
            required
          >
            <option value="">Select Sub Category</option>
            {SUB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </F>
      </div>
    </div>
  );
};

export default TechnicalSpecsSection;
