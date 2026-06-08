import React from "react";
import { F, S } from "./createCaseConstants";

const CustomerSection = ({ ctx }) => {
  const { f, set } = ctx;

  return (
    <div style={S.card}>
      <div style={S.sh}>
        <div style={S.shNum}>1</div>
        <div>Customer Information</div>
      </div>
      <div style={{ ...S.g2, marginBottom: 14 }}>
        <F label="Customer Name" req>
          <input
            style={S.inp}
            value={f.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            required
          />
        </F>
        <F label="Mobile Number" req>
          <input
            style={S.inp}
            type="tel"
            value={f.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            required
          />
        </F>
      </div>
      <div style={{ ...S.g2, marginBottom: 14 }}>
        <F label="Email ID" req>
          <input
            style={S.inp}
            type="email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </F>
        <F label="Installation Address" req>
          <input
            style={S.inp}
            value={f.address}
            onChange={(e) => set("address", e.target.value)}
            required
          />
        </F>
      </div>
      <div style={{ ...S.g2, marginBottom: 14 }}>
        <F label="PIN Code" req>
          <input
            style={S.inp}
            type="text"
            value={f.pinCode}
            onChange={(e) => set("pinCode", e.target.value)}
            required
          />
        </F>
        <F label="Reference" req>
          <input
            style={S.inp}
            type="text"
            value={f.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="Who referred them?"
            required
          />
        </F>
      </div>
      <div style={S.g2}>
        <F label="Electrical Division" req>
          <input
            style={S.inp}
            value={f.electricalDivision}
            onChange={(e) => set("electricalDivision", e.target.value)}
            required
          />
        </F>
        <F label="Electrical Number" req>
          <input
            style={S.inp}
            value={f.electricalNo}
            onChange={(e) => set("electricalNo", e.target.value)}
            required
          />
        </F>
      </div>
    </div>
  );
};

export default CustomerSection;
