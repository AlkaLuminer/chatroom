// src/components/Chat/MessageBubble.jsx
import React, { useState, useRef, useEffect } from "react";
import { editMessage, unsendMessage } from "../../firebase/firestore";
import { format } from "date-fns";
import ImageLightbox from "../Shared/ImageLightbox";
import "./MessageBubble.css";

export default function MessageBubble({ message, isOwn, roomId, prevMessage }) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const menuRef = useRef(null);

  const showAvatar = !isOwn && prevMessage?.senderId !== message.senderId;
  const showName   = !isOwn && showAvatar;

  const timestamp = message.createdAt?.toDate
    ? format(message.createdAt.toDate(), "HH:mm")
    : "";

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleEdit = async () => {
    if (!editValue.trim() || editValue === message.content) { setEditing(false); return; }
    await editMessage(roomId, message.id, editValue.trim());
    setEditing(false);
    setShowMenu(false);
  };

  const handleUnsend = async () => {
    if (window.confirm("Unsend this message?")) {
      await unsendMessage(roomId, message.id);
    }
    setShowMenu(false);
  };

  if (message.deleted) {
    return (
      <div className={`bubble-row ${isOwn ? "own" : ""}`}>
        <div className="bubble bubble-deleted">🚫 This message was unsent</div>
      </div>
    );
  }

  return (
    <>
      <div className={`bubble-row ${isOwn ? "own" : ""} anim-message`}>
        {!isOwn && (
          <div className="bubble-avatar">
            {showAvatar ? (
              message.senderPhoto ? (
                <img src={message.senderPhoto} alt={message.senderName} className="avatar" style={{ width: 32, height: 32 }} />
              ) : (
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                  {message.senderName?.[0]?.toUpperCase() || "?"}
                </div>
              )
            ) : (
              <div style={{ width: 32 }} />
            )}
          </div>
        )}

        <div className="bubble-content-wrap">
          {showName && <div className="bubble-sender">{message.senderName}</div>}

          <div className="bubble-with-menu" ref={menuRef}>
            {editing ? (
              <div className={`bubble ${isOwn ? "bubble-own" : "bubble-other"} bubble-editing`}>
                <input
                  className="bubble-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  autoFocus
                />
                <div className="bubble-edit-actions">
                  <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={handleEdit}>Save</button>
                </div>
              </div>
            ) : (
              <div
                className={`bubble ${isOwn ? "bubble-own" : "bubble-other"}`}
                onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
                onDoubleClick={() => isOwn && message.type !== "image" && setEditing(true)}
              >
                {message.type === "image" ? (
                  <img
                    src={message.content}
                    alt="shared"
                    className="bubble-image"
                    onClick={() => setLightboxSrc(message.content)}
                  />
                ) : (
                  <span className="bubble-text">{message.content}</span>
                )}
                <div className="bubble-meta">
                  <span>{timestamp}</span>
                  {message.editedAt && <span className="bubble-edited">edited</span>}
                </div>
              </div>
            )}

            {/* Context Menu */}
            {showMenu && (
              <div className={`bubble-menu anim-pop-in ${isOwn ? "menu-left" : "menu-right"}`}>
                {isOwn && message.type !== "image" && (
                  <button className="bubble-menu-item" onClick={() => { setEditing(true); setShowMenu(false); }}>
                    ✏️ Edit
                  </button>
                )}
                {isOwn && (
                  <button className="bubble-menu-item danger" onClick={handleUnsend}>
                    🗑 Unsend
                  </button>
                )}
                {message.type === "image" && (
                  <button className="bubble-menu-item" onClick={() => { setLightboxSrc(message.content); setShowMenu(false); }}>
                    🔍 View Image
                  </button>
                )}
                {message.type !== "image" && (
                  <button className="bubble-menu-item" onClick={() => { navigator.clipboard.writeText(message.content); setShowMenu(false); }}>
                    📋 Copy
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
