// src/components/Shared/ImageLightbox.jsx
import React, { useEffect } from "react";
import "./ImageLightbox.css";

export default function ImageLightbox({ src, onClose }) {
  // 按 Escape 關閉
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>
        <img src={src} alt="fullsize" className="lightbox-image anim-pop-in" />
      </div>
    </div>
  );
}
