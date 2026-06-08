import React from "react";
import { CheckCircle, UploadCloud } from "lucide-react";
import { S } from "./createCaseConstants";

const DocumentUploadSection = ({ ctx }) => {
  const {
    docs,
    occupation,
    setOccupation,
    handleFileChange,
    getSystemKw,
    MANDATORY_DOCS,
    getOptionalDocuments,
  } = ctx;

  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "22px 24px",
          borderBottom: "1px solid var(--border-2)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div style={{ ...S.sh, borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
          <div style={S.shNum}>7</div>
          <div>Document Upload Gate</div>
        </div>
      </div>

      <div style={{ padding: "22px 24px" }}>
        {/* ── Profile Selection ──────────────────────────────────────────── */}
        <div
          style={{
            marginBottom: "24px",
            background: "var(--color-info-light)",
            border: "1px solid #BFDBFE",
            borderRadius: "var(--radius-xl)",
            padding: "16px",
            display: "flex",
            gap: "12px",
          }}
        >
          <div style={{ marginTop: "2px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "var(--surface)",
                borderRadius: "50%",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "var(--color-info)", fontWeight: 800, fontSize: "14px" }}>1</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#1E3A8A", marginBottom: "4px" }}>
              Customer Profile
            </label>

            {/* 1–3 kW: No profile needed */}
            {getSystemKw() > 0 && getSystemKw() < 4 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", marginTop: "4px" }}>
                <span style={{ fontSize: "18px" }}>✅</span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>No Profile Required</p>
                  <p style={{ fontSize: "12px", color: "#4ade80" }}>
                    {getSystemKw()} kW — Only 6 basic documents needed (no profile docs)
                  </p>
                </div>
              </div>
            )}

            {/* 4 kW+: Show profile selection */}
            {getSystemKw() >= 4 && (
              <>
                <p style={{ fontSize: "12px", color: "#1D4ED8", opacity: 0.8, marginBottom: "12px" }}>
                  {getSystemKw()} kW — Profile documents required. Select the customer's occupation:
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                  {[
                    { key: "Job/Service", label: "💼 Job / Service" },
                    { key: "Business", label: "🏢 Business" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOccupation(key)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: `2px solid ${occupation === key ? "var(--color-accent)" : "#BFDBFE"}`,
                        background: occupation === key ? "var(--color-accent)" : "var(--surface)",
                        color: occupation === key ? "#fff" : "#1E3A8A",
                        fontWeight: 700,
                        fontSize: "13px",
                        transition: "all 0.2s",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* No kW selected yet */}
            {getSystemKw() === 0 && (
              <p style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginTop: "6px" }}>
                Select the Electrical Load above to determine profile requirements.
              </p>
            )}
          </div>
        </div>

        {/* ── Documents Checklist Header ────────────────────────────────── */}
        <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-1)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Documents Checklist
          </h3>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-4)" }}>
            {MANDATORY_DOCS.filter((d) => docs[d]).length} / {MANDATORY_DOCS.length} Ready
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ── Mandatory Documents ──────────────────────────────────────── */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--rose)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
              Mandatory Documents{" "}
              <span style={{ fontSize: "10px", background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px" }}>
                Required
              </span>
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {MANDATORY_DOCS.map((docName, idx) => {
                const isSelected = !!docs[docName];
                return (
                  <div
                    key={`man-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "var(--radius-xl)",
                      border: `1px solid ${isSelected ? "#A7F3D0" : "#fca5a5"}`,
                      background: isSelected ? "var(--color-accent-light)" : "#fef2f2",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isSelected ? "var(--color-accent)" : "#fee2e2",
                            color: isSelected ? "#fff" : "#ef4444",
                            boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                          }}
                        >
                          {isSelected ? (
                            <CheckCircle style={{ width: "20px", height: "20px" }} />
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: "12px" }}>{idx + 1}</span>
                          )}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#064E3B" : "#7f1d1d" }}>
                          {docName} <span style={{ color: "#ef4444" }}>*</span>
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {isSelected ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent)", maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={docs[docName].name}>
                              {docs[docName].name}
                            </span>
                            <label style={{ cursor: "pointer", padding: "6px 12px", background: "var(--surface)", border: "1px solid #A7F3D0", color: "var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700 }}>
                              Replace
                              <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" />
                            </label>
                          </div>
                        ) : (
                          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", color: "#fff", background: "#ef4444", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700, boxShadow: "var(--shadow-sm)" }}>
                            <UploadCloud style={{ width: "16px", height: "16px" }} />
                            Choose File
                            <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Optional Documents ────────────────────────────────────────── */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginTop: "24px", display: "flex", alignItems: "center", gap: "4px" }}>
              Additional Documents{" "}
              <span style={{ fontSize: "10px", background: "var(--surface-2)", color: "var(--text-4)", padding: "2px 6px", borderRadius: "4px" }}>
                Optional
              </span>
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {getOptionalDocuments().map((docName, idx) => {
                const isSelected = !!docs[docName];
                return (
                  <div
                    key={`opt-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "var(--radius-xl)",
                      border: `1px solid ${isSelected ? "#A7F3D0" : "var(--border)"}`,
                      background: isSelected ? "var(--color-accent-light)" : "var(--surface)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "var(--color-accent)" : "var(--surface-2)", color: isSelected ? "#fff" : "var(--text-4)", boxShadow: isSelected ? "var(--shadow-sm)" : "none" }}>
                          {isSelected ? (
                            <CheckCircle style={{ width: "20px", height: "20px" }} />
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: "12px" }}>+</span>
                          )}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#064E3B" : "var(--text-2)" }}>
                          {docName}
                        </span>
                      </div>
                      <div>
                        {isSelected ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent)", maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={docs[docName].name}>
                              {docs[docName].name}
                            </span>
                            <label style={{ cursor: "pointer", padding: "6px 12px", background: "var(--surface)", border: "1px solid #A7F3D0", color: "var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700 }}>
                              Replace
                              <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" />
                            </label>
                          </div>
                        ) : (
                          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "var(--text-1)", color: "#fff", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700, boxShadow: "var(--shadow-sm)" }}>
                            <UploadCloud style={{ width: "16px", height: "16px" }} />
                            Choose File
                            <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
