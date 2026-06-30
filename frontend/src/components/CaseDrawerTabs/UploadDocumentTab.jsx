import React, { useState, useRef } from "react";
import { UploadCloud, X, FileText } from "lucide-react";
import { supabase, edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const UploadDocumentTab = ({ ctx }) => {
  const {
    caseId,
    normalized,
    onRefresh,
    canUpdate
  } = ctx;

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Parse existing electrical documents from normalized.documents
  const allDocs = Object.entries(normalized.documents || {});
  const uploadedDocs = allDocs.filter(([name]) => name.startsWith("ELECTRICAL_DOC::"));

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${caseId}_ElectricalDoc_${Date.now()}.${ext}`;
      const filePath = `${caseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { contentType: file.type || "application/pdf" });
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const newDocName = `ELECTRICAL_DOC::${file.name}`;
      const newDocs = { ...(normalized.documents || {}), [newDocName]: publicUrl };
      
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        documents: newDocs
      });

      toast.success("Document uploaded successfully!");
      onRefresh();
    } catch (err) {
      toast.error("Failed to upload document: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docName) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    setUploading(true);
    try {
      const newDocs = { ...(normalized.documents || {}) };
      delete newDocs[docName];
      
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        documents: newDocs
      });

      toast.success("Document deleted.");
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete document: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>Upload Documents</h3>
      </div>

      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", textAlign: "center" }}>
          <div style={{ background: "#e0e7ff", padding: "12px", borderRadius: "50%", color: "#4f46e5" }}>
            <UploadCloud size={24} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "14px" }}>Document Upload</h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "12px", maxWidth: "280px" }}>
              Upload any required documents for net metering or electrical verification.
            </p>
          </div>
          
          <input 
            type="file" 
            accept=".pdf,image/*" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            style={{ display: "none" }} 
          />
          
          <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={triggerUpload}
              disabled={uploading || !canUpdate}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: (uploading || !canUpdate) ? "not-allowed" : "pointer",
                opacity: (uploading || !canUpdate) ? 0.7 : 1,
                transition: "transform 0.15s",
              }}
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {uploadedDocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8", fontSize: "13px" }}>
            No documents uploaded yet.
          </div>
        ) : (
          uploadedDocs.map(([docName, docUrl]) => (
            <div key={docName} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} style={{ color: "#64748b" }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                  {docName.replace("ELECTRICAL_DOC::", "")}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <a
                  href={`/viewer?url=${encodeURIComponent(docUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "6px 12px", background: "#f1f5f9", color: "#334155", fontSize: "12px", fontWeight: 600, borderRadius: "6px", textDecoration: "none" }}
                >
                  View
                </a>
                {canUpdate && (
                  <button
                    onClick={() => handleDeleteDoc(docName)}
                    style={{ padding: "6px 10px", background: "#fee2e2", color: "#ef4444", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Delete Document"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UploadDocumentTab;
