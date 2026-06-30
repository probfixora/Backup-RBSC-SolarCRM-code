import React from 'react';
import { useSearchParams } from 'react-router-dom';

const DocumentViewer = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');

  if (!url) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>No document specified</h2>
        <p>Please provide a valid document URL.</p>
      </div>
    );
  }

  // Check if the URL points to an image
  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) != null || url.toLowerCase().includes("photo") || url.toLowerCase().includes("image");

  return (
    <div style={{ margin: 0, padding: 0, height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
      {isImage ? (
        <img 
          src={url} 
          alt="Document Viewer" 
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
        />
      ) : (
        <iframe 
          src={url} 
          style={{ width: '100%', height: '100%', border: 'none' }} 
          title="Document Viewer" 
        />
      )}
    </div>
  );
};

export default DocumentViewer;
