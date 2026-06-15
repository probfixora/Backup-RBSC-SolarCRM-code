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
          <h1 style={{ fontSize: "18px", color: "#0f172a", fontWeight: "800", marginBottom: "8px", textTransform: "uppercase" }}>
            Terms and Conditions for Data Processing and Services
          </h1>
          <p style={{ marginBottom: "16px", fontSize: "12px", color: "#64748b" }}>
            <strong>Effective Date:</strong> June 16, 2026<br/>
            <strong>Published By:</strong> RBSC Solar (hereinafter referred to as "the Company")
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            1. PREAMBLE AND ACCEPTANCE OF TERMS
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>1.1 Binding Agreement</h4>
          <p style={{ marginBottom: "16px" }}>
            Welcome to RBSC Solar. This document constitutes a legally binding agreement between you (the "User", "Customer", or "Data Subject") and RBSC Solar ("Company", "We", "Us", or "Our"). By accessing our platform, uploading documents, registering an account, or proceeding with any of our solar installation services, you explicitly acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.
          </p>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>1.2 Consent to Data Processing</h4>
          <p style={{ marginBottom: "16px" }}>
            By executing the digital checkbox, uploading files, or submitting information to our portal, you provide your explicit, unequivocal, and informed consent to the collection, storage, hosting, transmission, and processing of your personal and sensitive data as outlined herein. If you do not agree to these terms, you must immediately cease using our services and refrain from uploading any personal documentation.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            2. SCOPE OF DATA COLLECTION AND SPECIFIC PURPOSES
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>2.1 Types of Information Collected</h4>
          <p style={{ marginBottom: "8px" }}>To facilitate the assessment, design, approval, and execution of residential or commercial solar infrastructure, the Company must collect various categories of information, which may include but are not limited to:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li><strong>Identity Proof:</strong> Government-issued identification documents including PAN Card, Passport, Driver’s License, or identity card details (e.g., Aadhaar) for verification purposes.</li>
            <li><strong>Utility & Financial Data:</strong> Recent electricity bills, consumer account numbers, load history, and property tax receipts.</li>
            <li><strong>Property Information:</strong> Site layout, roof ownership documentation, geolocation data, and structural photographs.</li>
            <li><strong>Contact Information:</strong> Full legal name, permanent address, installation address, email ID, and mobile numbers.</li>
          </ul>

          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>2.2 Lawful Purpose of Collection</h4>
          <p style={{ marginBottom: "8px" }}>All data collected under this Section is strictly utilized for executing contractual obligations and statutory requirements. The primary purposes include:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Verifying the legal ownership of the property where the solar installation is proposed.</li>
            <li>Assessing structural and electrical feasibility based on past energy consumption patterns.</li>
            <li>Processing and submitting applications for Central or State Government subsidies, net-metering schemes, and grid-connectivity approvals on behalf of the customer.</li>
            <li>Complying with Know Your Customer (KYC) guidelines mandated by electricity distribution companies (DISCOMs) and financial institutions.</li>
          </ul>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            3. THIRD-PARTY BACKEND-AS-A-SERVICE (BaaS) INFRASTRUCTURE
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>3.1 Use of Cloud Infrastructure</h4>
          <p style={{ marginBottom: "16px" }}>
            To ensure enterprise-grade availability, high scalability, and seamless performance, RBSC Solar does not maintain local physical servers. Instead, the Company utilizes third-party Backend-as-a-Service (BaaS) and Infrastructure-as-a-Service (IaaS) providers.
          </p>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>3.2 Specific Service Providers</h4>
          <p style={{ marginBottom: "8px" }}>Your data, including scanned copies of sensitive identity proofs, financial documents, and application records, are securely stored and processed via:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li><strong>Supabase Inc.:</strong> Actively acting as our database management system and application backend layer.</li>
            <li><strong>Amazon Web Services (AWS):</strong> Acting as the primary cloud hosting environment where Supabase databases and storage buckets reside.</li>
          </ul>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>3.3 Industry-Standard Security Standards</h4>
          <p style={{ marginBottom: "16px" }}>
            The third-party providers (AWS and Supabase) utilize industry-leading security architectures, including but not limited to Advanced Encryption Standard (AES-256) for data-at-rest, Transport Layer Security (TLS 1.3) for data-in-transit, SOC 2 Type II certifications, and robust firewall configurations designed to prevent unauthorized physical or digital intrusion.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            4. STRICT LIMITATION OF LIABILITY FOR THIRD-PARTY DATA BREACHES
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>4.1 Independent Infrastructure Acknowledgment</h4>
          <p style={{ marginBottom: "16px" }}>
            The Customer explicitly acknowledges that RBSC Solar exercises no direct operational control over the physical servers, hardware architecture, network routing, or data-center security protocols maintained by Supabase or Amazon Web Services (AWS).
          </p>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>4.2 Indemnification and Exclusion of Liability</h4>
          <div style={{ marginBottom: "16px", background: "#fff1f2", padding: "14px", borderLeft: "4px solid #e11d48", borderRadius: "0 8px 8px 0" }}>
            <p style={{ marginBottom: "8px", color: "#9f1239", fontWeight: "500" }}>
              <strong>No Absolute Guarantee:</strong> While RBSC Solar implements strict application-level security, role-based access tokens, and secure API handshakes, no digital system is entirely immune to malicious cyber-attacks.
            </p>
            <p style={{ marginBottom: "8px", color: "#9f1239", fontWeight: "500" }}>
              <strong>Exclusion Clause:</strong> RBSC Solar, its directors, employees, partners, and stakeholders shall not be held liable, legally responsible, or financially accountable under tort, contract, or strict liability for any data loss, accidental leaks, systemic hacks, zero-day vulnerabilities, ransomware attacks, or unauthorized third-party access that occurs due to a failure, exploit, or breach originating directly within the infrastructure or networks of Supabase, AWS, or related third-party telecommunication providers.
            </p>
            <p style={{ color: "#9f1239", fontWeight: "500" }}>
              <strong>Assumption of Risk:</strong> By agreeing to these terms, the Customer voluntarily assumes all inherent risks associated with storing sensitive files on global cloud platforms and agrees not to initiate any class-action lawsuits, claims, or arbitration against RBSC Solar for infrastructure-level data compromises.
            </p>
          </div>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            5. ROBUST DATA RETENTION, ARCHIVING, AND DELETION POLICIES
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>5.1 Retention Period</h4>
          <p style={{ marginBottom: "8px" }}>The Company retains personal data only for the duration required to satisfy the operational lifecycle of the project. This includes:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>The active installation, structural engineering, and grid-testing phase.</li>
            <li>The statutory duration required to secure government-backed fiscal incentives or solar subsidies.</li>
            <li>The duration of the operational warranty, maintenance agreements, or product performance guarantee cycles (which can span several years).</li>
          </ul>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>5.2 Right to Erasure / Deletion</h4>
          <p style={{ marginBottom: "16px" }}>
            Customers have the right to request the permanent deletion of their personal records from our databases.<br/>
            <strong>Procedure:</strong> You may submit a formal deletion request via email to our dedicated data privacy desk at support@rbscsolar.com.<br/>
            <strong>Legal Exceptions:</strong> Upon receiving a verified request, the Company will initiate data erasure protocols within thirty (30) business days. However, the Company reserves the right to retain specific files or metadata if such documentation is strictly mandated by Indian tax laws, regulatory bodies, ongoing judicial disputes, or active contractual warranties that cannot be serviced without data visibility.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            6. DATA CONFIDENTIALITY, ACCESS CONTROL, AND RESTRICTION ON SHARING
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>6.1 Internal Access Restriction (Role-Based Access Control)</h4>
          <p style={{ marginBottom: "8px" }}>
            RBSC Solar operates on a strict principle of least privilege ("Need-to-Know" basis). Access to your uploaded documents is restricted using secure, authenticated internal dashboards. Only verified personnel from the following specific departments are granted operational clearance:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li><strong>Registration & Documentation Department:</strong> For verification and processing of legal paperwork.</li>
            <li><strong>Engineering & Installation Department:</strong> For evaluating physical electrical capacity and structural feasibility.</li>
          </ul>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>6.2 Zero Commercial Sharing Policy</h4>
          <p style={{ marginBottom: "16px" }}>
            The Company strictly guarantees that your personal identifiable information (PII) is treated as highly confidential. RBSC Solar does not sell, trade, lease, rent, or unauthorizedly disclose your data, contact numbers, or documents to external marketing agencies, programmatic advertising networks, or any unrelated third-party entities for commercial gain.
          </p>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>6.3 Authorized Disclosures</h4>
          <p style={{ marginBottom: "16px" }}>
            Data sharing is permitted exclusively to authorized public entities (such as State Electricity Boards, DISCOMs, and Ministry of New and Renewable Energy officials) solely for securing net-metering connections and processing standard subsidy applications.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            7. GOVERNING LAW, DISPUTE RESOLUTION, AND JURISDICTION
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>7.1 Governing Law</h4>
          <p style={{ marginBottom: "16px" }}>
            These Terms and Conditions, along with the entire data privacy framework of RBSC Solar, shall be governed, interpreted, and construed strictly in accordance with the substantive laws of the Republic of India, including the Information Technology Act, 2000, and any subsequent digital personal data protection enactments.
          </p>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>7.2 Amicable Settlement</h4>
          <p style={{ marginBottom: "16px" }}>
            In the event of any dispute, claim, controversy, or grievance arising out of or relating to these terms, data storage protocols, or service delivery, both parties shall first attempt to resolve the matter amicably through good-faith mutual consultations lasting at least thirty (30) business days from the date of written notice.
          </p>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>7.3 Exclusive Jurisdiction</h4>
          <p style={{ marginBottom: "16px" }}>
            If an amicable settlement cannot be achieved, all legal proceedings, litigations, or arbitrations connected directly or indirectly with these terms shall be subject to the exclusive jurisdiction of the competent courts located within the city/operating region of the registered headquarters of RBSC Solar.
          </p>

          <h3 style={{ fontSize: "16px", color: "#0f172a", fontWeight: "700", marginTop: "24px", marginBottom: "12px" }}>
            8. MISCELLANEOUS PROVISIONS
          </h3>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>8.1 Severability</h4>
          <p style={{ marginBottom: "16px" }}>
            If any provision or clause of these Terms and Conditions is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such invalidity shall not affect the remaining portions of this agreement. The remaining clauses shall continue in full force and effect as if the invalid portion had been omitted.
          </p>
          <h4 style={{ fontSize: "14px", color: "#334155", fontWeight: "600", marginBottom: "8px" }}>8.2 Amendments and Updates</h4>
          <p style={{ marginBottom: "16px" }}>
            RBSC Solar reserves the right, at its sole discretion, to modify, update, or revise these Terms and Conditions at any time to reflect changes in cloud infrastructure, legal regulations, or operational upgrades. Any modifications will become effective immediately upon being posted on our official portal. Continued utilization of our services post-update implies complete acceptance of the revised terms.
          </p>

          <p style={{ marginTop: "32px", fontSize: "13px", fontWeight: "600", color: "#1e293b", textAlign: "center", background: "#f1f5f9", padding: "12px", borderRadius: "8px" }}>
            By checking the "I Agree" box, you formally declare that you have full legal capacity to consent to these terms and willingly authorize RBSC Solar to process your records under these provisions.
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
