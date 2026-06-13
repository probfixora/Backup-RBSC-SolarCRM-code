import React from "react";
import { Navigate } from "react-router-dom";

// Centralized role → dashboard path mapping (matches Login.jsx routes)
const ROLE_DASHBOARD_MAP = {
  admin: "/admin-dashboard",
  sales: "/sales-dashboard",
  registration: "/registration-dashboard",
  banking: "/banking-dashboard",
  inventory: "/inventory-dashboard",
  field_installation: "/installation-dashboard",
  electrical: "/electrical-dashboard",
  subsidy: "/subsidy-dashboard",
  technical: "/technical-dashboard",
  accounts: "/accounts-dashboard",
  customer_service: "/customer-service-dashboard",
};

export const getDashboardPath = (role) =>
  ROLE_DASHBOARD_MAP[role?.toLowerCase()] || "/admin-dashboard";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const currentRole = (localStorage.getItem("role") || "").toLowerCase();

  // No token = not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role restriction: redirect unauthorized users to their own dashboard
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(currentRole) && currentRole !== "admin") {
      const dashboardPath = getDashboardPath(currentRole);
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
