import React from "react";
import { X } from "lucide-react";
import { APP_CONFIG } from "../config";

const CustomerTermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            Terms & Conditions for Data Storage
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              borderRadius: "8px",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            color: "#475569",
            fontSize: "14px",
            lineHeight: "1.7",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <p style={{ marginBottom: "16px" }}>
            Welcome to {APP_CONFIG.companyName}. By uploading your documents and proceeding with our services, you acknowledge and agree to the following Terms and Conditions regarding the collection, storage, and processing of your personal and sensitive data.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            1. Data Collection and Purpose
          </h3>
          <p style={{ marginBottom: "16px" }}>
            We collect personal documents (such as Aadhar Card, PAN Card, electricity bills, and property tax receipts) solely for the purpose of processing your solar installation application, applying for government subsidies (if applicable), and verifying your identity as required by relevant authorities.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            2. Third-Party Infrastructure (Backend as a Service)
          </h3>
          <p style={{ marginBottom: "16px" }}>
            In order to provide highly available and scalable services, {APP_CONFIG.companyName} utilizes third-party Backend-as-a-Service (BaaS) infrastructure. Specifically, your data and uploaded documents are stored using <strong>Supabase</strong>, which is hosted on <strong>Amazon Web Services (AWS)</strong> cloud servers.
          </p>
          <p style={{ marginBottom: "16px" }}>
            AWS and Supabase employ industry-standard security measures, encryption, and compliance frameworks to protect the data stored on their servers.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            3. Limitation of Liability for Third-Party Data Breaches
          </h3>
          <p style={{ marginBottom: "16px", background: "#fff1f2", padding: "12px", borderLeft: "4px solid #e11d48", borderRadius: "0 8px 8px 0", color: "#9f1239", fontWeight: "500" }}>
            While {APP_CONFIG.companyName} implements strict access controls and application-level security, we do not own or maintain the physical servers where your data is stored. <strong>Therefore, {APP_CONFIG.companyName} shall not be held liable or legally responsible for any data loss, data leaks, unauthorized access, or breaches that occur directly as a result of vulnerabilities, hacks, or failures on the infrastructure provided by Supabase or Amazon Web Services (AWS).</strong>
          </p>
          <p style={{ marginBottom: "16px" }}>
            By checking the agreement box and uploading your documents, you explicitly acknowledge this limitation of liability and consent to your data being stored on these third-party cloud platforms under their respective security policies.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            4. Data Retention and Deletion
          </h3>
          <p style={{ marginBottom: "16px" }}>
            Your documents will be retained on our secure cloud storage for as long as necessary to fulfill the purposes outlined in these terms, including the lifecycle of your solar installation and subsequent maintenance or warranty periods. You reserve the right to request the deletion of your documents by contacting our support team, subject to any legal or regulatory retention requirements.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            5. Confidentiality and Access
          </h3>
          <p style={{ marginBottom: "16px" }}>
            Only authorized personnel from the Registration and Installation departments of {APP_CONFIG.companyName} have access to your uploaded documents. We do not sell, rent, or unauthorizedly share your personal data with external marketing agencies or unrelated third parties.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            6. Governing Law
          </h3>
          <p style={{ marginBottom: "16px" }}>
            These terms shall be governed and construed in accordance with the laws of India. Any disputes arising out of these terms related to data storage shall be subject to the exclusive jurisdiction of the courts in our operating region.
          </p>
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerTermsModal;
