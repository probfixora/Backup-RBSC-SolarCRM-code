import React from "react";

const TermsOfService = () => {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>Terms of Service</h1>
      <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: "16px" }}>
        Welcome to RBSC Solar CRM. These Terms of Service govern your use of our platform and services.
      </p>
      
      <h2 style={{ fontSize: "20px", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
      <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: "16px" }}>
        By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
      </p>

      <h2 style={{ fontSize: "20px", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>2. Use License</h2>
      <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: "16px" }}>
        Permission is granted to temporarily use the materials on RBSC Solar's website for personal, non-commercial transitory viewing only.
      </p>

      <h2 style={{ fontSize: "20px", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>3. Data Privacy</h2>
      <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: "16px" }}>
        Your use of the service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding your personal data.
      </p>

      <h2 style={{ fontSize: "20px", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>4. Employee Responsibilities</h2>
      <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: "16px" }}>
        As an employee using this CRM, you agree to maintain the confidentiality of all customer data and company information accessed through this platform. Unauthorized sharing of information is strictly prohibited.
      </p>

      <p style={{ color: "#9ca3af", marginTop: "40px", fontSize: "14px" }}>
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
};

export default TermsOfService;
