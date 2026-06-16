/**
 * SkeletonComponents.jsx
 * Reusable skeleton loading components for RBSC Solar CRM.
 * All skeletons use the .skeleton CSS class (shimmer animation defined in index.css).
 *
 * Usage:
 *   import { SkeletonTableRows, SkeletonCard, SkeletonPageLayout } from "./SkeletonComponents";
 */
import React from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   PRIMITIVE ATOMS
───────────────────────────────────────────────────────────────────────────── */

/** A single shimmer line. width/height are inline style values (e.g. "60%", "14px"). */
export const SkeletonLine = ({ width = "100%", height = "14px", style = {} }) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius: "var(--radius-xs)", ...style }}
  />
);

/** A rectangular block — used for avatars, icons, chart placeholders. */
export const SkeletonBlock = ({ width = "100%", height = "40px", radius = "var(--radius-sm)", style = {} }) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
  />
);

/* ─────────────────────────────────────────────────────────────────────────────
   KPI CARD SKELETON
   Matches the DashboardCards layout: icon + number + label
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonCard = ({ style = {} }) => (
  <div
    style={{
      flex: "1 1 160px",
      minWidth: "140px",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxShadow: "var(--shadow-card)",
      ...style,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <SkeletonLine width="55%" height="12px" />
        <SkeletonLine width="40%" height="28px" />
      </div>
      <SkeletonBlock width="38px" height="38px" radius="var(--radius-md)" />
    </div>
    <SkeletonLine width="70%" height="11px" />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   TABLE ROW SKELETONS
   Matches CaseTable / UserTable layout with varying column widths
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonTableRows = ({ rows = 8, columns = 5 }) => {
  const colWidths = [
    ["80px", "100px", "120px", "90px", "70px", "60px"],  // col 0
    ["120px", "140px", "100px"],                          // col 1
    ["90px", "80px", "70px"],                             // col 2
    ["70px", "80px", "60px"],                             // col 3
    ["60px"],                                             // col 4
  ];

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "0",
          padding: "11px 20px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={i} width="55%" height="10px" />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "0",
            padding: "16px 20px",
            borderBottom: rowIdx < rows - 1 ? "1px solid var(--color-border-2)" : "none",
            alignItems: "center",
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => {
            const widths = colWidths[colIdx] || ["80px"];
            const w = widths[rowIdx % widths.length];
            return (
              <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <SkeletonLine width={w} height="13px" />
                {colIdx === 1 && <SkeletonLine width="60%" height="10px" />}
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          padding: "10px 20px",
          background: "var(--surface-2)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <SkeletonLine width="80px" height="10px" />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   USER TABLE SKELETONS
   Matches the compact user management table (name, email, role, actions)
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonUserRows = ({ rows = 6 }) => (
  <div
    style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-card)",
    }}
  >
    {/* Header */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 2fr 1fr 1fr",
        padding: "11px 20px",
        background: "var(--surface-2)",
        borderBottom: "1px solid var(--color-border)",
        gap: "16px",
      }}
    >
      {["Name", "Email", "Role", "Actions"].map((_, i) => (
        <SkeletonLine key={i} width={i === 3 ? "50px" : "60%"} height="10px" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1fr 1fr",
          padding: "14px 20px",
          borderBottom: i < rows - 1 ? "1px solid var(--color-border-2)" : "none",
          gap: "16px",
          alignItems: "center",
        }}
      >
        {/* Name with avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SkeletonBlock width="32px" height="32px" radius="50%" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
            <SkeletonLine width="70%" height="13px" />
            <SkeletonLine width="50%" height="10px" />
          </div>
        </div>
        {/* Email */}
        <SkeletonLine width="75%" height="13px" />
        {/* Role badge */}
        <SkeletonBlock width="70px" height="22px" radius="var(--radius-pill)" />
        {/* Action buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          <SkeletonBlock width="28px" height="28px" radius="var(--radius-sm)" />
          <SkeletonBlock width="28px" height="28px" radius="var(--radius-sm)" />
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   FULL PAGE LAYOUT SKELETON
   Mirrors the standard layout: Sidebar (desktop) + main content area
   Sidebar is NOT faked — the real Sidebar renders instantly from localStorage.
   This skeleton fills the main content area only.
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonMainContent = ({ showCards = true, showTabs = true, rows = 7 }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      animation: "fadeIn 0.2s ease both",
    }}
  >
    {/* Header area */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonLine width="200px" height="22px" />
        <SkeletonLine width="280px" height="13px" />
      </div>
      <SkeletonBlock width="120px" height="36px" radius="var(--radius-md)" />
    </div>

    {/* KPI Cards row */}
    {showCards && (
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )}

    {/* Tab pills row */}
    {showTabs && (
      <div style={{ display: "flex", gap: "8px" }}>
        {[80, 100, 90, 110].map((w, i) => (
          <SkeletonBlock key={i} width={`${w}px`} height="34px" radius="var(--radius-pill)" />
        ))}
      </div>
    )}

    {/* Content table */}
    <SkeletonTableRows rows={rows} columns={5} />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   CASES PAGE SKELETON
   Specifically matches Cases.jsx: search bar + filter button + tab strip + table
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonCasesPage = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.2s ease both" }}>
    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonLine width="160px" height="22px" />
        <SkeletonLine width="300px" height="13px" />
      </div>
    </div>

    {/* Controls row: search + filter + export */}
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <SkeletonBlock width="340px" height="38px" radius="var(--radius-md)" />
      <SkeletonBlock width="90px" height="38px" radius="var(--radius-md)" />
      <SkeletonBlock width="100px" height="38px" radius="var(--radius-md)" />
    </div>

    {/* Tab strip */}
    <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--color-border)", paddingBottom: "0" }}>
      {[120, 130, 110, 100, 120].map((w, i) => (
        <SkeletonBlock key={i} width={`${w}px`} height="36px" radius="0" style={{ marginRight: "4px" }} />
      ))}
    </div>

    {/* Table */}
    <SkeletonTableRows rows={8} columns={5} />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   USERS PAGE SKELETON
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonUsersPage = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.2s ease both" }}>
    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonLine width="120px" height="22px" />
        <SkeletonLine width="280px" height="13px" />
      </div>
    </div>

    {/* Toolbar */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
      <SkeletonBlock width="320px" height="38px" radius="var(--radius-md)" />
      <div style={{ display: "flex", gap: "8px" }}>
        <SkeletonBlock width="120px" height="36px" radius="var(--radius-md)" />
        <SkeletonBlock width="120px" height="36px" radius="var(--radius-md)" />
      </div>
    </div>

    {/* User table */}
    <SkeletonUserRows rows={7} />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   PROFILE PAGE SKELETON
   Mirrors Profile.jsx layout: left nav panel + right content panel
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonProfilePage = () => (
  <div style={{ display: "flex", flex: 1, overflow: "hidden", animation: "fadeIn 0.2s ease both" }}>
    {/* Left nav panel */}
    <div
      style={{
        width: "260px",
        flexShrink: 0,
        borderRight: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <SkeletonBlock width="80px" height="80px" radius="50%" />
        <SkeletonLine width="120px" height="15px" />
        <SkeletonLine width="160px" height="12px" />
        <SkeletonBlock width="70px" height="22px" radius="var(--radius-xs)" />
      </div>
      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <SkeletonLine width="40px" height="10px" style={{ marginBottom: "4px" }} />
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} width="100%" height="38px" radius="var(--radius-sm)" />
        ))}
      </div>
    </div>

    {/* Right content panel */}
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "40px",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "var(--color-surface)",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <SkeletonLine width="200px" height="18px" style={{ margin: "0 auto" }} />
        {/* Form grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <SkeletonLine width="80px" height="11px" />
              <SkeletonBlock width="100%" height="38px" radius="var(--radius-xs)" />
            </div>
          ))}
        </div>
        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SkeletonBlock width="130px" height="42px" radius="var(--radius-md)" />
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION SKELETON
   Used inside the Header notification popover while data loads
───────────────────────────────────────────────────────────────────────────── */
export const SkeletonNotifications = ({ count = 4 }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          gap: "12px",
          padding: "12px 20px",
          borderBottom: i < count - 1 ? "1px solid var(--color-border-2)" : "none",
          alignItems: "flex-start",
        }}
      >
        <SkeletonBlock width="32px" height="32px" radius="var(--radius-sm)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <SkeletonLine width="140px" height="13px" />
            <SkeletonLine width="40px" height="11px" />
          </div>
          <SkeletonLine width="100px" height="12px" />
          <SkeletonLine width="160px" height="11px" />
        </div>
      </div>
    ))}
  </div>
);
