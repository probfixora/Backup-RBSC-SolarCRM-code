import React, { useState, useRef } from "react";
import { Camera, MapPin, UploadCloud, X, AlertCircle } from "lucide-react";
import { supabase, edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const InstallationPhotosTab = ({ ctx }) => {
  const {
    caseId,
    normalized,
    onRefresh,
    canUpdate
  } = ctx;

  const [uploading, setUploading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Parse existing installation photos from normalized.documents
  const allDocs = Object.entries(normalized.documents || {});
  const installationPhotos = allDocs.filter(([name]) => name.startsWith("INSTALLATION_PHOTO::"));

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = "";

    setGeoLoading(true);
    if (!navigator.geolocation) {
      setGeoLoading(false);
      toast.error("Geolocation is not supported by your browser. Cannot add GPS watermark.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        processAndUploadImage(file, lat, lng);
      },
      (err) => {
        setGeoLoading(false);
        toast.error("Could not get GPS location. Please allow location permissions.");
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  const processAndUploadImage = async (file, lat, lng) => {
    setGeoLoading(true);
    setUploading(true);

    let addressLine1 = "Location";
    let addressLine2 = "Address not available";
    
    try {
      const res = await fetch(`https://us1.locationiq.com/v1/reverse?key=pk.dbe75ca4c4cd6a9244918349e28e1524&lat=${lat}&lon=${lng}&format=json&accept-language=en`);
      const data = await res.json();
      
      let city = "Unknown City";
      let state = "Unknown State";
      
      if (data && data.address) {
        const addr = data.address;
        city = addr.city || addr.town || addr.village || addr.suburb || addr.county || "Unknown City";
        state = addr.state || "Unknown State";
        const country = addr.country || "India";
        addressLine1 = `${city}, ${state}, ${country}`;
        addressLine2 = data.display_name || addressLine2;
      }
      
      // Try to get the nearest specific landmark to provide exact precision
      try {
        const nearbyRes = await fetch(`https://us1.locationiq.com/v1/nearby?key=pk.dbe75ca4c4cd6a9244918349e28e1524&lat=${lat}&lon=${lng}&tag=amenity,building,landmark,office,shop,tourism,historic,leisure&radius=200&format=json&accept-language=en`);
        const nearbyData = await nearbyRes.json();
        
        if (Array.isArray(nearbyData) && nearbyData.length > 0) {
          const nearest = nearbyData[0];
          if (nearest.name) {
            addressLine1 = `${nearest.name}, ${city}, ${state}`;
            addressLine2 = `${nearest.name}, ${addressLine2}`;
          }
        }
      } catch (err) {
        console.error("Nearby POI fetch error:", err);
      }

    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
    
    setGeoLoading(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctxCanvas = canvas.getContext("2d");

        // Draw original image
        ctxCanvas.drawImage(img, 0, 0, img.width, img.height);

        // Calculate watermark sizes relative to image size
        const padding = Math.max(30, img.width * 0.03);
        const titleFontSize = Math.max(28, img.width * 0.04);
        const textFontSize = Math.max(20, img.width * 0.028);
        const mapSize = titleFontSize * 4.5;
        
        // Prepare text lines
        const dateObj = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', timeZoneName: 'short' };
        const dateStr = dateObj.toLocaleDateString("en-IN", dateOptions).replace(/\//g, '/');

        const line1 = addressLine1;
        const line2 = addressLine2;
        const line3 = `Lat ${lat}° Long ${lng}°`;
        const line4 = dateStr;

        // Draw a dark semi-transparent box at the bottom
        const boxHeight = mapSize + (padding * 2);
        const boxWidth = img.width - (padding * 2);
        const startX = padding;
        const startY = img.height - boxHeight - padding;

        ctxCanvas.fillStyle = "rgba(0, 0, 0, 0.7)"; 
        
        // roundRect polyfill logic just in case
        if (ctxCanvas.roundRect) {
          ctxCanvas.beginPath();
          ctxCanvas.roundRect(startX, startY, boxWidth, boxHeight, 15);
          ctxCanvas.fill();
        } else {
          ctxCanvas.fillRect(startX, startY, boxWidth, boxHeight);
        }

        // Draw Map Square placeholder (Left side)
        const mapX = startX + padding;
        const mapY = startY + padding;
        
        ctxCanvas.fillStyle = "#e5e3df";
        if (ctxCanvas.roundRect) {
          ctxCanvas.beginPath();
          ctxCanvas.roundRect(mapX, mapY, mapSize, mapSize, 8);
          ctxCanvas.fill();
        } else {
          ctxCanvas.fillRect(mapX, mapY, mapSize, mapSize);
        }
        
        // Draw some "roads" (white lines) on the map placeholder
        ctxCanvas.strokeStyle = "#ffffff";
        ctxCanvas.lineWidth = 4;
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(mapX + mapSize * 0.3, mapY);
        ctxCanvas.lineTo(mapX + mapSize * 0.3, mapY + mapSize);
        ctxCanvas.moveTo(mapX, mapY + mapSize * 0.6);
        ctxCanvas.lineTo(mapX + mapSize, mapY + mapSize * 0.6);
        ctxCanvas.stroke();
        
        // Draw a red pin
        ctxCanvas.fillStyle = "#ea4335";
        const pinX = mapX + mapSize / 2;
        const pinY = mapY + mapSize / 2;
        ctxCanvas.beginPath();
        ctxCanvas.arc(pinX, pinY - 10, 8, 0, Math.PI * 2);
        ctxCanvas.fill();
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(pinX - 8, pinY - 10);
        ctxCanvas.lineTo(pinX + 8, pinY - 10);
        ctxCanvas.lineTo(pinX, pinY + 8);
        ctxCanvas.fill();

        // Draw "GPS Map" text at bottom of map placeholder
        ctxCanvas.fillStyle = "#000000";
        ctxCanvas.font = `bold ${textFontSize * 0.7}px sans-serif`;
        ctxCanvas.fillText("GPS Map", mapX + 8, mapY + mapSize - 12);

        // Draw Texts
        const textStartX = mapX + mapSize + padding;
        
        ctxCanvas.fillStyle = "#ffffff";
        ctxCanvas.shadowColor = "rgba(0,0,0,0.8)";
        ctxCanvas.shadowBlur = 4;
        
        // Title (Line 1)
        ctxCanvas.font = `bold ${titleFontSize}px sans-serif`;
        ctxCanvas.fillText(line1, textStartX, mapY + titleFontSize - 4);
        
        // Subtexts
        ctxCanvas.font = `normal ${textFontSize}px sans-serif`;
        const lineSpacing = textFontSize * 1.4;
        let currentY = mapY + titleFontSize + lineSpacing - 2;
        
        // Wrap line2 if it's too long
        const maxTextWidth = boxWidth - mapSize - (padding * 3);
        const drawWrappedText = (text, x, y, maxWidth, lineHeight) => {
          const words = text.split(' ');
          let line = '';
          for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctxCanvas.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctxCanvas.fillText(line, x, y);
              line = words[n] + ' ';
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctxCanvas.fillText(line, x, y);
          return y;
        };
        
        currentY = drawWrappedText(line2, textStartX, currentY, maxTextWidth, lineSpacing);
        currentY += lineSpacing * 1.2;
        ctxCanvas.fillText(line3, textStartX, currentY);
        currentY += lineSpacing;
        ctxCanvas.fillText(line4, textStartX, currentY);

        // Convert to Blob and Upload
        canvas.toBlob(async (blob) => {
          try {
            const fileName = `${caseId}_InstallationPhoto_${Date.now()}.png`;
            const filePath = `${caseId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("documents")
              .upload(filePath, blob, { contentType: "image/png" });
            
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            // Update Case documents JSON
            const newDocName = `INSTALLATION_PHOTO::Photo_${Date.now()}`;
            const newDocs = { ...(normalized.documents || {}), [newDocName]: publicUrl };
            
            await edgeFetch(EDGE.workflow, {
              action: "update_details",
              caseId,
              documents: newDocs
            });

            toast.success("GPS photo uploaded successfully!");
            onRefresh();
          } catch (err) {
            toast.error("Failed to upload photo: " + err.message);
          } finally {
            setUploading(false);
          }
        }, "image/png", 0.9);
      };
      img.onerror = () => {
        setUploading(false);
        toast.error("Failed to read image.");
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (docName) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    
    setUploading(true);
    try {
      const newDocs = { ...(normalized.documents || {}) };
      delete newDocs[docName];
      
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        documents: newDocs
      });

      toast.success("Photo deleted.");
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete photo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>Installation Site Photos</h3>
      </div>

      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", textAlign: "center" }}>
          <div style={{ background: "#e0e7ff", padding: "12px", borderRadius: "50%", color: "#4f46e5" }}>
            <MapPin size={24} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "14px" }}>GPS Camera Upload</h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "12px", maxWidth: "280px" }}>
              Take a live photo of the installation site. GPS location and timestamp will be automatically watermarked on the image.
            </p>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleCapture} 
            style={{ display: "none" }} 
          />
          
          <button
            onClick={triggerCamera}
            disabled={uploading || geoLoading || !canUpdate}
            style={{
              marginTop: "8px",
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
              cursor: (uploading || geoLoading || !canUpdate) ? "not-allowed" : "pointer",
              opacity: (uploading || geoLoading || !canUpdate) ? 0.7 : 1,
              transition: "transform 0.15s",
            }}
          >
            {geoLoading ? (
              <>Fetching GPS...</>
            ) : uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Camera size={18} />
                Open GPS Camera
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {installationPhotos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8", fontSize: "13px" }}>
            No installation photos uploaded yet.
          </div>
        ) : (
          installationPhotos.map(([docName, docUrl]) => (
            <div key={docName} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                  <img src={docUrl} alt="Installation Photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                  {docName.replace("INSTALLATION_PHOTO::", "")}
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
                    onClick={() => handleDeletePhoto(docName)}
                    style={{ padding: "6px 10px", background: "#fee2e2", color: "#ef4444", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Delete Photo"
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

export default InstallationPhotosTab;
