import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Download } from "lucide-react";
import { edgeFetch, EDGE, supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const LoanApprovedDocsTab = ({ ctx }) => {
  const {
    caseId,
    normalized,
    onRefresh,
    role,
    ownerDept,
    caseData
  } = ctx;

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null); // Track which doc is being deleted
  const fileInputRef = useRef(null);

  // Compute initial docs from normalized
  const allDocs = normalized?.documents || {};
  let initialLoanDocs = [];
  if (Array.isArray(allDocs)) {
      initialLoanDocs = allDocs.filter(d => d.name && d.name.includes("Loan Approved Document"));
  } else {
      initialLoanDocs = Object.entries(allDocs)
        .filter(([name]) => name.includes("Loan Approved Document"))
        .map(([name, url]) => ({ name, url }));
  }

  const [localDocs, setLocalDocs] = useState(initialLoanDocs);

  // Keep localDocs in sync if normalized changes (e.g. from polling/refresh)
  useEffect(() => {
      const docsObj = normalized?.documents || {};
      let updated = [];
      if (Array.isArray(docsObj)) {
          updated = docsObj.filter(d => d.name && d.name.includes("Loan Approved Document"));
      } else {
          updated = Object.entries(docsObj)
            .filter(([name]) => name.includes("Loan Approved Document"))
            .map(([name, url]) => ({ name, url }));
      }
      // Only update if lengths differ to avoid unnecessary re-renders
      setLocalDocs(prev => updated.length !== prev.length ? updated : prev);
  }, [normalized?.documents]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      toast.error(`"${file.name}" is not an allowed type. Use JPG, PNG, WebP, or PDF.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" exceeds 10 MB limit.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `loan_approved_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${caseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) {
        if (uploadError.message?.includes("Bucket not found")) {
            const retry = await supabase.storage.from("Documents").upload(filePath, file, { contentType: file.type });
            if (retry.error) throw retry.error;
        } else {
            throw uploadError;
        }
      }

      let urlData = supabase.storage.from("documents").getPublicUrl(filePath).data;
      if (!urlData?.publicUrl) {
        urlData = supabase.storage.from("Documents").getPublicUrl(filePath).data;
      }
      
      const docName = `Loan Approved Document - ${new Date().toLocaleDateString()} - ${Date.now()}`;

      // Update case documents in db
      const currentDocs = normalized?.documents || {};
      const newDocs = Array.isArray(currentDocs) 
        ? [...currentDocs, { name: docName, url: urlData.publicUrl, status: "Uploaded", uploaded_at: new Date().toISOString() }]
        : { ...currentDocs, [docName]: urlData.publicUrl };

      const { error: dbError } = await supabase
        .from("cases")
        .update({ documents: newDocs })
        .eq("id", caseId);

      if (dbError) throw dbError;

      // Mutate caseData directly so it survives tab switches without waiting for refresh cache
      if (caseData) {
        caseData.documents = newDocs;
      }

      // Optimistic UI Update
      setLocalDocs(prev => [...prev, { name: docName, url: urlData.publicUrl }]);

      toast.success("Loan Approved Document uploaded successfully");
    } catch (err) {
      console.error("Upload error", err);
      toast.error("Failed to upload document.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docNameToDelete) => {
    if (!window.confirm(`Are you sure you want to delete ${docNameToDelete}?`)) return;
    
    setDeleting(docNameToDelete);
    try {
      const currentDocs = normalized?.documents || {};
      let newDocs;
      
      if (Array.isArray(currentDocs)) {
        newDocs = currentDocs.filter(d => d.name !== docNameToDelete);
      } else {
        newDocs = { ...currentDocs };
        delete newDocs[docNameToDelete];
      }

      const { error: dbError } = await supabase
        .from("cases")
        .update({ documents: newDocs })
        .eq("id", caseId);

      if (dbError) throw dbError;

      // Mutate caseData directly
      if (caseData) {
        caseData.documents = newDocs;
      }

      // Optimistic UI Update
      setLocalDocs(prev => prev.filter(d => d.name !== docNameToDelete));

      toast.success("Document deleted successfully");
    } catch (err) {
      console.error("Delete error", err);
      toast.error("Failed to delete document.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          Loan Approved Documents
        </p>
      </div>

      <div style={{ marginBottom: "20px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
        <input
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleUpload}
        />
        <UploadCloud style={{ width: "32px", height: "32px", color: "#94a3b8", margin: "0 auto 12px" }} />
        <p style={{ fontSize: "13px", color: "#475569", marginBottom: "12px", fontWeight: 500 }}>
          Upload approved loan document
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: "#f59e0b",
            color: "#fff",
            border: "none",
            fontSize: "13px",
            fontWeight: 600,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
            boxShadow: "0 2px 4px rgba(245, 158, 11, 0.2)",
          }}
        >
          {uploading ? "Uploading..." : "Select File"}
        </button>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {localDocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8", fontSize: "13px" }}>
            No approved loan documents uploaded yet.
          </div>
        ) : (
          localDocs.map((doc, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText style={{ width: "16px", height: "16px", color: "#3b82f6" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{doc.name}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <a
                  href={`/viewer?url=${encodeURIComponent(doc.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "6px 12px",
                    background: "#f1f5f9",
                    color: "#334155",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    textDecoration: "none",
                  }}
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(doc.name)}
                  disabled={deleting === doc.name}
                  style={{
                    padding: "6px 12px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    cursor: deleting === doc.name ? "not-allowed" : "pointer",
                    opacity: deleting === doc.name ? 0.7 : 1,
                  }}
                >
                  {deleting === doc.name ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LoanApprovedDocsTab;
